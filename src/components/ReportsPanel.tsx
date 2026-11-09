import React, { useState } from 'react';
import {
  StepExplanation,
  AmortizationSummary,
  TVMParams,
  CashFlowParams,
  CashFlowResults,
} from '../types/calculator';
import { AmortizationTable } from './AmortizationTable';
import { exportSolutionToExcel, exportCashFlowToExcel } from '../services/excelService';
import {
  BookOpen,
  TableProperties,
  TrendingUp,
  Download,
  Copy,
  Check,
  Smartphone,
  FileSpreadsheet,
  Printer,
} from 'lucide-react';

interface ReportsPanelProps {
  currentSolution: StepExplanation | null;
  amortizationSummary: AmortizationSummary | null;
  tvmParams: TVMParams;
  cashFlowParams: CashFlowParams;
  cashFlowResults: CashFlowResults | null;
  onOpenMobileGuide: () => void;
}

export const ReportsPanel: React.FC<ReportsPanelProps> = ({
  currentSolution,
  amortizationSummary,
  tvmParams,
  cashFlowParams,
  cashFlowResults,
  onOpenMobileGuide,
}) => {
  const [activeTab, setActiveTab] = useState<'solution' | 'amort' | 'cash' | 'mobile'>('solution');
  const [copied, setCopied] = useState(false);

  const handleCopySolution = () => {
    if (!currentSolution) return;
    const text = [
      currentSolution.title,
      '=' .repeat(30),
      currentSolution.summary,
      '',
      'פרמטרים:',
      ...currentSolution.parameters.map((p) => `${p.label} (${p.description}): ${p.value}`),
      '',
      'שלבי הפתרון:',
      ...currentSolution.steps,
      '',
      'מסקנה:',
      currentSolution.resultNote,
    ].join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900/95 rounded-3xl border border-zinc-800 shadow-2xl overflow-hidden">
      {/* Top Header & Tabs Bar */}
      <div className="bg-zinc-950 p-4 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
            מרכז דוחות, פתרונות וייצוא
          </h2>
        </div>

        {/* Action icons: Print, Mobile */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
            title="הדפס / שמור כ-PDF"
          >
            <Printer className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onOpenMobileGuide}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-semibold border border-blue-500/30 transition-all"
            title="מדריך התקנה ל-iPhone / iPad / APK"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>התקנה לנייד</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-zinc-800 bg-zinc-950/60 overflow-x-auto text-xs sm:text-sm font-medium">
        <button
          onClick={() => setActiveTab('solution')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'solution'
              ? 'border-blue-500 text-blue-400 bg-blue-500/10'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>דרך פתרון מלאה</span>
        </button>

        <button
          onClick={() => setActiveTab('amort')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'amort'
              ? 'border-blue-500 text-blue-400 bg-blue-500/10'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <TableProperties className="w-4 h-4" />
          <span>לוח סילוקין</span>
        </button>

        <button
          onClick={() => setActiveTab('cash')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'cash'
              ? 'border-blue-500 text-blue-400 bg-blue-500/10'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>תזרים מזומנים (CASH)</span>
        </button>

        <button
          onClick={() => setActiveTab('mobile')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'mobile'
              ? 'border-blue-500 text-blue-400 bg-blue-500/10'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>התקנה לנייד (APK & iOS)</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
        {/* TAB 1: DETAILED STEP-BY-STEP SOLUTION */}
        {activeTab === 'solution' && (
          <div className="flex flex-col gap-5">
            {currentSolution ? (
              <>
                {/* Header & Quick Action */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
                  <div>
                    <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                      {currentSolution.category}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-0.5">
                      {currentSolution.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopySolution}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-all"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      <span>{copied ? 'הועתק!' : 'העתק פתרון'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => exportSolutionToExcel(currentSolution)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>ייצא פתרון לאקסל</span>
                    </button>
                  </div>
                </div>

                {/* Problem Summary & Formula Box */}
                <div className="bg-zinc-950/70 p-4 rounded-xl border border-zinc-800/80">
                  <div className="text-xs text-zinc-400 mb-1 font-semibold">תיאור וניתוח כלכלי:</div>
                  <p className="text-sm text-zinc-200 leading-relaxed">
                    {currentSolution.summary}
                  </p>
                  {currentSolution.formula && (
                    <div className="mt-3 p-3 rounded-lg bg-zinc-900 border border-zinc-800 font-mono text-xs text-blue-300 text-left" dir="ltr">
                      {currentSolution.formula}
                    </div>
                  )}
                </div>

                {/* Parameters Grid */}
                <div>
                  <div className="text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">
                    נתוני הקלט שנלקחו מה-FC-200V:
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {currentSolution.parameters.map((p, idx) => (
                      <div key={idx} className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
                        <div className="text-[11px] text-zinc-400">{p.description} ({p.label})</div>
                        <div className="text-sm font-mono font-bold text-white mt-0.5">
                          {p.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step by Step Breakdown */}
                <div>
                  <div className="text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">
                    דרך הפתרון וההצבה המתמטית:
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {currentSolution.steps.map((st, idx) => (
                      <div
                        key={idx}
                        className="bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-800/80 text-xs sm:text-sm text-zinc-200 leading-relaxed font-sans whitespace-pre-line"
                      >
                        {st}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Final Result / Conclusion */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/60 to-indigo-950/60 border border-blue-800/50">
                  <div className="text-xs font-bold text-blue-300 uppercase tracking-wider mb-1">
                    מסקנה ותוצאה סופית:
                  </div>
                  <p className="text-sm sm:text-base font-semibold text-white">
                    {currentSolution.resultNote}
                  </p>
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-zinc-400">
                לחץ על SOLVE במחשבון ה-FC-200V כדי לראות את דרך הפתרון המלאה.
              </div>
            )}
          </div>
        )}

        {/* TAB 2: AMORTIZATION SCHEDULE */}
        {activeTab === 'amort' && (
          <AmortizationTable summary={amortizationSummary} params={tvmParams} />
        )}

        {/* TAB 3: CASH FLOW ANALYSIS */}
        {activeTab === 'cash' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
              <div>
                <h3 className="text-base font-bold text-white">ניתוח כדאיות תזרים מזומנים (CASH)</h3>
                <p className="text-xs text-zinc-400">חישוב NPV, IRR, PBP והחזר השקעה</p>
              </div>

              {cashFlowResults && (
                <button
                  type="button"
                  onClick={() => exportCashFlowToExcel(cashFlowParams, cashFlowResults)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>ייצא תזרים לאקסל</span>
                </button>
              )}
            </div>

            {cashFlowResults && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                  <div className="text-xs text-zinc-400">ערך נוכחי נקי (NPV)</div>
                  <div className={`text-lg font-bold font-mono ${cashFlowResults.npv >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {cashFlowResults.npv.toLocaleString()} ₪
                  </div>
                </div>

                <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                  <div className="text-xs text-zinc-400">תשואה פנימית (IRR)</div>
                  <div className="text-lg font-bold font-mono text-blue-400">
                    {cashFlowResults.irr !== null ? `${cashFlowResults.irr}%` : 'N/A'}
                  </div>
                </div>

                <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                  <div className="text-xs text-zinc-400">תקופת החזר (PBP)</div>
                  <div className="text-lg font-bold font-mono text-amber-400">
                    {cashFlowResults.pbp !== null ? `${cashFlowResults.pbp} תקופות` : 'לא הוחזר'}
                  </div>
                </div>

                <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                  <div className="text-xs text-zinc-400">שיעור היוון (I%)</div>
                  <div className="text-lg font-bold font-mono text-purple-400">
                    {cashFlowParams.rate}%
                  </div>
                </div>
              </div>
            )}

            {/* Flows breakdown table */}
            <div className="rounded-xl border border-zinc-800 overflow-hidden bg-zinc-950">
              <table className="w-full text-right text-xs">
                <thead className="bg-zinc-900 text-zinc-400 border-b border-zinc-800">
                  <tr>
                    <th className="p-3">תקופה / זרם</th>
                    <th className="p-3">תקבול / תשלום (₪)</th>
                    <th className="p-3">תדירות</th>
                    <th className="p-3">סוג תזרים</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  <tr className="hover:bg-zinc-900/50">
                    <td className="p-3 font-bold text-white">CF0 (השקעה התחלתית)</td>
                    <td className="p-3 font-mono font-bold text-red-400">{cashFlowParams.cf0.toLocaleString()} ₪</td>
                    <td className="p-3">1</td>
                    <td className="p-3 text-red-400/80">תזרים יוצא (Outflow)</td>
                  </tr>
                  {cashFlowParams.flows.map((f, i) => (
                    <tr key={f.id} className="hover:bg-zinc-900/50">
                      <td className="p-3 font-medium text-zinc-300">תקופה C{i + 1}</td>
                      <td className="p-3 font-mono font-bold text-emerald-400">+{f.flow.toLocaleString()} ₪</td>
                      <td className="p-3">{f.frequency}</td>
                      <td className="p-3 text-emerald-400/80">תקבול נכנס (Inflow)</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: MOBILE & APK INSTALL GUIDE */}
        {activeTab === 'mobile' && (
          <div className="flex flex-col gap-5 text-zinc-200">
            <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-blue-400" />
                <span>התקנה ישירה במכשירי נייד (iPhone, iPad ו-Android APK)</span>
              </h3>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                המחשבון נבנה בארכיטקטורת Progressive Web App (PWA) מתקדמת יחד עם תמיכת Capacitor מובנית, כך שניתן להתקין אותו ישירות על כל מכשיר, לעבוד איתו במסך מלא וללא צורך בחיבור אינטרנט.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* iPhone & iPad Card */}
              <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-white">
                    
                  </div>
                  <h4 className="font-bold text-white text-base">התקנה ב-iPhone ו-iPad</h4>
                </div>
                <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm text-zinc-300">
                  <li>פתח את האפליקציה בדפדפן <strong>Safari</strong> במכשיר ה-iOS שלך.</li>
                  <li>לחץ על כפתור <strong>השיתוף (Share)</strong> בתחתית המסך (הריבוע עם החץ למעלה).</li>
                  <li>גלול ובחר באפשרות <strong>"הוסף למסך הבית" (Add to Home Screen)</strong>.</li>
                  <li>לחץ על <strong>"הוסף" (Add)</strong>.</li>
                  <li>סמל המחשבון יופיע במסך הבית וייפתח כאפליקציה טבעית עצמאית במסך מלא!</li>
                </ol>
              </div>

              {/* Android APK Card */}
              <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold">
                    🤖
                  </div>
                  <h4 className="font-bold text-white text-base">גרסת Android וקובץ APK</h4>
                </div>
                <div className="space-y-3 text-xs sm:text-sm text-zinc-300">
                  <p>
                    <strong>אפשרות 1 (התקנה מיידית ללא צורך בהורדת קובץ):</strong>
                    <br />
                    פתח ב-Chrome בטלפון, לחץ על שלוש הנקודות בתפריט ובחר <strong>"התקן אפליקציה"</strong>.
                  </p>
                  <p>
                    <strong>אפשרות 2 (בניית קובץ APK מלא באמצעות Capacitor):</strong>
                    <br />
                    בתיקיית הפרויקט מוגדר Capacitor. הרצת הפקודות הבאות בטרמינל מייצרת את פרויקט האנדרואיד:
                  </p>
                  <div className="bg-zinc-900 p-2.5 rounded-lg font-mono text-[11px] text-emerald-400 text-left" dir="ltr">
                    npm run build<br />
                    npx cap add android<br />
                    npx cap build android
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

