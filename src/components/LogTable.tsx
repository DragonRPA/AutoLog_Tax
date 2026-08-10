import React from 'react';
import { LogbookInput, MonthlySheetData, AutoLogResult } from '@/types/logbook';

interface LogTableProps {
  input: LogbookInput;
  result: AutoLogResult;
  currentSheet: MonthlySheetData;
}

export const LogTable: React.FC<LogTableProps> = ({ input, result, currentSheet }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-6">
      {/* 1. 상단 국세청 헤더 서식 재현 */}
      <div className="border-2 border-slate-800 dark:border-slate-200 rounded-lg p-4 mb-6 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center text-center">
          {/* 과세기간 */}
          <div className="md:col-span-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 rounded">
            <div className="text-xs font-bold text-slate-500 whitespace-nowrap">과 세 기 간</div>
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-mono mt-1 whitespace-nowrap">
              {result.taxPeriodStart.replace(/-/g, '.')} ~ {result.taxPeriodEnd.replace(/-/g, '.')}
            </div>
          </div>

          {/* 서식 제목 */}
          <div className="md:col-span-5 text-center">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight whitespace-nowrap">
              업무용승용차 운행기록부
            </h2>
            <p className="text-xs text-sky-600 dark:text-sky-400 font-medium mt-1 whitespace-nowrap">
              시트명: [{currentSheet.sheetName}]
            </p>
          </div>

          {/* 상호명 및 사업자번호 */}
          <div className="md:col-span-4 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs rounded overflow-hidden">
            <div className="grid grid-cols-2 border-b border-slate-200 dark:border-slate-700">
              <div className="bg-slate-100 dark:bg-slate-700/50 p-2 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap border-r border-slate-200 dark:border-slate-700">
                상호명
              </div>
              <div className="p-2 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                {input.companyName}
              </div>
            </div>
            <div className="grid grid-cols-2">
              <div className="bg-slate-100 dark:bg-slate-700/50 p-2 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap border-r border-slate-200 dark:border-slate-700">
                사업자번호
              </div>
              <div className="p-2 font-mono text-slate-900 dark:text-slate-100 whitespace-nowrap">
                {input.bizRegNumber}
              </div>
            </div>
          </div>
        </div>

        {/* 1. 기본정보 */}
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 whitespace-nowrap">
            1. 기본정보
          </div>
          <div className="grid grid-cols-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs rounded text-center overflow-hidden">
            <div className="border-r border-slate-300 dark:border-slate-700">
              <div className="bg-slate-100 dark:bg-slate-700/50 p-1.5 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap border-b border-slate-300 dark:border-slate-700">
                ①차 종
              </div>
              <div className="p-2 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                {input.vehicleModel}
              </div>
            </div>
            <div className="border-r border-slate-300 dark:border-slate-700">
              <div className="bg-slate-100 dark:bg-slate-700/50 p-1.5 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap border-b border-slate-300 dark:border-slate-700">
                ②자동차등록번호
              </div>
              <div className="p-2 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                {input.licensePlate}
              </div>
            </div>
            <div>
              <div className="bg-slate-100 dark:bg-slate-700/50 p-1.5 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap border-b border-slate-300 dark:border-slate-700">
                유종
              </div>
              <div className="p-2 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                {input.fuelType}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 업무용 사용비율 계산 데이터 테이블 */}
      <div className="mb-2 flex items-center justify-between">
        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
          2. 업무용 사용비율 계산 ({currentSheet.sheetName})
        </div>
        <div className="text-[11px] text-slate-500 flex items-center gap-3 whitespace-nowrap">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-emerald-200 dark:bg-emerald-800 border border-emerald-400"></span>
            <span>특수 출장 일정</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-amber-200 dark:bg-amber-800 border border-amber-400"></span>
            <span>휴무/공휴일</span>
          </span>
        </div>
      </div>

      <div className="overflow-x-auto border border-slate-300 dark:border-slate-700 rounded-lg shadow-inner">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-center font-semibold">
              <th className="border border-slate-300 dark:border-slate-700 p-2 whitespace-nowrap" rowSpan={2}>
                ③사용 일자(요일)
              </th>
              <th className="border border-slate-300 dark:border-slate-700 p-2 whitespace-nowrap" colSpan={2}>
                ④사용자
              </th>
              <th className="border border-slate-300 dark:border-slate-700 p-2 whitespace-nowrap" colSpan={6}>
                운 행 내 역
              </th>
              <th className="border border-slate-300 dark:border-slate-700 p-2 whitespace-nowrap" rowSpan={2}>
                ⑩비 고
              </th>
            </tr>
            <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-center font-semibold">
              <th className="border border-slate-300 dark:border-slate-700 p-1.5 whitespace-nowrap">부 서</th>
              <th className="border border-slate-300 dark:border-slate-700 p-1.5 whitespace-nowrap">성 명</th>
              <th className="border border-slate-300 dark:border-slate-700 p-1.5 whitespace-nowrap">
                ⑤주행 전 계기판(km)
              </th>
              <th className="border border-slate-300 dark:border-slate-700 p-1.5 whitespace-nowrap">
                ⑥주행 후 계기판(km)
              </th>
              <th className="border border-slate-300 dark:border-slate-700 p-1.5 whitespace-nowrap">
                ⑦주행거리(km)
              </th>
              <th className="border border-slate-300 dark:border-slate-700 p-1.5 whitespace-nowrap">
                ⑧출·퇴근용(km)
              </th>
              <th className="border border-slate-300 dark:border-slate-700 p-1.5 whitespace-nowrap">
                ⑨일반 업무용(km)
              </th>
            </tr>
          </thead>
          <tbody>
            {currentSheet.entries.map(entry => (
              <tr
                key={entry.date}
                className={`hover:bg-sky-50/50 dark:hover:bg-sky-950/20 transition-colors ${
                  entry.isSpecialSchedule
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 font-semibold'
                    : entry.isHolidayOrWeekend
                    ? 'bg-amber-50/40 dark:bg-amber-950/20 text-slate-500'
                    : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100'
                }`}
              >
                <td className="border border-slate-200 dark:border-slate-800 p-2 text-center font-mono whitespace-nowrap">
                  {entry.date} ({entry.dayOfWeek})
                </td>
                <td className="border border-slate-200 dark:border-slate-800 p-2 text-center whitespace-nowrap">
                  {entry.deptName}
                </td>
                <td className="border border-slate-200 dark:border-slate-800 p-2 text-center whitespace-nowrap">
                  {entry.driverName}
                </td>
                <td className="border border-slate-200 dark:border-slate-800 p-2 text-right font-mono whitespace-nowrap">
                  {entry.startOdometer.toLocaleString()}
                </td>
                <td className="border border-slate-200 dark:border-slate-800 p-2 text-right font-mono whitespace-nowrap">
                  {entry.endOdometer.toLocaleString()}
                </td>
                <td className="border border-slate-200 dark:border-slate-800 p-2 text-right font-mono whitespace-nowrap font-medium">
                  {entry.totalDistance > 0 ? entry.totalDistance.toLocaleString() : '-'}
                </td>
                <td className="border border-slate-200 dark:border-slate-800 p-2 text-right font-mono whitespace-nowrap">
                  {entry.commuteDistance > 0 ? entry.commuteDistance.toLocaleString() : '-'}
                </td>
                <td className="border border-slate-200 dark:border-slate-800 p-2 text-right font-mono whitespace-nowrap">
                  {entry.businessDistance > 0 ? entry.businessDistance.toLocaleString() : '-'}
                </td>
                <td className="border border-slate-200 dark:border-slate-800 p-2 text-center whitespace-nowrap">
                  {entry.isSpecialSchedule ? (
                    <span className="inline-flex items-center px-2 py-0.5 bg-emerald-200/80 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 rounded text-[11px] font-bold">
                      {entry.remarks}
                    </span>
                  ) : (
                    entry.remarks
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            {/* 하단 요약 행 (11, 12, 13번 국세청 지정 셀) */}
            <tr className="bg-slate-100 dark:bg-slate-800 font-bold border-t-2 border-slate-400 dark:border-slate-600">
              <td colSpan={4} className="border border-slate-300 dark:border-slate-700 p-2.5 text-center text-slate-700 dark:text-slate-300 whitespace-nowrap">
                월별 합계 및 과세기간 총계
              </td>
              <td colSpan={2} className="border border-slate-300 dark:border-slate-700 p-2 text-center text-xs whitespace-nowrap">
                ⑪과세기간 총주행 거리(km)
              </td>
              <td colSpan={2} className="border border-slate-300 dark:border-slate-700 p-2 text-center text-xs whitespace-nowrap bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200">
                과세기간 업무용 사용거리(km)
              </td>
              <td colSpan={2} className="border border-slate-300 dark:border-slate-700 p-2 text-center text-xs whitespace-nowrap bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200">
                ⑬업무사용비율
              </td>
            </tr>
            <tr className="bg-white dark:bg-slate-900 font-bold text-sm">
              <td colSpan={4} className="border border-slate-300 dark:border-slate-700 p-2 text-center text-xs text-slate-500 whitespace-nowrap">
                수식 계산결과
              </td>
              <td colSpan={2} className="border border-slate-300 dark:border-slate-700 p-2 text-right font-mono text-slate-900 dark:text-slate-100 whitespace-nowrap">
                {currentSheet.totalPeriodDistance.toLocaleString()} km
              </td>
              <td colSpan={2} className="border border-slate-300 dark:border-slate-700 p-2 text-right font-mono bg-yellow-200 dark:bg-yellow-900/60 text-slate-900 dark:text-yellow-100 whitespace-nowrap">
                {currentSheet.totalBusinessDistance.toLocaleString()} km
              </td>
              <td colSpan={2} className="border border-slate-300 dark:border-slate-700 p-2 text-center font-mono bg-yellow-200 dark:bg-yellow-900/60 text-sky-700 dark:text-sky-300 whitespace-nowrap text-base">
                {currentSheet.businessRatio.toFixed(1)}%
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
