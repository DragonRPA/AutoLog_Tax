import React, { useState, useEffect } from 'react';
import { FuelType, LogbookInput } from '@/types/logbook';
import { getStatutoryHolidaysForYear, KOREAN_HOLIDAYS_MAP } from '@/utils/holidays';
import { Calendar, Plus, Trash2, RefreshCw, FileText, Download, Save, RotateCcw } from 'lucide-react';

interface InputFormProps {
  onGenerate: (input: LogbookInput) => void;
  onDownloadExcel: () => void;
  hasGeneratedData: boolean;
  isGenerating: boolean;
  isDownloading: boolean;
}

const LOCAL_STORAGE_KEY = 'autolog_tax_saved_data_v1';

export const InputForm: React.FC<InputFormProps> = ({
  onGenerate,
  onDownloadExcel,
  hasGeneratedData,
  isGenerating,
  isDownloading
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  const [companyName, setCompanyName] = useState('(주)이렌컴');
  const [bizRegNumber, setBizRegNumber] = useState('206-81-25423');
  const [vehicleModel, setVehicleModel] = useState('싼타페');
  const [licensePlate, setLicensePlate] = useState('122소2232');
  const [fuelType, setFuelType] = useState<FuelType>('휘발유');
  const [deptName, setDeptName] = useState('신규영업팀');
  const [driverName, setDriverName] = useState('차승후');

  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-12-31');

  const [initialOdometer, setInitialOdometer] = useState<string>('');
  const [finalOdometer, setFinalOdometer] = useState<string>('');
  const [commuteDistance, setCommuteDistance] = useState<string>('');

  const [vacationInput, setVacationInput] = useState('');
  const [vacationDates, setVacationDates] = useState<string[]>([]);

  const [holidayInput, setHolidayInput] = useState('');
  const [holidayNameInput, setHolidayNameInput] = useState('');
  const [customHolidays, setCustomHolidays] = useState<string[]>([]);
  const [holidayNames, setHolidayNames] = useState<Record<string, string>>({});

  // 1. 마운트 시 LocalStorage 저장된 데이터 자동 복원
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.companyName !== undefined) setCompanyName(parsed.companyName);
        if (parsed.bizRegNumber !== undefined) setBizRegNumber(parsed.bizRegNumber);
        if (parsed.vehicleModel !== undefined) setVehicleModel(parsed.vehicleModel);
        if (parsed.licensePlate !== undefined) setLicensePlate(parsed.licensePlate);
        if (parsed.fuelType !== undefined) setFuelType(parsed.fuelType);
        if (parsed.deptName !== undefined) setDeptName(parsed.deptName);
        if (parsed.driverName !== undefined) setDriverName(parsed.driverName);
        if (parsed.startDate !== undefined) setStartDate(parsed.startDate);
        if (parsed.endDate !== undefined) setEndDate(parsed.endDate);
        if (parsed.initialOdometer !== undefined) setInitialOdometer(parsed.initialOdometer);
        if (parsed.finalOdometer !== undefined) setFinalOdometer(parsed.finalOdometer);
        if (parsed.commuteDistance !== undefined) setCommuteDistance(parsed.commuteDistance);
        if (Array.isArray(parsed.vacationDates)) setVacationDates(parsed.vacationDates);
        if (Array.isArray(parsed.customHolidays)) setCustomHolidays(parsed.customHolidays);
        if (parsed.holidayNames) setHolidayNames(parsed.holidayNames);
      } else {
        // 저장된 데이터가 없는 경우 2026 기본 공휴일 로딩
        loadStatutoryHolidays(2026);
      }
    } catch (err) {
      console.error('로컬스토리지 불러오기 실패:', err);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // 2. 입력값 변경 시 LocalStorage 실시간 자동 저장
  useEffect(() => {
    if (!isLoaded) return;
    try {
      const dataToSave = {
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
        vacationDates,
        customHolidays,
        holidayNames
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (err) {
      console.error('로컬스토리지 저장 실패:', err);
    }
  }, [
    isLoaded,
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
    vacationDates,
    customHolidays,
    holidayNames
  ]);

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

  const handleResetStorage = () => {
    if (window.confirm('저장된 모든 정보 및 휴가/공휴일 설정을 초기화하시겠습니까?')) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setCompanyName('(주)이렌컴');
      setBizRegNumber('206-81-25423');
      setVehicleModel('싼타페');
      setLicensePlate('122소2232');
      setFuelType('휘발유');
      setDeptName('신규영업팀');
      setDriverName('차승후');
      setStartDate('2026-01-01');
      setEndDate('2026-12-31');
      setInitialOdometer('');
      setFinalOdometer('');
      setCommuteDistance('');
      setVacationDates([]);
      setCustomHolidays([]);
      setHolidayNames({});
      loadStatutoryHolidays(2026);
    }
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

    const initVal = Number(initialOdometer);
    const finalVal = Number(finalOdometer);
    const commuteVal = Number(commuteDistance) || 0;

    if (!initialOdometer || isNaN(initVal)) {
      throw new Error('시작 계기판 거리를 입력해주세요.');
    }

    if (!finalOdometer || isNaN(finalVal)) {
      throw new Error('종료 계기판 거리를 입력해주세요.');
    }

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
      initialOdometer: initVal,
      finalOdometer: finalVal,
      commuteDistance: commuteVal,
      targetBusinessRatio: 100,
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
        <div className="flex items-center gap-3">
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 whitespace-nowrap bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
            <Save className="w-3.5 h-3.5" />
            <span>브라우저 자동 저장 활성화</span>
          </span>
          <button
            type="button"
            onClick={handleResetStorage}
            className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium flex items-center gap-1 whitespace-nowrap border border-slate-300 dark:border-slate-700 px-2 py-1 rounded bg-white dark:bg-slate-800"
            title="초기 상태로 되돌리기"
          >
            <RotateCcw className="w-3 h-3" />
            <span>초기화</span>
          </button>
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

        {/* 2. 작성 기간 및 계기판 설정 */}
        <div>
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 whitespace-nowrap">
            2. 작성 기간 및 계기판 설정
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap flex-shrink-0">
                운행일지 작성 시작일
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
                운행일지 작성 종료일
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
                시작 계기판 거리 (km)
              </label>
              <input
                type="number"
                value={initialOdometer}
                onChange={e => setInitialOdometer(e.target.value)}
                placeholder="예: 37288"
                required
                min={0}
                className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 outline-none text-right font-mono"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap flex-shrink-0">
                종료 계기판 거리 (km)
              </label>
              <input
                type="number"
                value={finalOdometer}
                onChange={e => setFinalOdometer(e.target.value)}
                placeholder="예: 45800"
                required
                min={Number(initialOdometer) || 0}
                className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 outline-none text-right font-mono"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap flex-shrink-0">
                출퇴근용 주행거리 (km/일)
              </label>
              <input
                type="number"
                value={commuteDistance}
                onChange={e => setCommuteDistance(e.target.value)}
                placeholder="예: 40"
                required
                min={0}
                className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 outline-none text-right font-mono"
              />
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
            {/* 개인 휴가일 관리 */}
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

            {/* 명절 및 법정공휴일/임시공휴일 관리 */}
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
