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
    targetBusinessRatio = 100,
    vacationDates = [],
    customHolidays = [],
    holidayNames = {}
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
    const reason = getHolidayReason(dateStr, vacationDates, customHolidays, holidayNames);
    if (reason) {
      holidayReasons[dateStr] = reason;
    } else {
      workdays.push(dateStr);
    }
  });

  const workdayCount = workdays.length;

  // 목표 업무용 사용거리 및 비업무용 사용거리 정밀 산출
  const clampedRatio = Math.max(0, Math.min(100, targetBusinessRatio));
  const targetBusinessDistance = Math.round((totalRequiredDistance * clampedRatio) / 100);
  const targetNonBusinessDistance = totalRequiredDistance - targetBusinessDistance;

  // 평일 주행거리 할당 계산
  const dailyCommuteList: Record<string, number> = {};
  const dailyBusinessList: Record<string, number> = {};
  const dailyNonBusinessList: Record<string, number> = {};

  if (workdayCount > 0) {
    // 1) 기본 출퇴근 거리 계산
    let effectiveCommute = Math.max(0, commuteDistance);
    let totalCommuteTarget = effectiveCommute * workdayCount;

    // 출퇴근거리 총합이 목표 업무거리를 초과하지 않도록 자동 조정
    if (totalCommuteTarget > targetBusinessDistance) {
      effectiveCommute = Math.floor(targetBusinessDistance / workdayCount);
      totalCommuteTarget = effectiveCommute * workdayCount;
    }

    let remainingBusiness = targetBusinessDistance - totalCommuteTarget;

    // 출퇴근거리 할당
    workdays.forEach(d => {
      dailyCommuteList[d] = effectiveCommute;
      dailyBusinessList[d] = 0;
      dailyNonBusinessList[d] = 0;
    });

    // 2) 일반 업무용 거리 가중치 무작위 분배
    if (remainingBusiness > 0) {
      const weights: number[] = workdays.map((d, idx) => {
        const pseudoRandom = Math.abs(Math.sin((idx + 1) * 997 + remainingBusiness));
        return 0.5 + pseudoRandom * 1.5;
      });

      const totalWeight = weights.reduce((a, b) => a + b, 0);
      let allocatedSum = 0;

      workdays.forEach((d, idx) => {
        if (idx === workdayCount - 1) {
          dailyBusinessList[d] = remainingBusiness - allocatedSum;
        } else {
          const share = Math.floor((remainingBusiness * weights[idx]) / totalWeight);
          dailyBusinessList[d] = share;
          allocatedSum += share;
        }
      });
    }

    // 3) 비업무용 거리 평일 분배
    if (targetNonBusinessDistance > 0) {
      let allocatedNonBizSum = 0;
      workdays.forEach((d, idx) => {
        if (idx === workdayCount - 1) {
          dailyNonBusinessList[d] = targetNonBusinessDistance - allocatedNonBizSum;
        } else {
          const share = Math.floor(targetNonBusinessDistance / workdayCount);
          dailyNonBusinessList[d] = share;
          allocatedNonBizSum += share;
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
    let nonBusiness = 0;
    let total = 0;
    let remarks = '';

    if (isHoliday) {
      commute = 0;
      business = 0;
      nonBusiness = 0;
      total = 0;
      remarks = holidayReasons[dateStr] || '휴무';
    } else {
      commute = dailyCommuteList[dateStr] || 0;
      business = dailyBusinessList[dateStr] || 0;
      nonBusiness = dailyNonBusinessList[dateStr] || 0;
      total = commute + business + nonBusiness;

      if (nonBusiness > 0 && (commute > 0 || business > 0)) {
        remarks = '업무 및 비업무 병행';
      } else if (business > 0) {
        remarks = '업무 출장 및 방문';
      } else {
        remarks = '출퇴근';
      }
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
