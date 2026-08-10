import React, { useState, useEffect } from 'react';
import { FuelType, LogbookInput } from '@/types/logbook';
import { getStatutoryHolidaysForYear, KOREAN_HOLIDAYS_MAP } from '@/utils/holidays';
import { Calendar, Plus, Trash2, RefreshCw, FileText, Download, Percent, Calculator } from 'lucide-react';

interface InputFormProps {
  onGenerate: (input: LogbookInput) => void;
  onDownloadExcel: () => void;
  hasGeneratedData: boolean;
  isGenerating: boolean;
  isDownloading: boolean;
}

export const InputForm: React.FC<InputFormProps> = ({
  onGenerate,
  onDownloadExcel,
  hasGeneratedData,
  isGenerating,
  isDownloading
}) => {
  const [companyName, setCompanyName] = useState('(주)이렌컴');
  const [bizRegNumber, setBizRegNumber] = useState('206-81-25423');
  const [vehicleModel, setVehicleModel] = useState('싼타페');
  const [licensePlate, setLicensePlate] = useState('122소2232');
  const [fuelType, setFuelType] = useState<FuelType>('휘발유');
  const [deptName, setDeptName] = useState('신규영업팀');
  const [driverName, setDriverName] = useState('차승후');

  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-12-31');
  const [initialOdometer, setInitialOdometer] = useState<number>(37288);
  const [finalOdometer, setFinalOdometer] = useState<number>(45800);
  const [commuteDistance, setCommuteDistance] = useState<number>(40);
  const [targetBusinessRatio, setTargetBusinessRatio] = useState<number>(95);

  // 휴가일 관리
  const [vacationInput, setVacationInput] = useState('');
  const [vacationDates, setVacationDates] = useState<string[]>(['2026-07-27', '2026-07-28']);

  // 공휴일 및 공휴일 명칭 관리
  const [holidayInput, setHolidayInput] = useState('');
  const [holidayNameInput, setHolidayNameInput] = useState('');
  const [customHolidays, setCustomHolidays] = useState<string[]>([]);
  const [holidayNames, setHolidayNames] = useState<Record<string, string>>({});

  // 실시간 예상 시뮬레이션 계산
  const totalEstimatedDistance = Math.max(0, finalOdometer - initialOdometer);
  const estimatedBusinessDistance = Math.round((totalEstimatedDistance * targetBusinessRatio) / 100);
  const estimatedNonBusinessDistance = totalEstimatedDistance - estimatedBusinessDistance;

  // 시작일 연도 변경 시 한국 법정공휴일 자동 불러오기
  useEffect(() => {
    if (startDate) {
      const year = new Date(startDate).getFullYear();
      if (!isNaN(year)) {
        loadStatutoryHolidays(year);
      }
    }
  }, [startDate]);

  const loadStatutoryHolidays = (year: number) => {
    const statutory = getStatutoryHolidaysForYear(year);
    const newDates = statutory.map(h => h.date);
    const newNamesMap: Record<string, string> = { ...holidayNames };
    statutory.forEach(h => {
      newNamesMap[h.date] = h.name;
    });

    setCustomHolidays(prev => Array.from(new Set([...prev, ...newDates])).sort());
    setHolidayNames(newNamesMap);
  };

  const handleAddVacation = () => {
    if (vacationInput && !vacationDates.includes(vacationInput)) {
      setVacationDates([...vacationDates, vacationInput].sort());
      setVacationInput('');
    }
  };

  const handleRemoveVacation = (dateToRemove: string) => {
    setVacationDates(vacationDates.filter(d => d !== dateToRemove));
  };

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setHolidayInput(val);
    if (val && KOREAN_HOLIDAYS_MAP[val]) {
      setHolidayNameInput(KOREAN_HOLIDAYS_MAP[val]);
    } else if (val && !holidayNameInput) {
      setHolidayNameInput('임시공휴일');
    }
  };

  const handleAddHoliday = () => {
    if (!holidayInput) return;

    const date = holidayInput;
    const name = holidayNameInput.trim() || KOREAN_HOLIDAYS_MAP[date] || '임시공휴일';

    if (!customHolidays.includes(date)) {
      setCustomHolidays([...customHolidays, date].sort());
    }

    setHolidayNames(prev => ({
      ...prev,
      [date]: name
    }));

    setHolidayInput('');
    setHolidayNameInput('');
  };

  const handleRemoveHoliday = (dateToRemove: string) => {
    setCustomHolidays(customHolidays.filter(d => d !== dateToRemove));
    setHolidayNames(prev => {
      const next = { ...prev };
      delete next[dateToRemove];
      return next;
    });
  };

  const handleLoadDefaultHolidays = () => {
    const year = startDate ? new Date(startDate).getFullYear() : 2026;
    loadStatutoryHolidays(year);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate({
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
      targetBusinessRatio,
      vacationDates,
      customHolidays,
      holidayNames
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-6">
      <div className="bg-slate-50 dark:bg-slate-850 px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap flex items-center gap-2">
          <Calendar className="w-5 h-5 text-sky-600" />
          <span>운행기록부 기본 정보 및 운행 조건 입력</span>
        </h2>
        <div className="text-xs text-slate-500 whitespace-nowrap">
          * 과세기간: 작성 시작일 속한 1년 자동 산출
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* 1. 회사 및 차량 기본 정보 */}
        <div>
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 whitespace-nowrap">
            1. 사업자 및 차량 기본 정보
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap flex-shrink-0">
                상호명
              </label>
              <input
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                required
                className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap flex-shrink-0">
                사업자등록번호
              </label>
              <input
                type="text"
                value={bizRegNumber}
                onChange={e => setBizRegNumber(e.target.value)}
                required
                className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap flex-shrink-0">
                차종
              </label>
              <input
                type="text"
                value={vehicleModel}
                onChange={e => setVehicleModel(e.target.value)}
                required
                className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap flex-shrink-0">
                자동차등록번호
              </label>
              <input
                type="text"
                value={licensePlate}
                onChange={e => setLicensePlate(e.target.value)}
                required
                className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap flex-shrink-0">
                유종
              </label>
              <select
                value={fuelType}
                onChange={e => setFuelType(e.target.value as FuelType)}
                className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 outline-none"
              >
                <option value="휘발유">휘발유</option>
                <option value="경유">경유</option>
                <option value="LPG">LPG</option>
                <option value="전기">전기</option>
                <option value="하이브리드">하이브리드</option>
                <option value="수소">수소</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap flex-shrink-0">
                부서
              </label>
              <input
                type="text"
                value={deptName}
                onChange={e => setDeptName(e.target.value)}
                required
                className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap flex-shrink-0">
                성명 (운전자)
              </label>
              <input
                type="text"
                value={driverName}
                onChange={e => setDriverName(e.target.value)}
                required
                className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>
          </div>
        </div>

        <hr className="border-slate-200 dark:border-slate-800" />

        {/* 2. 작성 기간, 계기판 및 목표 업무사용비율 설정 */}
        <div>
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 whitespace-nowrap">
            2. 작성 기간, 계기판 및 업무사용비율(%) 정밀 설정
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap flex-shrink-0">
                작성 시작일
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                required
                className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap flex-shrink-0">
                작성 종료일
              </label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                required
                className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap flex-shrink-0">
                시작 계기판 (km)
              </label>
              <input
                type="number"
                value={initialOdometer}
                onChange={e => setInitialOdometer(Number(e.target.value))}
                required
                min={0}
                className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 outline-none text-right font-mono"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap flex-shrink-0">
                종료 계기판 (km)
              </label>
              <input
                type="number"
                value={finalOdometer}
                onChange={e => setFinalOdometer(Number(e.target.value))}
                required
                min={initialOdometer}
                className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 outline-none text-right font-mono"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap flex-shrink-0">
                출퇴근 거리 (km/일)
              </label>
              <input
                type="number"
                value={commuteDistance}
                onChange={e => setCommuteDistance(Number(e.target.value))}
                required
                min={0}
                className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 outline-none text-right font-mono"
              />
            </div>

            {/* ⑬ 목표 업무사용비율 (%) */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-sky-700 dark:text-sky-400 whitespace-nowrap flex-shrink-0 flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5" />
                  <span>목표 업무사용비율 (%)</span>
                </label>
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={targetBusinessRatio}
                  onChange={e => setTargetBusinessRatio(Number(e.target.value))}
                  required
                  min={1}
                  max={100}
                  step={1}
                  className="px-3 py-2 text-sm font-bold border-2 border-sky-500 dark:border-sky-600 rounded-md bg-sky-50 dark:bg-sky-950/60 text-sky-900 dark:text-sky-100 focus:ring-2 focus:ring-sky-500 outline-none text-right font-mono w-full"
                />
                <span className="text-xs font-bold text-sky-700 dark:text-sky-400">%</span>
              </div>
              <div className="flex gap-1 mt-1">
                {[100, 95, 90, 85].map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setTargetBusinessRatio(r)}
                    className={`px-1.5 py-0.5 text-[11px] font-semibold rounded border ${
                      targetBusinessRatio === r
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {r}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 수식 시뮬레이션 실시간 프리뷰 카드 */}
          <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-center justify-between text-xs gap-3">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 whitespace-nowrap">
              <Calculator className="w-4 h-4 text-sky-600" />
              <span className="font-semibold">실시간 계산 프리뷰:</span>
            </div>
            <div className="flex items-center gap-6 font-mono whitespace-nowrap">
              <div>
                <span className="text-slate-500">⑪총 주행거리:</span>{' '}
                <strong className="text-slate-900 dark:text-slate-100">{totalEstimatedDistance.toLocaleString()} km</strong>
              </div>
              <div>
                <span className="text-amber-600 dark:text-amber-400 font-semibold">⑫예상 업무용 사용거리:</span>{' '}
                <strong className="text-amber-700 dark:text-amber-300">{estimatedBusinessDistance.toLocaleString()} km</strong>
              </div>
              <div>
                <span className="text-slate-500">예상 비업무 거리:</span>{' '}
                <span className="text-slate-700 dark:text-slate-300">{estimatedNonBusinessDistance.toLocaleString()} km</span>
              </div>
              <div className="bg-yellow-200 dark:bg-yellow-900/60 px-2 py-0.5 rounded border border-yellow-300 dark:border-yellow-700 text-slate-900 dark:text-yellow-100 font-bold">
                ⑬목표 비율: {targetBusinessRatio.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        <hr className="border-slate-200 dark:border-slate-800" />

        {/* 3. 휴가일 및 명절/공휴일 지정 */}
        <div>
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 whitespace-nowrap">
            3. 휴가일 및 명절/공휴일 설정 (차량 운행 0km 제어)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap flex-shrink-0">
                개인 휴가일 추가
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={vacationInput}
                  onChange={e => setVacationInput(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 flex-1 outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddVacation}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-md flex items-center gap-1 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>휴가 추가</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 min-h-[40px] p-2 bg-slate-50 dark:bg-slate-800/50 rounded-md border border-slate-200 dark:border-slate-700">
                {vacationDates.length === 0 ? (
                  <span className="text-xs text-slate-400 self-center">지정된 휴가일이 없습니다.</span>
                ) : (
                  vacationDates.map(date => (
                    <span
                      key={date}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-md text-xs font-mono whitespace-nowrap"
                    >
                      {date} (휴가)
                      <button
                        type="button"
                        onClick={() => handleRemoveVacation(date)}
                        className="hover:text-rose-600 ml-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap flex-shrink-0">
                  명절 및 법정공휴일 / 임시공휴일 추가
                </label>
                <button
                  type="button"
                  onClick={handleLoadDefaultHolidays}
                  className="text-xs text-sky-600 hover:text-sky-700 font-medium flex items-center gap-1 whitespace-nowrap"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>법정공휴일 자동 불러오기</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={holidayInput}
                  onChange={handleDateInputChange}
                  className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none w-36"
                />
                <input
                  type="text"
                  placeholder="공휴일명 (예: 임시공휴일)"
                  value={holidayNameInput}
                  onChange={e => setHolidayNameInput(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 flex-1 outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddHoliday}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-md flex items-center gap-1 whitespace-nowrap shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>공휴일 추가</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto p-2 bg-slate-50 dark:bg-slate-800/50 rounded-md border border-slate-200 dark:border-slate-700">
                {customHolidays.length === 0 ? (
                  <span className="text-xs text-slate-400 self-center">지정된 공휴일이 없습니다.</span>
                ) : (
                  customHolidays.map(date => {
                    const hName = holidayNames[date] || KOREAN_HOLIDAYS_MAP[date] || '공휴일';
                    return (
                      <span
                        key={date}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-100 dark:bg-rose-950/60 text-rose-900 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-md text-xs font-mono whitespace-nowrap"
                      >
                        <span className="font-semibold">{date}</span>
                        <span className="text-[11px] text-rose-700 dark:text-rose-400 font-sans">({hName})</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveHoliday(date)}
                          className="hover:text-rose-600 ml-1"
                          title="삭제"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 4. 실행 버튼 영역 */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={isGenerating}
            className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm rounded-lg shadow-sm flex items-center gap-2 transition-all disabled:opacity-50 whitespace-nowrap"
          >
            <FileText className="w-4 h-4" />
            <span>{isGenerating ? '일지 생성 중...' : '작성'}</span>
          </button>

          <button
            type="button"
            onClick={onDownloadExcel}
            disabled={!hasGeneratedData || isDownloading}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg shadow-sm flex items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            <span>{isDownloading ? '엑셀 생성 중...' : '내려받기'}</span>
          </button>
        </div>
      </div>
    </form>
  );
};
