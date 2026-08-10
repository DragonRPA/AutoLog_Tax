import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '법인차량 운행일지 자동작성 서비스 | AutoLog Tax',
  description: '국세청 표준 업무용승용차 운행기록부 월별 시트 자동 생성 및 엑셀 다운로드 서비스',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
        {children}
      </body>
    </html>
  );
}
