import { TVMParams, AmortizationSummary, CashFlowParams, CashFlowResults, StepExplanation } from '../types/calculator';
import { getPeriodicRate } from './tvm';

/**
 * Generates detailed step-by-step mathematical explanation for TVM calculations
 */
export function generateTVMSolution(
  solvedField: 'n' | 'i' | 'pv' | 'pmt' | 'fv',
  params: TVMParams
): StepExplanation {
  const { set, n, i, pv, pmt, fv, py, cy } = params;
  const periodicRate = getPeriodicRate(i, py, cy);
  const periodicPercent = (periodicRate * 100).toFixed(4);

  const fieldLabels: Record<string, string> = {
    n: 'מספר תקופות (n)',
    i: 'שיעור ריבית שנתית (I%)',
    pv: 'ערך נוכחי / סכום ההלוואה (PV)',
    pmt: 'תשלום תקופתי (PMT)',
    fv: 'ערך עתידי (FV)',
  };

  const steps: string[] = [];
  let title = `פתרון מלא לחישוב ${fieldLabels[solvedField]}`;
  let formula = '';
  let summary = '';
  let resultNote = '';

  steps.push(`שלב 1: ריכוז הנתונים מהמחשבון (FC-200V):`);
  steps.push(`• מצב עיתוי תשלום (Set): ${set === 'Begin' ? 'תחילת תקופה (Begin / שפיצר מראש)' : 'סוף תקופה (End / רגיל)'}`);
  steps.push(`• מספר תקופות (n): ${n}`);
  steps.push(`• ריבית שנתית נקובה (I%): ${i}%`);
  steps.push(`• ערך נוכחי (PV): ${pv.toLocaleString()} ₪`);
  steps.push(`• תשלום תקופתי (PMT): ${pmt.toLocaleString()} ₪`);
  steps.push(`• ערך עתידי (FV): ${fv.toLocaleString()} ₪`);
  steps.push(`• תשלומים בשנה (P/Y): ${py}, תקופות ריבית בשנה (C/Y): ${cy}`);

  steps.push(
    `שלב 2: התאמת ריבית לתקופת התשלום:\n` +
    (py === cy
      ? `מכיוון ש-P/Y = C/Y = ${py}, הריבית לתקופה היא פשוט: i = ${i}% / ${py} = ${periodicPercent}% (במספר עשרוני: ${periodicRate.toFixed(6)})`
      : `התאמת ריבית אפקטיבית לתקופה: i = (1 + ${i}% / ${cy})^(${cy} / ${py}) - 1 = ${periodicPercent}% (במספר עשרוני: ${periodicRate.toFixed(6)})`)
  );

  const s = set === 'Begin' ? 1 : 0;

  if (solvedField === 'pmt') {
    formula = `PMT = - \\frac{PV \\cdot (1+i)^n + FV}{(1 + i \\cdot S) \\cdot \\frac{(1+i)^n - 1}{i}}`;
    summary = `חישוב ההחזר התקופתי הנדרש להלוואה של ${Math.abs(pv).toLocaleString()} ₪ בריבית שנתית של ${i}% ל-${n} תקופות.`;
    steps.push(`שלב 3: הצבה בנוסחת ערך הזמן של הכסף (TVM Annuity Formula):`);
    steps.push(`מקדם הצבירה: (1 + i)^n = (1 + ${periodicRate.toFixed(6)})^${n} = ${Math.pow(1 + periodicRate, n).toFixed(5)}`);
    const factor = Math.pow(1 + periodicRate, n);
    const annuityFactor = ((factor - 1) / periodicRate) * (1 + periodicRate * s);
    steps.push(`מקדם סדרת התשלומים (ערך נוכחי/עתידי של אנונה): ${annuityFactor.toFixed(5)}`);
    steps.push(`שלב 4: חילוץ התשלום התקופתי (PMT):`);
    steps.push(`PMT = - (${pv.toLocaleString()} × ${factor.toFixed(5)} + ${fv.toLocaleString()}) / ${annuityFactor.toFixed(5)} = ${pmt.toFixed(2)} ₪`);
    
    const totalPayments = Math.abs(pmt * n);
    const totalInterest = totalPayments - Math.abs(pv);
    resultNote = `סה"כ תשלומים לאורך כל התקופה: ${totalPayments.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₪. מתוכם סך עלות הריבית הכוללת: ${totalInterest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₪.`;
  } else if (solvedField === 'pv') {
    formula = `PV = - \\frac{FV + PMT \\cdot (1 + i \\cdot S) \\cdot \\frac{(1+i)^n - 1}{i}}{(1+i)^n}`;
    summary = `חישוב הערך הנוכחי (סכום ההלוואה או ההשקעה הראשונית) עבור סדרת תשלומים עתידית.`;
    steps.push(`שלב 3: היוון כלל התזרימים והתשלומים לנקודת ההווה:`);
    steps.push(`ערך נוכחי מחושב: ${pv.toFixed(2)} ₪`);
    resultNote = `הסכום הנוכחי השווה ערך לסדרת התשלומים הוא ${pv.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₪.`;
  } else if (solvedField === 'fv') {
    formula = `FV = - \\left[ PV \\cdot (1+i)^n + PMT \\cdot (1 + i \\cdot S) \\cdot \\frac{(1+i)^n - 1}{i} \\right]`;
    summary = `חישוב החיסכון והצבירה העתידית (ערך עתידי) בתום ${n} תקופות.`;
    steps.push(`שלב 3: צבירת הריבית דריבית והתשלומים לסוף התקופה:`);
    steps.push(`ערך עתידי מחושב: ${fv.toFixed(2)} ₪`);
    resultNote = `הסכום שיצטבר בתום התקופה הינו ${fv.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₪.`;
  } else if (solvedField === 'n') {
    formula = `n = \\frac{\\ln\\left(\\frac{A - FV}{PV + A}\\right)}{\\ln(1 + i)}, \\quad A = \\frac{PMT \\cdot (1 + i \\cdot S)}{i}`;
    summary = `חישוב משך הזמן ומספר התקופות הנדרשות לסילוק ההלוואה או השגת יעד החיסכון.`;
    steps.push(`שלב 3: חילוץ המעריך באמצעות לוגריתם טבעי (ln):`);
    steps.push(`מספר תקופות מחושב: ${n.toFixed(2)} תקופות (${(n / py).toFixed(2)} שנים בחישוב שנתי).`);
    resultNote = `נדרשות ${Math.ceil(n)} תקופות תשלום מלאות.`;
  } else if (solvedField === 'i') {
    formula = `PV + PMT \\cdot (1 + i \\cdot S) \\cdot \\frac{1 - (1+i)^{-n}}{i} + FV \\cdot (1+i)^{-n} = 0`;
    summary = `חילוץ שיעור התשואה / הריבית השנתית (I%) מתוך משוואת שוויון התזרימים.`;
    steps.push(`שלב 3: פתרון משוואת הפולינום מדרגה גבוהה בשיטת ניוטון-רפסון (Newton-Raphson Numerical Iteration) כפי שמבצע מחשבון ה-FC-200V:`);
    steps.push(`הריבית השנתית המחושבת: ${i.toFixed(4)}%`);
    resultNote = `הריבית האפקטיבית השנתית של העסקה היא ${i.toFixed(4)}%.`;
  }

  return {
    title,
    category: 'חישוב ערך הזמן של הכסף (CMPD / TVM)',
    summary,
    formula,
    parameters: [
      { label: 'Set', value: set, description: 'עיתוי התשלומים' },
      { label: 'n', value: n, description: 'מספר תקופות' },
      { label: 'I%', value: `${i}%`, description: 'ריבית שנתית' },
      { label: 'PV', value: `${pv.toLocaleString()} ₪`, description: 'ערך נוכחי' },
      { label: 'PMT', value: `${pmt.toLocaleString()} ₪`, description: 'תשלום תקופתי' },
      { label: 'FV', value: `${fv.toLocaleString()} ₪`, description: 'ערך עתידי' },
      { label: 'P/Y', value: py, description: 'תשלומים בשנה' },
      { label: 'C/Y', value: cy, description: 'תקופות ריבית בשנה' },
    ],
    steps,
    resultNote,
  };
}

/**
 * Generates solution for Amortization summary
 */
export function generateAmortSolution(
  summary: AmortizationSummary,
  params: TVMParams
): StepExplanation {
  const steps: string[] = [
    `שלב 1: הגדרת טווח התקופות לבדיקה: מתשלום PM1 = ${summary.pm1} עד תשלום PM2 = ${summary.pm2}.`,
    `שלב 2: יתרת קרן לאחר תשלום ${summary.pm2} (BAL): ${summary.bal.toLocaleString()} ₪`,
    `שלב 3: פירוט תשלום מס' ${summary.pm2}:`,
    `  • מרכיב ריבית (INT): ${summary.int.toLocaleString()} ₪`,
    `  • מרכיב קרן (PRN): ${summary.prn.toLocaleString()} ₪`,
    `שלב 4: סיכום מצטבר של כלל התשלומים מתקופה ${summary.pm1} ועד ${summary.pm2}:`,
    `  • סה"כ ריבית ששולמה (ΣINT): ${summary.sumInt.toLocaleString()} ₪`,
    `  • סה"כ קרן שסולקה (ΣPRN): ${summary.sumPrn.toLocaleString()} ₪`,
    `  • סה"כ תשלום כולל בתקופות אלו: ${(summary.sumInt + summary.sumPrn).toLocaleString()} ₪`,
  ];

  return {
    title: `דוח לוח סילוקין מתקופה ${summary.pm1} עד ${summary.pm2}`,
    category: 'לוח סילוקין (AMORT)',
    summary: `ניתוח מרכיבי הקרן, הריבית ויתרת ההלוואה עבור תקופות נבחרות.`,
    formula: `BAL_k = BAL_{k-1} - PRN_k, \\quad INT_k = BAL_{k-1} \\cdot i, \\quad PRN_k = PMT - INT_k`,
    parameters: [
      { label: 'PM1', value: summary.pm1, description: 'תקופת התחלה' },
      { label: 'PM2', value: summary.pm2, description: 'תקופת סיום' },
      { label: 'BAL', value: `${summary.bal.toLocaleString()} ₪`, description: 'יתרת קרן לסיום' },
      { label: 'INT', value: `${summary.int.toLocaleString()} ₪`, description: 'ריבית בתשלום PM2' },
      { label: 'PRN', value: `${summary.prn.toLocaleString()} ₪`, description: 'קרן בתשלום PM2' },
      { label: 'ΣINT', value: `${summary.sumInt.toLocaleString()} ₪`, description: 'סך ריבית בטווח' },
      { label: 'ΣPRN', value: `${summary.sumPrn.toLocaleString()} ₪`, description: 'סך קרן בטווח' },
    ],
    steps,
    resultNote: `הסילוק מבוצע בשיטת שפיצר (Spitzer annuity). לוח הסילוקין המלא זמין לצפייה ולייצוא ישיר לאקסל.`,
  };
}

/**
 * Generates solution for Cash Flow analysis
 */
export function generateCashFlowSolution(
  params: CashFlowParams,
  results: CashFlowResults
): StepExplanation {
  const steps: string[] = [
    `שלב 1: ריכוז תזרימי המזומנים:`,
    `• השקעה ראשונית (CF0): ${params.cf0.toLocaleString()} ₪`,
    `• מחיר ההון / שיעור היוון (I%): ${params.rate}%`,
    `• פירוט תקבולים/תשלומים עתידיים: ${params.flows.map((f, i) => `C${i + 1}=${f.flow}₪ (${f.frequency} תקופות)`).join(', ')}`,
    `שלב 2: חישוב ערך נוכחי נקי (NPV):`,
    `NPV = CF0 + ∑ [ CF_t / (1 + r)^t ] = ${results.npv.toLocaleString()} ₪`,
    results.npv > 0
      ? `הערך הנוכחי הנקי חיובי (+${results.npv.toLocaleString()} ₪), המעיד על כדאיות כלכלית לפרויקט מעבר למחיר ההון.`
      : `הערך הנוכחי הנקי שלילי (${results.npv.toLocaleString()} ₪), המעיד על אי-כדאיות כלכלית בריבית היוון זו.`,
    `שלב 3: שיעור תשואה פנימי (IRR):`,
    results.irr !== null
      ? `שיעור הריבית המאפס את ה-NPV הינו IRR = ${results.irr}%.`
      : `לא קיים שיעור IRR חוקי עבור תזרים זה.`,
    `שלב 4: תקופת החזר השקעה (PBP):`,
    results.pbp !== null
      ? `ההשקעה הראשונית מוחזרת במלואה תוך ${results.pbp} תקופות.`
      : `ההשקעה הראשונית אינה מוחזרת לאורך התקופות שהוגדרו.`,
  ];

  return {
    title: 'ניתוח תזרים מזומנים (CASH Flow)',
    category: 'תזרים מזומנים (CASH)',
    summary: `בדיקת כדאיות השקעה: חישוב NPV, IRR, PBP ו-NFV.`,
    formula: `NPV = \\sum_{t=0}^n \\frac{CF_t}{(1 + r)^t}, \\quad NPV(IRR) = 0`,
    parameters: [
      { label: 'I%', value: `${params.rate}%`, description: 'שיעור היוון' },
      { label: 'CF0', value: `${params.cf0.toLocaleString()} ₪`, description: 'השקעה ראשונית' },
      { label: 'NPV', value: `${results.npv.toLocaleString()} ₪`, description: 'ערך נוכחי נקי' },
      { label: 'IRR', value: results.irr ? `${results.irr}%` : 'N/A', description: 'שיעור תשואה פנימי' },
      { label: 'PBP', value: results.pbp ? `${results.pbp} תקופות` : 'N/A', description: 'תקופת החזר' },
      { label: 'NFV', value: `${results.nfv.toLocaleString()} ₪`, description: 'ערך עתידי נקי' },
    ],
    steps,
    resultNote: `דוח תזרים המזומנים המלא כולל טבלאות מפורטות זמין לייצוא לאקסל.`,
  };
}
