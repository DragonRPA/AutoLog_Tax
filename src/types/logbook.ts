export type FuelType = '휘발유' | '경유' | 'LPG' | '전기' | '하이브리드' | '수소';

export interface LogbookInput {
  companyName: string;        // 상호명 (예: (주)이렌컴)
  bizRegNumber: string;       // 사업자등록번호 (예: 206-81-25423)
  vehicleModel: string;       // 차종 (예: 싼타페)
  licensePlate: string;       // 자동차등록번호 (예: 122소2232)
  fuelType: FuelType;         // 유종 (예: 휘발유)
  deptName: string;           // 부서 (예: 신규영업팀)
  driverName: string;         // 성명 (예: 차승후)
  
  startDate: string;          // 운행일지 작성 시작일 (YYYY-MM-DD)
  endDate: string;            // 운행일지 작성 종료일 (YYYY-MM-DD)
  initialOdometer: number;    // 작성 시작일 계기판 (km)
  finalOdometer: number;      // 작성 종료일 계기판 (km)
  commuteDistance: number;    // 출퇴근용 주행거리 (km)
  
  vacationDates: string[];    // 휴가일 목록 (YYYY-MM-DD[])
  customHolidays: string[];   // 명절 및 법정공휴일/임시공휴일 날짜 목록 (YYYY-MM-DD[])
  holidayNames?: Record<string, string>; // 공휴일 명칭 맵 { '2026-01-01': '신정', '2026-10-02': '임시공휴일' }
}

export interface DailyLogEntry {
  date: string;               // YYYY-MM-DD
  dayOfWeek: string;          // 월, 화, 수, 목, 금, 토, 일
  deptName: string;           // 부서
  driverName: string;         // 성명
  startOdometer: number;      // 주행 전 계기판 (km) ⑤
  endOdometer: number;        // 주행 후 계기판 (km) ⑥
  totalDistance: number;      // 주행거리 (km) ⑦
  commuteDistance: number;    // 업무용 출퇴근 (km) ⑧
  businessDistance: number;   // 업무용 일반업무 (km) ⑨
  remarks: string;            // 비고 ⑩
  isHolidayOrWeekend: boolean;// 휴무일/주말 여부
  holidayReason?: string;     // 휴무 사유 (주말, 휴가, 설날 등)
}

export interface MonthlySheetData {
  sheetName: string;          // 예: "2026년01월"
  year: number;
  month: number;
  entries: DailyLogEntry[];
  totalPeriodDistance: number;  // ⑪ 과세기간 총주행 거리 (km)
  totalBusinessDistance: number;// ⑫ 과세기간 업무용 사용거리 (km)
  businessRatio: number;        // ⑬ 업무사용비율 (%)
}

export interface AutoLogResult {
  taxPeriodStart: string;     // 과세기간 시작일 (예: 2026-01-01)
  taxPeriodEnd: string;       // 과세기간 종료일 (예: 2026-12-31)
  monthlySheets: MonthlySheetData[];
  overallTotalDistance: number;
  overallBusinessDistance: number;
  overallBusinessRatio: number;
}
