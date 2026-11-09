import * as XLSX from 'xlsx';
import { TVMParams, AmortizationRow, StepExplanation, CashFlowParams, CashFlowResults } from '../types/calculator';

/**
 * Exports full amortization schedule to a formatted Excel file (.xlsx)
 */
export function exportAmortizationToExcel(
  params: TVMParams,
  rows: AmortizationRow[],
  filename = 'לוח_סילוקין_FC200.xlsx'
) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Amortization Table
  const tableData: any[] = [];

  // Summary headers
  tableData.push(['מחשבון פיננסי Casio FC-200V - דוח לוח סילוקין מלא']);
  tableData.push(['תאריך הפקה:', new Date().toLocaleDateString('he-IL')]);
  tableData.push([]);
  tableData.push(['פרמטרי ההלוואה:']);
  tableData.push(['סכום ההלוואה (PV):', Math.abs(params.pv), '₪']);
  tableData.push(['ריבית שנתית (I%):', `${params.i}%`]);
  tableData.push(['מספר תקופות (n):', params.n]);
  tableData.push(['תשלום תקופתי (PMT):', Math.abs(params.pmt), '₪']);
  tableData.push(['עיתוי תשלום (Set):', params.set === 'Begin' ? 'תחילת תקופה' : 'סוף תקופה']);
  tableData.push(['תשלומים בשנה (P/Y):', params.py]);
  tableData.push([]);

  // Table header
  tableData.push([
    'תקופה',
    'תשלום תקופתי (₪)',
    'החזר קרן (₪)',
    'תשלום ריבית (₪)',
    'יתרת קרן לסוף תקופה (₪)',
    'קרן מצטברת שסולקה (₪)',
    'ריבית מצטברת ששולמה (₪)',
  ]);

  // Data rows
  let totalPayments = 0;
  let totalPrincipal = 0;
  let totalInterest = 0;

  for (const row of rows) {
    totalPayments += row.payment;
    totalPrincipal += row.principal;
    totalInterest += row.interest;

    tableData.push([
      row.period,
      row.payment,
      row.principal,
      row.interest,
      row.balance,
      row.accumulatedPrincipal,
      row.accumulatedInterest,
    ]);
  }

  // Totals Row
  tableData.push([]);
  tableData.push([
    'סה"כ כולל:',
    Number(totalPayments.toFixed(2)),
    Number(totalPrincipal.toFixed(2)),
    Number(totalInterest.toFixed(2)),
    0,
    Number(totalPrincipal.toFixed(2)),
    Number(totalInterest.toFixed(2)),
  ]);

  const ws = XLSX.utils.aoa_to_sheet(tableData);

  // Set column widths
  ws['!cols'] = [
    { wch: 10 },
    { wch: 20 },
    { wch: 18 },
    { wch: 18 },
    { wch: 26 },
    { wch: 26 },
    { wch: 26 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'לוח סילוקין');

  // Trigger download
  XLSX.writeFile(wb, filename);
}

/**
 * Exports complete solution with steps & formulas to Excel
 */
export function exportSolutionToExcel(
  explanation: StepExplanation,
  filename = 'פתרון_מפורט_FC200.xlsx'
) {
  const wb = XLSX.utils.book_new();
  const data: any[] = [];

  data.push(['מחשבון פיננסי Casio FC-200V - דוח דרך פתרון מלאה']);
  data.push(['תאריך:', new Date().toLocaleDateString('he-IL')]);
  data.push([]);
  data.push(['כותרת הפתרון:', explanation.title]);
  data.push(['קטגוריה:', explanation.category]);
  data.push(['תקציר כלכלי:', explanation.summary]);
  data.push(['נוסחה בסיסית:', explanation.formula]);
  data.push([]);

  data.push(['פירוט ערכי הפרמטרים:']);
  data.push(['פרמטר', 'ערך', 'תיאור']);
  for (const p of explanation.parameters) {
    data.push([p.label, p.value, p.description]);
  }

  data.push([]);
  data.push(['שלבי החישוב וההסבר המלא:']);
  for (const step of explanation.steps) {
    data.push([step]);
  }

  data.push([]);
  data.push(['מסקנה והערות סיום:']);
  data.push([explanation.resultNote]);

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [{ wch: 30 }, { wch: 25 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, ws, 'דרך פתרון');

  XLSX.writeFile(wb, filename);
}

/**
 * Exports Cash Flow analysis to Excel
 */
export function exportCashFlowToExcel(
  params: CashFlowParams,
  results: CashFlowResults,
  filename = 'תזרים_מזומנים_FC200.xlsx'
) {
  const wb = XLSX.utils.book_new();
  const data: any[] = [];

  data.push(['מחשבון פיננסי Casio FC-200V - ניתוח תזרים מזומנים (CASH)']);
  data.push(['תאריך:', new Date().toLocaleDateString('he-IL')]);
  data.push([]);
  data.push(['תוצאות בדיקת הכדאיות:']);
  data.push(['שיעור היוון (I%):', `${params.rate}%`]);
  data.push(['השקעה ראשונית (CF0):', params.cf0, '₪']);
  data.push(['ערך נוכחי נקי (NPV):', results.npv, '₪']);
  data.push(['שיעור תשואה פנימי (IRR):', results.irr ? `${results.irr}%` : 'N/A']);
  data.push(['תקופת החזר (PBP):', results.pbp ? `${results.pbp} תקופות` : 'N/A']);
  data.push(['ערך עתידי נקי (NFV):', results.nfv, '₪']);
  data.push([]);

  data.push(['פירוט תזרימי המזומנים:']);
  data.push(['תקופה / זרם', 'תזרים (₪)', 'תדירות']);
  data.push(['CF0 (השקעה ראשונית)', params.cf0, 1]);
  params.flows.forEach((f, idx) => {
    data.push([`C${idx + 1}`, f.flow, f.frequency]);
  });

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, ws, 'ניתוח תזרים');

  XLSX.writeFile(wb, filename);
}
