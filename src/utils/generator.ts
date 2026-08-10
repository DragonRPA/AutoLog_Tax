import {
  parseISO,
  format,
  eachDayOfInterval,
  getYear,
  getMonth
} from 'date-fns';
import {
  LogbookInput,
  DailyLogEntry,
  MonthlySheetData,
  AutoLogResult
} from '@/types/logbook';
import { getDayOfWeekName, getHolidayReason } from './holidays';

export function generateAutoLogbook(input: LogbookInput): AutoLogResult {
  const {
    companyName,
    bizRegNumber,
    vehicleModel,
    licensePlate,
    fuelType,
    deptName,
    driverName,
    startDate,
    endDate,
    initialOdometer,
    finalOdometer,
    commuteDistance,
    vacationDates = [],
    customHolidays = []
  } = input;

  if (!startDate || !endDate) {
    throw new Error('시작일과 종료일을 입력해주세요.');
  }

  const startParsed = parseISO(startDate);
  const endParsed = parseISO(endDate);

  if (startParsed > endParsed) {
    throw new Error('시작일은 종료일보다 이전이어야 합니다.');
  }

  if (finalOdometer < initialOdometer) {
    throw new Error('종료 계기판 거리는 시작 계기판 거리보다 크거나 같아야 합니다.');
  }

  const totalRequiredDistance = finalOdometer - initialOdometer;

  // 과세기간 표기 산출 (작성 시작일 속한 연도 1년)
  const startYear = getYear(startParsed);
  const taxPeriodStart = `${startYear}-01-01`;
  const taxPeriodEnd = `${startYear}-12-31`;

  // 작성 기간 내 모든 날짜 배열 생성
  const allDays = eachDayOfInterval({ start: startParsed, end: endParsed });
  const allDateStrs = allDays.map(d => format(d, 'yyyy-MM-dd'));

  // 평일(운행 가능일) 목록 구하기
  const workdays: string[] = [];
  const holidayReasons: Record<string, string> = {};

  allDateStrs.forEach(dateStr => {
    const reason = getHolidayReason(dateStr, vacationDates, customHolidays);
    if (reason) {
      holidayReasons[dateStr] = reason;
    } else {
      workdays.push(dateStr);
    }
  });

  const workdayCount = workdays.length;

  // 평일 주행거리 할당 계산
  const dailyCommuteList: Record<string, number> = {};
  const dailyBusinessList: Record<string, number> = {};

  if (workdayCount > 0) {
    // 1) 기본 출퇴근 총합계 계산
    let effectiveCommute = Math.max(0, commuteDistance);
    let totalCommuteTarget = effectiveCommute * workdayCount;

    // 출퇴근거리 총합이 요구 주행거리를 초과하는 경우 자동 조정
    if (totalCommuteTarget > totalRequiredDistance) {
      effectiveCommute = Math.floor(totalRequiredDistance / workdayCount);
      totalCommuteTarget = effectiveCommute * workdayCount;
    }

    let remainingForBusiness = totalRequiredDistance - totalCommuteTarget;

    // 2) 출퇴근거리 할당
    workdays.forEach(d => {
      dailyCommuteList[d] = effectiveCommute;
      dailyBusinessList[d] = 0;
    });

    // 3) 남은 일반 업무거리 자연스러운 분배 (가중치 무작위 분배)
    if (remainingForBusiness > 0) {
      // 일별 가중치 할당 (자연스러운 렌탈/업무 운행 패턴)
      const weights: number[] = workdays.map((d, idx) => {
        // 주중 중 수/목/금 가중치 약간 높게, 무작위 요소 가미
        const pseudoRandom = Math.abs(Math.sin((idx + 1) * 997 + remainingForBusiness));
        return 0.5 + pseudoRandom * 1.5;
      });

      const totalWeight = weights.reduce((a, b) => a + b, 0);
      let allocatedSum = 0;

      workdays.forEach((d, idx) => {
        if (idx === workdayCount - 1) {
          // 마지막 평일은 단수 차이 보정하여 정확히 맞춤
          dailyBusinessList[d] = remainingForBusiness - allocatedSum;
        } else {
          const share = Math.floor((remainingForBusiness * weights[idx]) / totalWeight);
          dailyBusinessList[d] = share;
          allocatedSum += share;
        }
      });
    }
  }

  // 일별 계기판 연속 누적 생성
  let currentOdometer = initialOdometer;
  const entries: DailyLogEntry[] = [];

  allDateStrs.forEach(dateStr => {
    const isHoliday = !!holidayReasons[dateStr];
    const dayOfWeek = getDayOfWeekName(dateStr);

    let commute = 0;
    let business = 0;
    let total = 0;
    let remarks = '';

    if (isHoliday) {
      commute = 0;
      business = 0;
      total = 0;
      remarks = holidayReasons[dateStr] || '휴무';
    } else {
      commute = dailyCommuteList[dateStr] || 0;
      business = dailyBusinessList[dateStr] || 0;
      total = commute + business;
      remarks = business > 0 ? '업무 출장 및 방문' : '출퇴근';
    }

    const startOdometer = currentOdometer;
    const endOdometer = startOdometer + total;
    currentOdometer = endOdometer;

    entries.push({
      date: dateStr,
      dayOfWeek,
      deptName,
      driverName,
      startOdometer,
      endOdometer,
      totalDistance: total,
      commuteDistance: commute,
      businessDistance: business,
      remarks,
      isHolidayOrWeekend: isHoliday,
      holidayReason: holidayReasons[dateStr]
    });
  });

  // 월별 시트 분할 (`YYYY년MM월`)
  const monthlyMap: Record<string, DailyLogEntry[]> = {};

  entries.forEach(entry => {
    const dateObj = parseISO(entry.date);
    const yearStr = getYear(dateObj);
    const monthStr = String(getMonth(dateObj) + 1).padStart(2, '0');
    const sheetKey = `${yearStr}년${monthStr}월`;

    if (!monthlyMap[sheetKey]) {
      monthlyMap[sheetKey] = [];
    }
    monthlyMap[sheetKey].push(entry);
  });

  // 누적 과세기간 총계 계산
  const overallTotalDistance = entries.reduce((sum, e) => sum + e.totalDistance, 0);
  const overallBusinessDistance = entries.reduce(
    (sum, e) => sum + e.commuteDistance + e.businessDistance,
    0
  );
  const overallBusinessRatio =
    overallTotalDistance > 0 ? (overallBusinessDistance / overallTotalDistance) * 100 : 100.0;

  const monthlySheets: MonthlySheetData[] = Object.entries(monthlyMap).map(
    ([sheetName, monthEntries]) => {
      const dateObj = parseISO(monthEntries[0].date);
      const year = getYear(dateObj);
      const month = getMonth(dateObj) + 1;

      const totalPeriodDistance = monthEntries.reduce((sum, e) => sum + e.totalDistance, 0);
      const totalBusinessDistance = monthEntries.reduce(
        (sum, e) => sum + e.commuteDistance + e.businessDistance,
        0
      );
      const businessRatio =
        totalPeriodDistance > 0
          ? (totalBusinessDistance / totalPeriodDistance) * 100
          : 100.0;

      return {
        sheetName,
        year,
        month,
        entries: monthEntries,
        totalPeriodDistance,
        totalBusinessDistance,
        businessRatio
      };
    }
  );

  return {
    taxPeriodStart,
    taxPeriodEnd,
    monthlySheets,
    overallTotalDistance,
    overallBusinessDistance,
    overallBusinessRatio
  };
}
