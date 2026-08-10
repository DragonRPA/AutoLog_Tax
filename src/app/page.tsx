'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { InputForm } from '@/components/InputForm';
import { MonthTabs } from '@/components/MonthTabs';
import { LogTable } from '@/components/LogTable';
import { ErrorModal } from '@/components/ErrorModal';
import { LogbookInput, AutoLogResult } from '@/types/logbook';
import { generateAutoLogbook } from '@/utils/generator';
import { exportLogbookToExcel } from '@/utils/excelExporter';
import { CheckCircle2, ShieldAlert } from 'lucide-react';

export default function Home() {
  const [currentInput, setCurrentInput] = useState<LogbookInput | null>(null);
  const [logResult, setLogResult] = useState<AutoLogResult | null>(null);
  const [activeSheetName, setActiveSheetName] = useState<string>('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Zero Silent Failures: 에러 모달 상태 관리
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGenerate = (input: LogbookInput) => {
    setIsGenerating(true);
    setErrorMessage(null);

    try {
      // 1. 유효성 자가 검증
      if (!input.startDate || !input.endDate) {
        throw new Error('운행일지 작성 시작일과 종료일을 올바르게 지정해주세요.');
      }

      if (new Date(input.startDate) > new Date(input.endDate)) {
        throw new Error('작성 시작일은 작성 종료일보다 이전이거나 같아야 합니다.');
      }

      if (input.finalOdometer < input.initialOdometer) {
        throw new Error(
          `종료 계기판 거리(${input.finalOdometer.toLocaleString()}km)는 시작 계기판 거리(${input.initialOdometer.toLocaleString()}km)보다 크거나 같아야 합니다.`
        );
      }

      // 2. 자동작성 엔진 구동
      const result = generateAutoLogbook(input);
      setCurrentInput(input);
      setLogResult(result);

      if (result.monthlySheets.length > 0) {
        setActiveSheetName(result.monthlySheets[0].sheetName);
      }
    } catch (err: any) {
      // 무음 처리 금지: 즉시 에러 모달 노출
      setErrorMessage(err.message || '운행일지 생성 중 예기치 않은 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadExcel = async () => {
    if (!currentInput || !logResult) {
      setErrorMessage('먼저 "작성" 버튼을 눌러 운행일지 데이터를 생성해 주세요.');
      return;
    }

    setIsDownloading(true);
    try {
      const blob = await exportLogbookToExcel(currentInput, logResult);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cleanPlate = currentInput.licensePlate.replace(/\s+/g, '');
      const year = new Date(currentInput.startDate).getFullYear();
      a.download = `업무용승용차_운행기록부_${currentInput.vehicleModel}_${cleanPlate}_${year}년.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setErrorMessage(`엑셀 내려받기 생성 중 오류 발생: ${err.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const activeSheet = logResult?.monthlySheets.find(s => s.sheetName === activeSheetName);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        {/* 입력 폼 컴포넌트 */}
        <InputForm
          onGenerate={handleGenerate}
          onDownloadExcel={handleDownloadExcel}
          hasGeneratedData={!!logResult}
          isGenerating={isGenerating}
          isDownloading={isDownloading}
        />

        {/* 결과 통계 및 안내 배너 */}
        {logResult && currentInput && (
          <div className="bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-xl p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-sky-600 text-white rounded-lg">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-sky-900 dark:text-sky-200 whitespace-nowrap">
                  총 {logResult.monthlySheets.length}개 월별 시트가 정상 작성되었습니다.
                </h3>
                <p className="text-xs text-sky-700 dark:text-sky-400 whitespace-nowrap">
                  과세기간: {logResult.taxPeriodStart} ~ {logResult.taxPeriodEnd} | 과세기간 총주행: {logResult.overallTotalDistance.toLocaleString()}km | 업무사용비율: {logResult.overallBusinessRatio.toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleDownloadExcel}
                disabled={isDownloading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all whitespace-nowrap"
              >
                {isDownloading ? '엑셀 내려받는 중...' : '국세청 양식 엑셀 내려받기 (.xlsx)'}
              </button>
            </div>
          </div>
        )}

        {/* 월별 탭 네비게이션 & 운행일지 테이블 */}
        {logResult && currentInput && activeSheet ? (
          <div>
            <MonthTabs
              monthlySheets={logResult.monthlySheets}
              activeSheetName={activeSheetName}
              onSelectSheet={setActiveSheetName}
            />
            <LogTable
              input={currentInput}
              result={logResult}
              currentSheet={activeSheet}
            />
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400">
            <ShieldAlert className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-700" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
              위 입력란에 차량 및 운행 조건 정보를 입력하신 후 [작성] 버튼을 눌러주세요.
            </p>
            <p className="text-xs text-slate-400 mt-1 whitespace-nowrap">
              월별 시트(`YYYY년MM월`)가 자동으로 구성되어 화면에서 확인하고 엑셀로 내려받을 수 있습니다.
            </p>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 py-4 bg-white dark:bg-slate-900 text-center text-xs text-slate-500">
        <p className="whitespace-nowrap">
          © 2026 (주)드래곤알피에이. All rights reserved. | 국세청 표준 양식 완전 호환
        </p>
      </footer>

      {/* 무음 실패 방지 오류 알림 모달 */}
      <ErrorModal
        isOpen={!!errorMessage}
        message={errorMessage || ''}
        onClose={() => setErrorMessage(null)}
      />
    </div>
  );
}
