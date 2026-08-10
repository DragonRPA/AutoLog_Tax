import React from 'react';
import { Car, FileSpreadsheet } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-sky-600 p-2 rounded-lg text-white">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white whitespace-nowrap">
              법인차량 운행일지 자동작성 서비스
            </h1>
            <p className="text-xs text-slate-400 whitespace-nowrap">
              국세청 표준 업무용승용차 운행기록부 월별 양식 자동 생성 및 정밀 정산
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-800 px-3 py-1.5 rounded-md border border-slate-700 whitespace-nowrap">
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>v1.0.0.Build.1</span>
        </div>
      </div>
    </header>
  );
};
