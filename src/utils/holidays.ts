import { format, parseISO, getDay } from 'date-fns';

export interface HolidayInfo {
  date: string; // YYYY-MM-DD
  name: string;
}

// 2024년 ~ 2030년 한국 법정 공휴일 (명절/추석/설날 포함) 사전 계산 맵
const KOREAN_HOLIDAYS_MAP: Record<string, string> = {
  // 2024
  '2024-01-01': '신정',
  '2024-02-09': '설날 연휴',
  '2024-02-10': '설날',
  '2024-02-11': '설날 연휴',
  '2024-02-12': '대체공휴일',
  '2024-03-01': '삼일절',
  '2024-04-10': '국회의원 선거일',
  '2024-05-05': '어린이날',
  '2024-05-06': '대체공휴일',
  '2024-05-15': '부처님오신날',
  '2024-06-06': '현충일',
  '2024-08-15': '광복절',
  '2024-09-16': '추석 연휴',
  '2024-09-17': '추석',
  '2024-09-18': '추석 연휴',
  '2024-10-03': '개천절',
  '2024-10-09': '한글날',
  '2024-12-25': '성탄절',

  // 2025
  '2025-01-01': '신정',
  '2025-01-28': '설날 연휴',
  '2025-01-29': '설날',
  '2025-01-30': '설날 연휴',
  '2025-03-01': '삼일절',
  '2025-03-03': '대체공휴일',
  '2025-05-05': '어린이날/부처님오신날',
  '2025-05-06': '대체공휴일',
  '2025-06-06': '현충일',
  '2025-08-15': '광복절',
  '2025-10-03': '개천절',
  '2025-10-05': '추석 연휴',
  '2025-10-06': '추석',
  '2025-10-07': '추석 연휴',
  '2025-10-08': '대체공휴일',
  '2025-10-09': '한글날',
  '2025-12-25': '성탄절',

  // 2026
  '2026-01-01': '신정',
  '2026-02-16': '설날 연휴',
  '2026-02-17': '설날',
  '2026-02-18': '설날 연휴',
  '2026-03-01': '삼일절',
  '2026-03-02': '대체공휴일',
  '2026-05-05': '어린이날',
  '2026-05-24': '부처님오신날',
  '2026-05-25': '대체공휴일',
  '2026-06-06': '현충일',
  '2026-08-15': '광복절',
  '2026-08-17': '대체공휴일',
  '2026-09-24': '추석 연휴',
  '2026-09-25': '추석',
  '2026-09-26': '추석 연휴',
  '2026-10-03': '개천절',
  '2026-10-05': '대체공휴일',
  '2026-10-09': '한글날',
  '2026-12-25': '성탄절',

  // 2027
  '2027-01-01': '신정',
  '2027-02-06': '설날 연휴',
  '2027-02-07': '설날',
  '2027-02-08': '설날 연휴',
  '2027-02-09': '대체공휴일',
  '2027-03-01': '삼일절',
  '2027-05-05': '어린이날',
  '2027-05-13': '부처님오신날',
  '2027-06-06': '현충일',
  '2027-06-07': '대체공휴일',
  '2027-08-15': '광복절',
  '2027-08-16': '대체공휴일',
  '2027-09-14': '추석 연휴',
  '2027-09-15': '추석',
  '2027-09-16': '추석 연휴',
  '2027-10-03': '개천절',
  '2027-10-04': '대체공휴일',
  '2027-10-09': '한글날',
  '2027-10-11': '대체공휴일',
  '2027-12-25': '성탄절'
};

export function getStatutoryHolidaysForYear(year: number): HolidayInfo[] {
  const holidays: HolidayInfo[] = [];
  const yearPrefix = `${year}-`;

  Object.entries(KOREAN_HOLIDAYS_MAP).forEach(([dateStr, name]) => {
    if (dateStr.startsWith(yearPrefix)) {
      holidays.push({ date: dateStr, name });
    }
  });

  // 매년 고정 음력 외 양력 공휴일 백업 처리 (만약 맵에 없는 연도인 경우)
  if (holidays.length === 0) {
    const fixed = [
      { m: '01', d: '01', name: '신정' },
      { m: '03', d: '01', name: '삼일절' },
      { m: '05', d: '05', name: '어린이날' },
      { m: '06', d: '06', name: '현충일' },
      { m: '08', d: '15', name: '광복절' },
      { m: '10', d: '03', name: '개천절' },
      { m: '10', d: '09', name: '한글날' },
      { m: '12', d: '25', name: '성탄절' },
    ];
    fixed.forEach(item => {
      holidays.push({ date: `${year}-${item.m}-${item.d}`, name: item.name });
    });
  }

  return holidays.sort((a, b) => a.date.localeCompare(b.date));
}

export function isWeekend(dateStr: string): boolean {
  const date = parseISO(dateStr);
  const day = getDay(date);
  return day === 0 || day === 6; // 0: Sunday, 6: Saturday
}

export function getDayOfWeekName(dateStr: string): string {
  const date = parseISO(dateStr);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return days[getDay(date)];
}

export function getHolidayReason(
  dateStr: string,
  vacationDates: string[],
  customHolidays: string[]
): string | null {
  if (isWeekend(dateStr)) {
    const day = getDay(parseISO(dateStr));
    return day === 6 ? '토요일' : '일요일';
  }

  if (vacationDates.includes(dateStr)) {
    return '휴가';
  }

  if (customHolidays.includes(dateStr)) {
    return KOREAN_HOLIDAYS_MAP[dateStr] || '공휴일/휴무일';
  }

  if (KOREAN_HOLIDAYS_MAP[dateStr]) {
    return KOREAN_HOLIDAYS_MAP[dateStr];
  }

  return null;
}
