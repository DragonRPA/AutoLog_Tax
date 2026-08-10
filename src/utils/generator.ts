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
  const monthlyNormalWorkdays: Record<string, string[]> = {};

  allDateStrs.forEach(dateStr => {
    const reason = getHolidayReason(dateStr, vacationDates, customHolidays, holidayNames);
    if (reason) {
      holidayReasons[dateStr] = reason;
    } else if (!specialMap[dateStr]) {
      normalWorkdays.push(dateStr);

      // 월별 그룹화 (YYYY년MM월)
      const dObj = parseISO(dateStr);
      const mKey = `${getYear(dObj)}년${String(getMonth(dObj) + 1).padStart(2, '0')}월`;
      if (!monthlyNormalWorkdays[mKey]) {
        monthlyNormalWorkdays[mKey] = [];
      }
      monthlyNormalWorkdays[mKey].push(dateStr);
    }
  });

  const normalWorkdayCount = normalWorkdays.length;
  const normalTargetDistance = totalRequiredDistance - totalSpecialDistance;

  // =========================================================================
  // [사용자 알고리즘 요구사항 1]: 출퇴근 거리 월별 60% 엄격 준수, 40% ±15% 무작위 증감
  // =========================================================================
  const baseCommute = Math.max(0, commuteDistance);
  const dailyCommuteList: Record<string, number> = {};

  Object.entries(monthlyNormalWorkdays).forEach(([mKey, monthDays]) => {
    const totalDaysInMonth = monthDays.length;
    if (totalDaysInMonth === 0) return;

    // 60%는 엄격 준수일수, 40%는 가변일수
    const strictCount = Math.round(totalDaysInMonth * 0.6);
    
    // 시드 기반 일수 셔플하여 60% 준수일과 40% 가변일 고르게 선정
    const indexedDays = monthDays.map((dateStr, idx) => {
      const pseudoRand = Math.abs(Math.sin((idx + 1) * 7919 + totalDaysInMonth));
      return { dateStr, pseudoRand };
    });

    // 난수 기준 정렬
    indexedDays.sort((a, b) => a.pseudoRand - b.pseudoRand);

    indexedDays.forEach((item, idx) => {
      if (idx < strictCount) {
        // 60% 근무일: 기준 출퇴근거리 100% 엄격 준수
        dailyCommuteList[item.dateStr] = baseCommute;
      } else {
        // 40% 근무일: 기준 출퇴근거리의 ±15% 범위 내 무작위 증감 (0.85 ~ 1.15)
        const randVariance = (Math.abs(Math.sin(idx * 31337 + 101)) * 0.3) - 0.15; // -0.15 ~ +0.15
        const variedCommute = Math.max(0, Math.round(baseCommute * (1 + randVariance)));
        dailyCommuteList[item.dateStr] = variedCommute;
      }
    });
  });

  // 전체 출퇴근 주행거리 합계 계산
  let totalCommuteSum = normalWorkdays.reduce((sum, d) => sum + (dailyCommuteList[d] || 0), 0);

  // 출퇴근 주행거리 합계가 평일 전체 목표 주행거리를 초과 시 비례 조정하여 우선 확보
  if (totalCommuteSum > normalTargetDistance && totalCommuteSum > 0) {
    const scale = normalTargetDistance / totalCommuteSum;
    totalCommuteSum = 0;
    normalWorkdays.forEach(d => {
      dailyCommuteList[d] = Math.floor((dailyCommuteList[d] || 0) * scale);
      totalCommuteSum += dailyCommuteList[d];
    });
  }

  // =========================================================================
  // [사용자 알고리즘 요구사항 2]: 출퇴근 주행을 먼저 확보 후 잔여 주행거리를 무작위 배분
  // =========================================================================
  const remainingBusinessTarget = Math.max(0, normalTargetDistance - totalCommuteSum);
  const dailyBusinessList: Record<string, number> = {};

  if (normalWorkdayCount > 0 && remainingBusinessTarget > 0) {
    const userMin = minDailyDistance !== undefined && !isNaN(minDailyDistance) ? Math.max(0, minDailyDistance) : 0;
    const userMax = maxDailyDistance !== undefined && !isNaN(maxDailyDistance) && maxDailyDistance > 0
      ? maxDailyDistance
      : Math.ceil(remainingBusinessTarget / Math.max(1, normalWorkdayCount) * 3.0);

    // 잔여 업무거리에 대한 광범위 무작위 파동 가중치 생성
    const rawWeights: number[] = normalWorkdays.map((dateStr, idx) => {
      const seed1 = Math.abs(Math.sin((idx + 1) * 31337 + remainingBusinessTarget));
      const seed2 = Math.abs(Math.cos((idx + 1) * 7919));
      const wideVariance = Math.pow(seed1, 2.5) * 3.5 + seed2 * 0.5;
      return Math.max(0.1, wideVariance);
    });

    const totalWeight = rawWeights.reduce((a, b) => a + b, 0);
    let allocatedSum = 0;

    normalWorkdays.forEach((dateStr, idx) => {
      if (idx === normalWorkdayCount - 1) {
        // 마지막 날 단수 차이 보정하여 잔여 주행거리 100% 정밀 일치
        let finalVal = remainingBusinessTarget - allocatedSum;
        if (finalVal < 0) finalVal = 0;
        dailyBusinessList[dateStr] = finalVal;
      } else {
        let calculated = Math.floor((remainingBusinessTarget * rawWeights[idx]) / totalWeight);
        if (userMin > 0) calculated = Math.max(userMin, calculated);
        if (userMax > 0) calculated = Math.min(userMax, calculated);

        dailyBusinessList[dateStr] = calculated;
        allocatedSum += calculated;
      }
    });
  }

  // 일별 계기판 연속 누적 및 운행일지 엔트리 생성
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
      // 확정 특수 일정 (장거리 지방 출장 등): 전체가 일반 업무용 거리에 포함
      const spec = specialMap[dateStr];
      commute = 0;
      business = spec.distance;
      total = spec.distance;
      remarks = spec.remarks || '특수 장거리 출장';
    } else {
      // 일반 평일: 출퇴근 거리 우선 확보 후 잔여 거리가 ⑨ 일반 업무용 거리
      commute = dailyCommuteList[dateStr] || 0;
      business = dailyBusinessList[dateStr] || 0;
      total = commute + business;

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

  // ⑪ 과세기간 총주행 거리 = sum(⑦ 총 주행거리)
  // ⑫ 과세기간 업무용 사용거리 = sum(⑨ 잔여 일반 업무용 거리) [출퇴근 주행거리 제외 잔여 업무거리]
  // ⑬ 업무사용비율 = (⑫ / ⑪) * 100%
  const overallTotalDistance = entries.reduce((sum, e) => sum + e.totalDistance, 0);
  const overallBusinessDistance = entries.reduce((sum, e) => sum + e.businessDistance, 0);
  const overallBusinessRatio =
    overallTotalDistance > 0 ? (overallBusinessDistance / overallTotalDistance) * 100 : 0.0;

  const monthlySheets: MonthlySheetData[] = Object.entries(monthlyMap).map(
    ([sheetName, monthEntries]) => {
      const dateObj = parseISO(monthEntries[0].date);
      const year = getYear(dateObj);
      const month = getMonth(dateObj) + 1;

      const totalPeriodDistance = monthEntries.reduce((sum, e) => sum + e.totalDistance, 0);
      const totalBusinessDistance = monthEntries.reduce((sum, e) => sum + e.businessDistance, 0);
      const businessRatio =
        totalPeriodDistance > 0
          ? (totalBusinessDistance / totalPeriodDistance) * 100
          : 0.0;

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
