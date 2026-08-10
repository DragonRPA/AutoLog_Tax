import React from 'react';
import { MonthlySheetData } from '@/types/logbook';
import { Calendar } from 'lucide-react';

interface MonthTabsProps {
  monthlySheets: MonthlySheetData[];
  activeSheetName: string;
  onSelectSheet: (sheetName: string) => void;
}

export const MonthTabs: React.FC<MonthTabsProps> = ({
  monthlySheets,
  activeSheetName,
  onSelectSheet
}) => {
  if (monthlySheets.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800 mb-4 scrollbar-thin">
      <div className="flex items-center gap-1 text-xs font-semibold text-slate-500 mr-2 whitespace-nowrap flex-shrink-0">
        <Calendar className="w-4 h-4 text-sky-600" />
        <span>월별 시트:</span>
      </div>
      {monthlySheets.map(sheet => {
        const isActive = sheet.sheetName === activeSheetName;
        return (
          <button
            key={sheet.sheetName}
            onClick={() => onSelectSheet(sheet.sheetName)}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-all whitespace-nowrap flex-shrink-0 border-t border-x ${
              isActive
                ? 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-sky-600 dark:text-sky-400 border-b-2 border-b-sky-600 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800/60 border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            {sheet.sheetName}
          </button>
        );
      })}
    </div>
  );
};
