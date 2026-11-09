import React, { useState } from 'react';
import { CasioFC200V } from './components/CasioFC200V';
import { ReportsPanel } from './components/ReportsPanel';
import { UserGuideModal } from './components/UserGuideModal';
import { MobileInstallModal } from './components/MobileInstallModal';
import {
  StepExplanation,
  AmortizationSummary,
  TVMParams,
  CashFlowParams,
  CashFlowResults,
} from './types/calculator';
import {
  Calculator,
  FileSpreadsheet,
  HelpCircle,
  Smartphone,
  Layers,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export const App: React.FC = () => {
  const [currentSolution, setCurrentSolution] = useState<StepExplanation | null>(null);
  const [amortizationSummary, setAmortizationSummary] = useState<AmortizationSummary | null>(null);
  const [tvmParams, setTvmParams] = useState<TVMParams>({
    set: 'End',
    n: 120,
    i: 5.5,
    pv: -100000,
    pmt: -1085.26,
    fv: 0,
    py: 12,
    cy: 12,
  });

  const [cashFlowParams, setCashFlowParams] = useState<CashFlowParams>({
    rate: 10,
    cf0: -50000,
    flows: [
      { id: '1', flow: 15000, frequency: 1 },
      { id: '2', flow: 20000, frequency: 1 },
      { id: '3', flow: 25000, frequency: 1 },
      { id: '4', flow: 30000, frequency: 1 },
    ],
  });
  const [cashFlowResults, setCashFlowResults] = useState<CashFlowResults | null>(null);

  // Modals state
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);

  // View mode for mobile/desktop
  const [mobileTab, setMobileTab] = useState<'calc' | 'reports'>('calc');
  const [layoutMode, setLayoutMode] = useState<'split' | 'calcOnly' | 'reportsOnly'>('split');

  const handleSolutionGenerated = (solution: StepExplanation) => {
    setCurrentSolution(solution);
  };

  const handleAmortizationUpdated = (summary: AmortizationSummary, params: TVMParams) => {
    setAmortizationSummary(summary);
    setTvmParams(params);
  };

  const handleCashFlowUpdated = (params: CashFlowParams, results: CashFlowResults) => {
    setCashFlowParams(params);
    setCashFlowResults(results);
  };

  return (
    <div className="min-h-screen bg-[#0f1115] text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Application Header */}
      <header className="sticky top-0 z-30 bg-[#14161b]/95 backdrop-blur border-b border-zinc-800/80 px-4 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-black text-sm">
              FC
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold tracking-wide text-white">
                  Casio FC-200V
                </h1>
                <span className="text-[10px] bg-blue-500/20 text-blue-400 font-bold px-1.5 py-0.5 rounded border border-blue-500/30">
                  Simulator & Reports Studio
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block">
                מחשבון פיננסי מקצועי • פתרונות מלאים שלב-אחר-שלב • לוח סילוקין וייצוא לאקסל
              </p>
            </div>
          </div>

          {/* Action buttons on desktop */}
          <div className="flex items-center gap-2">
            {/* Layout switch for desktop */}
            <div className="hidden lg:flex items-center bg-zinc-900 rounded-xl p-1 border border-zinc-800 text-xs">
              <button
                type="button"
                onClick={() => setLayoutMode('split')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  layoutMode === 'split' ? 'bg-blue-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                תצוגה משולבת
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode('calcOnly')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  layoutMode === 'calcOnly' ? 'bg-blue-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                מחשבון בלבד
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode('reportsOnly')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  layoutMode === 'reportsOnly' ? 'bg-blue-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                דוחות בלבד
              </button>
            </div>

            {/* Guide Button */}
            <button
              type="button"
              onClick={() => setIsGuideOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium transition-all"
              title="מדריך שימוש"
            >
              <HelpCircle className="w-4 h-4 text-blue-400" />
              <span className="hidden sm:inline">מדריך</span>
            </button>

            {/* Mobile / APK Install Button */}
            <button
              type="button"
              onClick={() => setIsMobileModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-600 hover:from-blue-600 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all active:scale-95"
            >
              <Smartphone className="w-4 h-4" />
              <span>התקנה לנייד / APK</span>
            </button>
          </div>
        </div>

        {/* Mobile View Toggle Bar (Only visible on screens < 1024px) */}
        <div className="flex lg:hidden mt-2 pt-2 border-t border-zinc-800/80">
          <div className="grid grid-cols-2 w-full gap-2 text-xs font-bold">
            <button
              type="button"
              onClick={() => setMobileTab('calc')}
              className={`py-2 rounded-xl flex items-center justify-center gap-2 transition-all ${
                mobileTab === 'calc'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-zinc-900 text-zinc-400'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>מחשבון FC-200V</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileTab('reports')}
              className={`py-2 rounded-xl flex items-center justify-center gap-2 transition-all ${
                mobileTab === 'reports'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-zinc-900 text-zinc-400'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>דוחות וייצוא לאקסל</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Studio Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 flex flex-col justify-center">
        {/* Responsive Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* CALCULATOR COLUMN */}
          <div
            className={`flex justify-center transition-all ${
              layoutMode === 'calcOnly'
                ? 'lg:col-span-12'
                : layoutMode === 'reportsOnly'
                ? 'hidden'
                : 'lg:col-span-5'
            } ${mobileTab === 'reports' ? 'hidden lg:flex' : 'flex'}`}
          >
            <CasioFC200V
              onSolutionGenerated={handleSolutionGenerated}
              onAmortizationUpdated={handleAmortizationUpdated}
              onCashFlowUpdated={handleCashFlowUpdated}
              onOpenMobileGuide={() => setIsMobileModalOpen(true)}
            />
          </div>

          {/* REPORTS & EXCEL STUDIO COLUMN */}
          <div
            className={`transition-all ${
              layoutMode === 'reportsOnly'
                ? 'lg:col-span-12'
                : layoutMode === 'calcOnly'
                ? 'hidden'
                : 'lg:col-span-7'
            } ${mobileTab === 'calc' ? 'hidden lg:block' : 'block'} min-h-[600px]`}
          >
            <ReportsPanel
              currentSolution={currentSolution}
              amortizationSummary={amortizationSummary}
              tvmParams={tvmParams}
              cashFlowParams={cashFlowParams}
              cashFlowResults={cashFlowResults}
              onOpenMobileGuide={() => setIsMobileModalOpen(true)}
            />
          </div>

        </div>
      </main>

      {/* Modals */}
      <UserGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
      <MobileInstallModal isOpen={isMobileModalOpen} onClose={() => setIsMobileModalOpen(false)} />
    </div>
  );
};

export default App;

