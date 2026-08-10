import ExcelJS from 'exceljs';
import { LogbookInput, AutoLogResult } from '@/types/logbook';

export async function exportLogbookToExcel(
  input: LogbookInput,
  result: AutoLogResult
): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AutoLog Tax';
  workbook.lastModifiedBy = 'AutoLog Tax';
  workbook.created = new Date();

  // 각 월별 시트 생성 (YYYY년MM월)
  result.monthlySheets.forEach(monthSheet => {
    const sheet = workbook.addWorksheet(monthSheet.sheetName, {
      pageSetup: { paperSize: 9, orientation: 'portrait' }
    });

    // 기본 그리드선 보이기
    sheet.views = [{ showGridLines: true }];

    // 열 너비 지정
    sheet.columns = [
      { key: 'colA', width: 14 }, // Date (사용 일자)
      { key: 'colB', width: 6 },  // 요일
      { key: 'colC', width: 14 }, // 부서
      { key: 'colD', width: 12 }, // 성명
      { key: 'colE', width: 16 }, // 주행전 계기판
      { key: 'colF', width: 16 }, // 주행후 계기판
      { key: 'colG', width: 14 }, // 주행거리
      { key: 'colH', width: 14 }, // 출퇴근
      { key: 'colI', width: 14 }, // 일반업무
      { key: 'colJ', width: 18 }  // 비고
    ];

    // --- Row 1-4: 상단 과세기간 및 헤더 ---
    sheet.mergeCells('A1:B4');
    const taxPeriodTitleCell = sheet.getCell('A1');
    taxPeriodTitleCell.value = '과 세 기 간';
    taxPeriodTitleCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    taxPeriodTitleCell.font = { name: '맑은 고딕', size: 11, bold: true };

    sheet.mergeCells('C1:D2');
    const taxStartCell = sheet.getCell('C1');
    taxStartCell.value = result.taxPeriodStart.replace(/-/g, '.');
    taxStartCell.alignment = { vertical: 'middle', horizontal: 'center' };
    taxStartCell.font = { name: '맑은 고딕', size: 10 };

    sheet.mergeCells('C3:D3');
    const tildeCell = sheet.getCell('C3');
    tildeCell.value = '~';
    tildeCell.alignment = { vertical: 'middle', horizontal: 'center' };

    sheet.mergeCells('C4:D4');
    const taxEndCell = sheet.getCell('C4');
    taxEndCell.value = result.taxPeriodEnd.replace(/-/g, '.');
    taxEndCell.alignment = { vertical: 'middle', horizontal: 'center' };
    taxEndCell.font = { name: '맑은 고딕', size: 10 };

    sheet.mergeCells('E1:G4');
    const mainTitleCell = sheet.getCell('E1');
    mainTitleCell.value = '업무용승용차 운행기록부';
    mainTitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    mainTitleCell.font = { name: '맑은 고딕', size: 16, bold: true };

    sheet.mergeCells('H1:H2');
    sheet.getCell('H1').value = '상호명';
    sheet.getCell('H1').alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getCell('H1').font = { name: '맑은 고딕', size: 9 };
    sheet.getCell('H1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F2F2F2' } };

    sheet.mergeCells('I1:J2');
    sheet.getCell('I1').value = input.companyName;
    sheet.getCell('I1').alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getCell('I1').font = { name: '맑은 고딕', size: 10, bold: true };

    sheet.mergeCells('H3:H4');
    sheet.getCell('H3').value = '사업자번호';
    sheet.getCell('H3').alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getCell('H3').font = { name: '맑은 고딕', size: 9 };
    sheet.getCell('H3').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F2F2F2' } };

    sheet.mergeCells('I3:J4');
    sheet.getCell('I3').value = input.bizRegNumber;
    sheet.getCell('I3').alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getCell('I3').font = { name: '맑은 고딕', size: 10 };

    // --- Row 6-8: 1. 기본정보 ---
    sheet.getCell('A6').value = '1. 기본정보';
    sheet.getCell('A6').font = { name: '맑은 고딕', size: 11, bold: true };

    sheet.mergeCells('A7:C7');
    sheet.getCell('A7').value = '①차 종';
    sheet.getCell('A7').alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getCell('A7').font = { name: '맑은 고딕', size: 9, bold: true };
    sheet.getCell('A7').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E6EDF5' } };

    sheet.mergeCells('D7:G7');
    sheet.getCell('D7').value = '②자동차등록번호';
    sheet.getCell('D7').alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getCell('D7').font = { name: '맑은 고딕', size: 9, bold: true };
    sheet.getCell('D7').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E6EDF5' } };

    sheet.mergeCells('H7:J7');
    sheet.getCell('H7').value = '유종';
    sheet.getCell('H7').alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getCell('H7').font = { name: '맑은 고딕', size: 9, bold: true };
    sheet.getCell('H7').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E6EDF5' } };

    sheet.mergeCells('A8:C8');
    sheet.getCell('A8').value = input.vehicleModel;
    sheet.getCell('A8').alignment = { vertical: 'middle', horizontal: 'center' };

    sheet.mergeCells('D8:G8');
    sheet.getCell('D8').value = input.licensePlate;
    sheet.getCell('D8').alignment = { vertical: 'middle', horizontal: 'center' };

    sheet.mergeCells('H8:J8');
    sheet.getCell('H8').value = input.fuelType;
    sheet.getCell('H8').alignment = { vertical: 'middle', horizontal: 'center' };

    // --- Row 10: 2. 업무용 사용비율 계산 ---
    sheet.getCell('A10').value = '2. 업무용 사용비율 계산';
    sheet.getCell('A10').font = { name: '맑은 고딕', size: 11, bold: true };

    // --- Row 11-13: 테이블 헤더 ---
    const headerFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'D9E2F3' }
    };

    sheet.mergeCells('A11:A13');
    sheet.getCell('A11').value = '③사용 일자\n(요일)';
    sheet.getCell('A11').alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

    sheet.mergeCells('B11:B13');
    sheet.getCell('B11').value = '요일';
    sheet.getCell('B11').alignment = { vertical: 'middle', horizontal: 'center' };

    sheet.mergeCells('C11:D11');
    sheet.getCell('C11').value = '④사용자';
    sheet.getCell('C11').alignment = { vertical: 'middle', horizontal: 'center' };

    sheet.getCell('C12').value = '부 서';
    sheet.getCell('C12').alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.mergeCells('C12:C13');

    sheet.getCell('D12').value = '성 명';
    sheet.getCell('D12').alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.mergeCells('D12:D13');

    sheet.mergeCells('E11:J11');
    sheet.getCell('E11').value = '운  행  내  역';
    sheet.getCell('E11').alignment = { vertical: 'middle', horizontal: 'center' };

    sheet.mergeCells('E12:E13');
    sheet.getCell('E12').value = '⑤주행 전\n계기판의\n거리(km)';
    sheet.getCell('E12').alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

    sheet.mergeCells('F12:F13');
    sheet.getCell('F12').value = '⑥주행 후\n계기판의\n거리(km)';
    sheet.getCell('F12').alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

    sheet.mergeCells('G12:G13');
    sheet.getCell('G12').value = '⑦주행거리\n(km)';
    sheet.getCell('G12').alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

    sheet.mergeCells('H12:I12');
    sheet.getCell('H12').value = '업무용 사용거리(km)';
    sheet.getCell('H12').alignment = { vertical: 'middle', horizontal: 'center' };

    sheet.getCell('H13').value = '⑧출·퇴근\n용(km)';
    sheet.getCell('H13').alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

    sheet.getCell('I13').value = '⑨일반 업\n무용(km)';
    sheet.getCell('I13').alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

    sheet.mergeCells('J12:J13');
    sheet.getCell('J12').value = '⑩비 고';
    sheet.getCell('J12').alignment = { vertical: 'middle', horizontal: 'center' };

    // 테이블 헤더 스타일 적용
    for (let r = 11; r <= 13; r++) {
      for (let c = 1; c <= 10; c++) {
        const cell = sheet.getCell(r, c);
        cell.fill = headerFill;
        cell.font = { name: '맑은 고딕', size: 9, bold: true };
      }
    }

    // --- Row 14~: 데이터 로우 작성 ---
    let currentRow = 14;
    const startDataRow = currentRow;

    monthSheet.entries.forEach(entry => {
      const row = sheet.getRow(currentRow);
      row.height = 20;

      row.getCell(1).value = entry.date;
      row.getCell(2).value = entry.dayOfWeek;
      row.getCell(3).value = entry.deptName;
      row.getCell(4).value = entry.driverName;

      row.getCell(5).value = entry.startOdometer;
      row.getCell(5).numFmt = '#,##0';

      row.getCell(6).value = entry.endOdometer;
      row.getCell(6).numFmt = '#,##0';

      row.getCell(7).value = entry.totalDistance > 0 ? entry.totalDistance : 0;
      row.getCell(7).numFmt = '#,##0';

      row.getCell(8).value = entry.commuteDistance > 0 ? entry.commuteDistance : 0;
      row.getCell(8).numFmt = '#,##0';

      row.getCell(9).value = entry.businessDistance > 0 ? entry.businessDistance : 0;
      row.getCell(9).numFmt = '#,##0';

      row.getCell(10).value = entry.remarks;

      // 정렬 및 스타일
      for (let col = 1; col <= 10; col++) {
        const cell = row.getCell(col);
        cell.font = { name: '맑은 고딕', size: 9 };
        if (col <= 4 || col === 10) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
        }
      }

      // 주말 및 휴무일 배경 노란색/연회색 하이라이트
      if (entry.isHolidayOrWeekend) {
        row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2CC' } };
        row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2CC' } };
      }

      currentRow++;
    });

    const endDataRow = currentRow - 1;

    // --- 하단 요약 헤더 및 수식 합계 (Row currentRow ~ currentRow + 1) ---
    const summaryHeaderRow = currentRow;
    const summaryValueRow = currentRow + 1;

    sheet.mergeCells(`E${summaryHeaderRow}:G${summaryHeaderRow}`);
    const sumHeader1 = sheet.getCell(`E${summaryHeaderRow}`);
    sumHeader1.value = '⑪과세기간 총주행 거리(km)';
    sumHeader1.alignment = { vertical: 'middle', horizontal: 'center' };
    sumHeader1.font = { name: '맑은 고딕', size: 9, bold: true };

    sheet.mergeCells(`H${summaryHeaderRow}:I${summaryHeaderRow}`);
    const sumHeader2 = sheet.getCell(`H${summaryHeaderRow}`);
    sumHeader2.value = '과세기간 업무용 사용거리(km)';
    sumHeader2.alignment = { vertical: 'middle', horizontal: 'center' };
    sumHeader2.font = { name: '맑은 고딕', size: 9, bold: true };

    const sumHeader3 = sheet.getCell(`J${summaryHeaderRow}`);
    sumHeader3.value = '⑬업무사용비율';
    sumHeader3.alignment = { vertical: 'middle', horizontal: 'center' };
    sumHeader3.font = { name: '맑은 고딕', size: 9, bold: true };

    // 수식 값 행
    sheet.mergeCells(`E${summaryValueRow}:G${summaryValueRow}`);
    const sumVal1 = sheet.getCell(`E${summaryValueRow}`);
    sumVal1.value = { formula: `SUM(G${startDataRow}:G${endDataRow})`, result: monthSheet.totalPeriodDistance };
    sumVal1.alignment = { vertical: 'middle', horizontal: 'right' };
    sumVal1.font = { name: '맑은 고딕', size: 12, bold: true };
    sumVal1.numFmt = '#,##0';

    sheet.mergeCells(`H${summaryValueRow}:I${summaryValueRow}`);
    const sumVal2 = sheet.getCell(`H${summaryValueRow}`);
    sumVal2.value = { formula: `SUM(H${startDataRow}:I${endDataRow})`, result: monthSheet.totalBusinessDistance };
    sumVal2.alignment = { vertical: 'middle', horizontal: 'right' };
    sumVal2.font = { name: '맑은 고딕', size: 12, bold: true };
    sumVal2.numFmt = '#,##0';
    // 노란색 하이라이트 (12번 업무용 사용거리)
    sumVal2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF00' } };

    const sumVal3 = sheet.getCell(`J${summaryValueRow}`);
    sumVal3.value = { formula: `IF(E${summaryValueRow}>0, H${summaryValueRow}/E${summaryValueRow}, 1)`, result: monthSheet.businessRatio / 100 };
    sumVal3.alignment = { vertical: 'middle', horizontal: 'center' };
    sumVal3.font = { name: '맑은 고딕', size: 12, bold: true, color: { argb: '000284C7' } };
    sumVal3.numFmt = '0.0%';
    // 노란색 하이라이트 (13번 업무사용비율)
    sumVal3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF00' } };

    // --- 전체 셀 테두리 설정 ---
    const thinBorder: Partial<ExcelJS.Borders> = {
      top: { style: 'thin', color: { argb: 'D9D9D9' } },
      left: { style: 'thin', color: { argb: 'D9D9D9' } },
      bottom: { style: 'thin', color: { argb: 'D9D9D9' } },
      right: { style: 'thin', color: { argb: 'D9D9D9' } }
    };

    // 상단 폼 테두리
    for (let r = 1; r <= 8; r++) {
      for (let c = 1; c <= 10; c++) {
        sheet.getCell(r, c).border = thinBorder;
      }
    }

    // 메인 테이블 테두리
    for (let r = 11; r <= summaryValueRow; r++) {
      for (let c = 1; c <= 10; c++) {
        sheet.getCell(r, c).border = thinBorder;
      }
    }
  });

  // 엑셀 버퍼 생성
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
}
