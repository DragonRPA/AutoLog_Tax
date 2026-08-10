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
  AutoLogResult,
  SpecialScheduleItem
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
    minDailyDistance,
    maxDailyDistance,
    specialSchedules = [],
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

  // 특수 일정 맵 생성 (날짜 -> { distance, remarks })
  const specialMap: Record<string, SpecialScheduleItem> = {};
  let totalSpecialDistance = 0;

  specialSchedules.forEach(item => {
    if (item.date && item.distance > 0) {
      specialMap[item.date] = item;
      totalSpecialDistance += item.distance;
    }
  });

  if (totalSpecialDistance > totalRequiredDistance) {
    throw new Error(
      `특수 일정 주행거리 합계(${totalSpecialDistance.toLocaleString()}km)가 총 필요 주행거리(${totalRequiredDistance.toLocaleString()}km)를 초과합니다.`
    );
  }

  // 과세기간 표기 산출 (작성 시작일 속한 연도 1년)
  const startYear = getYear(startParsed);
  const taxPeriodStart = `${startYear}-01-01`;
  const taxPeriodEnd = `${startYear}-12-31`;

  // 작성 기간 내 모든 날짜 배열 생성
  const allDays = eachDayOfInterval({ start: startParsed, end: endParsed });
  const allDateStrs = allDays.map(d => format(d, 'yyyy-MM-dd'));

  // 날짜 구획 분류 (휴무일 / 특수일정 / 일반평일)
  const normalWorkdays: string[] = [];
  const holidayReasons: Record<string, string> = {};

  allDateStrs.forEach(dateStr => {
    const reason = getHolidayReason(dateStr, vacationDates, customHolidays, holidayNames);
    if (reason) {
      holidayReasons[dateStr] = reason;
    } else if (!specialMap[dateStr]) {
      normalWorkdays.push(dateStr);
    }
  });

  const normalWorkdayCount = normalWorkdays.length;
  const normalTargetDistance = totalRequiredDistance - totalSpecialDistance;

  // 일반 평일 난수 분배 (광범위 난수 가중치 및 최소/최대 제어)
  const dailyTotalList: Record<string, number> = {};

  if (normalWorkdayCount > 0) {
    const userMin = minDailyDistance !== undefined && !isNaN(minDailyDistance) ? Math.max(0, minDailyDistance) : 0;
    const userMax = maxDailyDistance !== undefined && !isNaN(maxDailyDistance) && maxDailyDistance > 0
      ? maxDailyDistance
      : Math.ceil(normalTargetDistance / Math.max(1, normalWorkdayCount) * 2.5);

    // 넓은 범위 난수 생성기 (지수형 파동 및 시드 난수 적용으로 고른 분포 지양)
    const rawWeights: number[] = normalWorkdays.map((dateStr, idx) => {
      // 넓은 분산을 위해 비선형 함수(지수 + 사인 파동) 결합
      const seed1 = Math.abs(Math.sin((idx + 1) * 31337 + normalTargetDistance));
      const seed2 = Math.abs(Math.cos((idx + 1) * 7919));
      const wideVariance = Math.pow(seed1, 2.5) * 3.5 + seed2 * 0.5;
      return Math.max(0.1, wideVariance);
    });

    const totalWeight = rawWeights.reduce((a, b) => a + b, 0);
    let allocatedSum = 0;

    normalWorkdays.forEach((dateStr, idx) => {
      if (idx === normalWorkdayCount - 1) {
        // 마지막 날 단수 차이 보정하여 총 필요거리 100% 일치
        let finalVal = normalTargetDistance - allocatedSum;
        if (finalVal < 0) finalVal = 0;
        dailyTotalList[dateStr] = finalVal;
      } else {
        let calculated = Math.floor((normalTargetDistance * rawWeights[idx]) / totalWeight);

        // 최소/최대 주행거리 제어 적용
        if (userMin > 0) calculated = Math.max(userMin, calculated);
        if (userMax > 0) calculated = Math.min(userMax, calculated);

        dailyTotalList[dateStr] = calculated;
        allocatedSum += calculated;
      }
    });
  } else if (normalTargetDistance > 0 && totalSpecialDistance === 0) {
    throw new Error('운행이 가능한 평일이 없습니다. 작성 기간 또는 휴가/공휴일 설정을 확인해주세요.');
  }

  // 일별 계기판 연속 누적 생성
  let currentOdometer = initialOdometer;
  const entries: DailyLogEntry[] = [];

  allDateStrs.forEach(dateStr => {
    const isHoliday = !!holidayReasons[dateStr];
    const isSpecial = !!specialMap[dateStr];
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
    } else if (isSpecial) {
      // 확정 특수 일정 (장거리 지방 출장 등)
      const spec = specialMap[dateStr];
      commute = 0;
      business = spec.distance;
      total = spec.distance;
      remarks = spec.remarks || '특수 장거리 출장';
    } else {
      // 일반 평일
      total = dailyTotalList[dateStr] || 0;
      const baseCommute = Math.max(0, commuteDistance);

      if (total >= baseCommute) {
        commute = baseCommute;
        business = total - baseCommute;
      } else {
        commute = total;
        business = 0;
      }

      remarks = business > 0 ? '업무 출장 및 방문' : (commute > 0 ? '출퇴근' : '운행 없음');
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
      holidayReason: holidayReasons[dateStr],
      isSpecialSchedule: isSpecial
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
