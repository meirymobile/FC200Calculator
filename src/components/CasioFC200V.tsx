import React, { useState, useEffect } from 'react';
import {
  CalculatorMode,
  PaymentTiming,
  TVMParams,
  AmortizationSummary,
  CashFlowParams,
  CashFlowResults,
  InterestConversionParams,
  CostSellMarginParams,
  StepExplanation,
} from '../types/calculator';
import { LCDScreen } from './LCDScreen';
import { DpadNavigation } from './DpadNavigation';
import { solveFV, solvePV, solvePMT, solveN, solveI } from '../engine/tvm';
import { calculateAmortizationSummary } from '../engine/amortization';
import { solveCashFlow } from '../engine/cashflow';
import { aprToEff, effToApr } from '../engine/conversion';
import { solveCost, solveMargin, solveSell } from '../engine/cost';
import { evaluateMathExpression } from '../engine/mathEvaluator';
import {
  generateTVMSolution,
  generateAmortSolution,
  generateCashFlowSolution,
} from '../engine/solutionsGenerator';

interface CasioFC200VProps {
  onSolutionGenerated: (solution: StepExplanation) => void;
  onAmortizationUpdated: (summary: AmortizationSummary, params: TVMParams) => void;
  onCashFlowUpdated: (params: CashFlowParams, results: CashFlowResults) => void;
  onOpenMobileGuide: () => void;
}

export const CasioFC200V: React.FC<CasioFC200VProps> = ({
  onSolutionGenerated,
  onAmortizationUpdated,
  onCashFlowUpdated,
  onOpenMobileGuide,
}) => {
  // Mode state
  const [mode, setMode] = useState<CalculatorMode>('CMPD');
  const [isShift, setIsShift] = useState(false);
  const [isAlpha, setIsAlpha] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // TVM (CMPD) state with sensible default sample values
  const [tvmParams, setTvmParams] = useState<TVMParams>({
    set: 'End',
    n: 120, // 10 years monthly
    i: 5.5, // 5.5% annual
    pv: -100000, // 100,000 NIS loan
    pmt: 0,
    fv: 0,
    py: 12,
    cy: 12,
  });

  // Amortization parameters
  const [amortPm1, setAmortPm1] = useState(1);
  const [amortPm2, setAmortPm2] = useState(12);

  // Cash flow parameters
  const [cfParams, setCfParams] = useState<CashFlowParams>({
    rate: 10,
    cf0: -50000,
    flows: [
      { id: '1', flow: 15000, frequency: 1 },
      { id: '2', flow: 20000, frequency: 1 },
      { id: '3', flow: 25000, frequency: 1 },
      { id: '4', flow: 30000, frequency: 1 },
    ],
  });

  // Conversion parameters
  const [cnvrParams, setCnvrParams] = useState<InterestConversionParams>({
    n: 12,
    apr: 6.0,
    eff: 6.1678,
  });

  // Cost Sell Margin parameters
  const [costParams, setCostParams] = useState<CostSellMarginParams>({
    cst: 100,
    sel: 125,
    mar: 20,
  });

  // COMP Mode expression
  const [compExpr, setCompExpr] = useState<string>('');
  const [compResult, setCompResult] = useState<string>('0');

  // Active parameter index for current mode
  const [paramIndex, setParamIndex] = useState<number>(1); // default to n in CMPD
  const [editValue, setEditValue] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Setup initial calculation on mount
  useEffect(() => {
    // Calculate initial PMT and update summaries
    try {
      const initialPmt = solvePMT(tvmParams);
      const updatedTvm = { ...tvmParams, pmt: Number(initialPmt.toFixed(2)) };
      setTvmParams(updatedTvm);

      const amort = calculateAmortizationSummary(updatedTvm, amortPm1, amortPm2);
      onAmortizationUpdated(amort, updatedTvm);

      const sol = generateTVMSolution('pmt', updatedTvm);
      onSolutionGenerated(sol);

      const cfRes = solveCashFlow(cfParams);
      onCashFlowUpdated(cfParams, cfRes);
    } catch {
      // ignore
    }
  }, []);

  // Determine menu items based on mode
  interface MenuItem {
    key: string;
    label: string;
    value: string | number;
    canSolve: boolean;
    isTiming?: boolean;
  }

  const getMenuItems = (): MenuItem[] => {
    switch (mode) {
      case 'CMPD':
        return [
          { key: 'set', label: 'Set', value: tvmParams.set, canSolve: false, isTiming: true },
          { key: 'n', label: 'n', value: tvmParams.n, canSolve: true },
          { key: 'i', label: 'I%', value: `${tvmParams.i}`, canSolve: true },
          { key: 'pv', label: 'PV', value: `${tvmParams.pv}`, canSolve: true },
          { key: 'pmt', label: 'PMT', value: `${tvmParams.pmt}`, canSolve: true },
          { key: 'fv', label: 'FV', value: `${tvmParams.fv}`, canSolve: true },
          { key: 'py', label: 'P/Y', value: tvmParams.py, canSolve: false },
          { key: 'cy', label: 'C/Y', value: tvmParams.cy, canSolve: false },
        ];
      case 'AMORT': {
        const amort = calculateAmortizationSummary(tvmParams, amortPm1, amortPm2);
        return [
          { key: 'pm1', label: 'PM1', value: amortPm1, canSolve: false },
          { key: 'pm2', label: 'PM2', value: amortPm2, canSolve: false },
          { key: 'bal', label: 'BAL', value: amort.bal, canSolve: true },
          { key: 'int', label: 'INT', value: amort.int, canSolve: true },
          { key: 'prn', label: 'PRN', value: amort.prn, canSolve: true },
          { key: 'sumInt', label: 'ΣINT', value: amort.sumInt, canSolve: true },
          { key: 'sumPrn', label: 'ΣPRN', value: amort.sumPrn, canSolve: true },
        ];
      }
      case 'CASH': {
        const res = solveCashFlow(cfParams);
        return [
          { key: 'rate', label: 'I%', value: `${cfParams.rate}`, canSolve: false },
          { key: 'cf0', label: 'CF0', value: `${cfParams.cf0}`, canSolve: false },
          ...cfParams.flows.map((f, idx) => ({
            key: `cf_${idx}`,
            label: `C${idx + 1}`,
            value: `${f.flow}`,
            canSolve: false,
          })),
          { key: 'npv', label: 'NPV', value: res.npv, canSolve: true },
          { key: 'irr', label: 'IRR', value: res.irr !== null ? `${res.irr}%` : 'ERR', canSolve: true },
          { key: 'pbp', label: 'PBP', value: res.pbp !== null ? res.pbp : 'ERR', canSolve: true },
          { key: 'nfv', label: 'NFV', value: res.nfv, canSolve: true },
        ];
      }
      case 'CNVR':
        return [
          { key: 'cnvr_n', label: 'n', value: cnvrParams.n, canSolve: false },
          { key: 'apr', label: 'APR', value: `${cnvrParams.apr}`, canSolve: true },
          { key: 'eff', label: 'EFF', value: `${cnvrParams.eff}`, canSolve: true },
        ];
      case 'COST':
        return [
          { key: 'cst', label: 'CST', value: `${costParams.cst}`, canSolve: true },
          { key: 'sel', label: 'SEL', value: `${costParams.sel}`, canSolve: true },
          { key: 'mar', label: 'MAR%', value: `${costParams.mar}`, canSolve: true },
        ];
      default:
        return [{ key: 'res', label: 'ANS', value: compResult, canSolve: false }];
    }
  };

  const menuItems = getMenuItems();
  const safeIndex = Math.min(paramIndex, menuItems.length - 1);
  const currentItem = menuItems[safeIndex] || menuItems[0];

  // Up & Down navigation in parameter menu
  const handleUp = () => {
    if (mode === 'COMP') return;
    setIsEditing(false);
    setEditValue('');
    setParamIndex((prev) => (prev > 0 ? prev - 1 : menuItems.length - 1));
  };

  const handleDown = () => {
    if (mode === 'COMP') return;
    setIsEditing(false);
    setEditValue('');
    setParamIndex((prev) => (prev < menuItems.length - 1 ? prev + 1 : 0));
  };

  // Switch mode
  const handleSelectMode = (newMode: CalculatorMode) => {
    setMode(newMode);
    setIsEditing(false);
    setEditValue('');
    setParamIndex(newMode === 'CMPD' ? 1 : 0);
    setStatusMessage('');
  };

  // Append character/digit
  const handleInputChar = (char: string) => {
    if (mode === 'COMP') {
      setCompExpr((prev) => prev + char);
      return;
    }

    if (!isEditing) {
      setIsEditing(true);
      setEditValue(char);
    } else {
      setEditValue((prev) => prev + char);
    }
  };

  // Backspace / DEL
  const handleDelete = () => {
    if (mode === 'COMP') {
      setCompExpr((prev) => prev.slice(0, -1));
      return;
    }
    if (isEditing) {
      if (editValue.length <= 1) {
        setEditValue('');
        setIsEditing(false);
      } else {
        setEditValue((prev) => prev.slice(0, -1));
      }
    }
  };

  // AC / Clear
  const handleClear = () => {
    if (mode === 'COMP') {
      setCompExpr('');
      setCompResult('0');
    } else {
      setIsEditing(false);
      setEditValue('');
      setStatusMessage('');
    }
  };

  // Toggle negative sign
  const handleToggleSign = () => {
    if (mode === 'COMP') {
      handleInputChar('(-)');
      return;
    }
    if (isEditing) {
      if (editValue.startsWith('-')) {
        setEditValue(editValue.substring(1));
      } else {
        setEditValue('-' + editValue);
      }
    } else {
      const curStr = String(currentItem.value);
      const numVal = parseFloat(curStr);
      if (!isNaN(numVal)) {
        setIsEditing(true);
        setEditValue(String(-numVal));
      }
    }
  };

  // EXE button: commit current input or calculate COMP expression
  const handleExe = () => {
    if (mode === 'COMP') {
      try {
        const res = evaluateMathExpression(compExpr);
        setCompResult(Number(res.toFixed(8)).toString());
      } catch (err: any) {
        setCompResult(err.message || 'ERROR');
      }
      return;
    }

    if (currentItem.isTiming) {
      // Toggle Set: Begin / End
      const newTiming: PaymentTiming = tvmParams.set === 'End' ? 'Begin' : 'End';
      const updatedTvm = { ...tvmParams, set: newTiming };
      setTvmParams(updatedTvm);
      const amort = calculateAmortizationSummary(updatedTvm, amortPm1, amortPm2);
      onAmortizationUpdated(amort, updatedTvm);
      return;
    }

    if (isEditing && editValue.trim() !== '') {
      const num = parseFloat(editValue);
      if (!isNaN(num)) {
        updateCurrentParamValue(currentItem.key, num);
      }
      setIsEditing(false);
      setEditValue('');
      // Automatically advance to next parameter
      handleDown();
    } else {
      // Just advance down
      handleDown();
    }
  };

  const updateCurrentParamValue = (key: string, val: number) => {
    if (mode === 'CMPD') {
      const updated = { ...tvmParams, [key]: val };
      setTvmParams(updated);
      const amort = calculateAmortizationSummary(updated, amortPm1, amortPm2);
      onAmortizationUpdated(amort, updated);
    } else if (mode === 'AMORT') {
      if (key === 'pm1') setAmortPm1(Math.max(1, Math.round(val)));
      if (key === 'pm2') setAmortPm2(Math.max(1, Math.round(val)));
      const amort = calculateAmortizationSummary(tvmParams, amortPm1, amortPm2);
      onAmortizationUpdated(amort, tvmParams);
    } else if (mode === 'CASH') {
      if (key === 'rate') setCfParams((p) => ({ ...p, rate: val }));
      else if (key === 'cf0') setCfParams((p) => ({ ...p, cf0: val }));
      else if (key.startsWith('cf_')) {
        const idx = parseInt(key.replace('cf_', ''), 10);
        const newFlows = [...cfParams.flows];
        if (newFlows[idx]) {
          newFlows[idx] = { ...newFlows[idx], flow: val };
          setCfParams((p) => ({ ...p, flows: newFlows }));
        }
      }
      const res = solveCashFlow(cfParams);
      onCashFlowUpdated(cfParams, res);
    } else if (mode === 'CNVR') {
      setCnvrParams((p) => ({ ...p, [key.replace('cnvr_', '')]: val }));
    } else if (mode === 'COST') {
      setCostParams((p) => ({ ...p, [key]: val }));
    }
  };

  // SOLVE button: the magic key of FC-200V
  const handleSolve = () => {
    if (mode === 'COMP') {
      handleExe();
      return;
    }

    try {
      if (mode === 'CMPD') {
        const key = currentItem.key;
        let updatedParams = { ...tvmParams };

        if (key === 'pmt') {
          const res = solvePMT(tvmParams);
          updatedParams.pmt = Number(res.toFixed(2));
          setTvmParams(updatedParams);
          const sol = generateTVMSolution('pmt', updatedParams);
          onSolutionGenerated(sol);
          setStatusMessage('SOLVED PMT');
        } else if (key === 'pv') {
          const res = solvePV(tvmParams);
          updatedParams.pv = Number(res.toFixed(2));
          setTvmParams(updatedParams);
          const sol = generateTVMSolution('pv', updatedParams);
          onSolutionGenerated(sol);
          setStatusMessage('SOLVED PV');
        } else if (key === 'fv') {
          const res = solveFV(tvmParams);
          updatedParams.fv = Number(res.toFixed(2));
          setTvmParams(updatedParams);
          const sol = generateTVMSolution('fv', updatedParams);
          onSolutionGenerated(sol);
          setStatusMessage('SOLVED FV');
        } else if (key === 'n') {
          const res = solveN(tvmParams);
          updatedParams.n = Number(res.toFixed(2));
          setTvmParams(updatedParams);
          const sol = generateTVMSolution('n', updatedParams);
          onSolutionGenerated(sol);
          setStatusMessage('SOLVED n');
        } else if (key === 'i') {
          const res = solveI(tvmParams);
          updatedParams.i = Number(res.toFixed(4));
          setTvmParams(updatedParams);
          const sol = generateTVMSolution('i', updatedParams);
          onSolutionGenerated(sol);
          setStatusMessage('SOLVED I%');
        }

        const amort = calculateAmortizationSummary(updatedParams, amortPm1, amortPm2);
        onAmortizationUpdated(amort, updatedParams);
      } else if (mode === 'AMORT') {
        const amort = calculateAmortizationSummary(tvmParams, amortPm1, amortPm2);
        onAmortizationUpdated(amort, tvmParams);
        const sol = generateAmortSolution(amort, tvmParams);
        onSolutionGenerated(sol);
        setStatusMessage(`AMORT ${currentItem.key.toUpperCase()}`);
      } else if (mode === 'CASH') {
        const res = solveCashFlow(cfParams);
        onCashFlowUpdated(cfParams, res);
        const sol = generateCashFlowSolution(cfParams, res);
        onSolutionGenerated(sol);
        setStatusMessage(`CASH ${currentItem.key.toUpperCase()}`);
      } else if (mode === 'CNVR') {
        if (currentItem.key === 'eff') {
          const eff = aprToEff(cnvrParams.apr, cnvrParams.n);
          setCnvrParams((p) => ({ ...p, eff }));
          setStatusMessage('SOLVED EFF');
        } else if (currentItem.key === 'apr') {
          const apr = effToApr(cnvrParams.eff, cnvrParams.n);
          setCnvrParams((p) => ({ ...p, apr }));
          setStatusMessage('SOLVED APR');
        }
      } else if (mode === 'COST') {
        if (currentItem.key === 'mar') {
          const mar = solveMargin(costParams.cst, costParams.sel);
          setCostParams((p) => ({ ...p, mar }));
          setStatusMessage('SOLVED MAR%');
        } else if (currentItem.key === 'sel') {
          const sel = solveSell(costParams.cst, costParams.mar);
          setCostParams((p) => ({ ...p, sel }));
          setStatusMessage('SOLVED SEL');
        } else if (currentItem.key === 'cst') {
          const cst = solveCost(costParams.sel, costParams.mar);
          setCostParams((p) => ({ ...p, cst }));
          setStatusMessage('SOLVED CST');
        }
      }
    } catch (err: any) {
      setStatusMessage('ERROR: ' + (err.message || 'Math ERROR'));
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Outer Calculator Matte Black Chassis */}
      <div className="relative w-full max-w-[390px] sm:max-w-[420px] rounded-3xl bg-[#16171a] p-4 sm:p-5 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.08),inset_0_1px_2px_rgba(255,255,255,0.12)] border border-[#23252a] select-none">
        
        {/* Brand & Model Name Header */}
        <div className="flex items-center justify-between pb-3 pt-1 border-b border-zinc-800/80 mb-3 px-1">
          <div className="flex items-baseline gap-2">
            <span className="font-sans font-black tracking-widest text-lg sm:text-xl text-white">
              CASIO
            </span>
            <span className="text-[10px] sm:text-xs text-zinc-400 font-medium tracking-wide">
              FC-200V
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[9px] uppercase tracking-wider text-amber-500/90 font-bold">
              Financial Consultant
            </span>
            <span className="text-[8px] text-zinc-400 tracking-tight">
              TWO WAY POWER
            </span>
          </div>
        </div>

        {/* Authentic Dual-Line LCD Screen */}
        <div className="mb-4">
          <LCDScreen
            mode={mode}
            paramName={currentItem.label}
            paramValue={String(currentItem.value)}
            editValue={editValue}
            isEditing={isEditing}
            canSolve={currentItem.canSolve}
            hasUp={safeIndex > 0}
            hasDown={safeIndex < menuItems.length - 1}
            isShift={isShift}
            isAlpha={isAlpha}
            timing={tvmParams.set}
            statusMessage={statusMessage}
            compExpression={compExpr}
          />
        </div>

        {/* Financial Mode Function Keys (Row 1) */}
        <div className="mb-3">
          <div className="text-[8px] sm:text-[9px] text-zinc-400 font-semibold mb-1 text-center tracking-wider">
            FINANCIAL MODES
          </div>
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
            {[
              { id: 'CMPD', label: 'CMPD', desc: 'ריבית דריבית' },
              { id: 'AMORT', label: 'AMORT', desc: 'סילוקין' },
              { id: 'CASH', label: 'CASH', desc: 'תזרים' },
              { id: 'CNVR', label: 'CNVR', desc: 'המרת ריבית' },
              { id: 'COST', label: 'COST', desc: 'רווחיות' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => handleSelectMode(m.id as CalculatorMode)}
                className={`py-1.5 sm:py-2 rounded text-[11px] sm:text-xs font-bold transition-all shadow-sm ${
                  mode === m.id
                    ? 'bg-blue-600 text-white shadow-blue-500/30 shadow-md ring-1 ring-blue-400'
                    : 'bg-[#25282f] text-zinc-200 hover:bg-[#2e323b] active:translate-y-0.5'
                }`}
                title={m.desc}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation & Operational Middle Row */}
        <div className="grid grid-cols-3 items-center gap-2 mb-4 px-1">
          {/* Left Functional Buttons */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setIsShift(!isShift)}
              className={`py-1.5 sm:py-2 rounded text-xs font-black shadow transition-all ${
                isShift
                  ? 'bg-amber-500 text-black ring-1 ring-amber-300'
                  : 'bg-[#25282f] text-amber-400 hover:bg-[#2c3038]'
              }`}
            >
              SHIFT
            </button>
            <button
              type="button"
              onClick={() => setIsAlpha(!isAlpha)}
              className={`py-1.5 sm:py-2 rounded text-xs font-black shadow transition-all ${
                isAlpha
                  ? 'bg-red-500 text-white ring-1 ring-red-300'
                  : 'bg-[#25282f] text-red-400 hover:bg-[#2c3038]'
              }`}
            >
              ALPHA
            </button>
            <button
              type="button"
              onClick={() => handleSelectMode('COMP')}
              className={`py-1 sm:py-1.5 rounded text-[10px] font-bold shadow ${
                mode === 'COMP' ? 'bg-zinc-200 text-zinc-900' : 'bg-[#202227] text-zinc-400 hover:text-white'
              }`}
            >
              COMP / CALC
            </button>
          </div>

          {/* Center Blue-Gray Navigation D-pad (REPLAY) */}
          <div className="flex justify-center">
            <DpadNavigation
              onUp={handleUp}
              onDown={handleDown}
              onLeft={handleUp}
              onRight={handleDown}
            />
          </div>

          {/* Right Functional Buttons with SOLVE */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setEditValue('');
              }}
              className="py-1.5 sm:py-2 rounded text-xs font-bold bg-[#25282f] text-zinc-300 hover:bg-[#2c3038] shadow active:translate-y-0.5"
            >
              ESC
            </button>

            {/* High-visibility SOLVE button */}
            <button
              type="button"
              onClick={handleSolve}
              className="py-3 rounded-lg text-xs sm:text-sm font-black bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-700 hover:from-blue-600 hover:to-indigo-500 text-white shadow-[0_4px_12px_rgba(37,99,235,0.4),inset_0_1px_1px_rgba(255,255,255,0.4)] active:translate-y-0.5 transition-all ring-1 ring-blue-400/50 flex flex-col items-center justify-center"
              title="פתור ערך עבור הפרמטר הנוכחי"
            >
              <span>SOLVE</span>
              <span className="text-[8px] font-normal opacity-80">בצע חישוב</span>
            </button>
          </div>
        </div>

        {/* Secondary Function Buttons Row */}
        <div className="grid grid-cols-6 gap-1.5 mb-3">
          {[
            { label: '(', val: '(' },
            { label: ')', val: ')' },
            { label: 'x²', val: '^2' },
            { label: '√', val: 'sqrt(' },
            { label: 'ln', val: 'ln(' },
            { label: 'log', val: 'log(' },
          ].map((b, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleInputChar(b.val)}
              className="py-1 rounded bg-[#222429] hover:bg-[#2b2d34] text-zinc-300 text-xs font-semibold shadow-sm active:translate-y-0.5"
            >
              {b.label}
            </button>
          ))}
        </div>

        {/* Main Numeric Keypad */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {/* Row 1 */}
          <button
            type="button"
            onClick={() => handleInputChar('7')}
            className="py-2.5 sm:py-3 rounded-lg bg-[#383d47] hover:bg-[#424854] text-white font-bold text-base sm:text-lg shadow-[0_3px_0_#1e2127] active:translate-y-0.5"
          >
            7
          </button>
          <button
            type="button"
            onClick={() => handleInputChar('8')}
            className="py-2.5 sm:py-3 rounded-lg bg-[#383d47] hover:bg-[#424854] text-white font-bold text-base sm:text-lg shadow-[0_3px_0_#1e2127] active:translate-y-0.5"
          >
            8
          </button>
          <button
            type="button"
            onClick={() => handleInputChar('9')}
            className="py-2.5 sm:py-3 rounded-lg bg-[#383d47] hover:bg-[#424854] text-white font-bold text-base sm:text-lg shadow-[0_3px_0_#1e2127] active:translate-y-0.5"
          >
            9
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="py-2.5 sm:py-3 rounded-lg bg-[#842020] hover:bg-[#992626] text-white font-bold text-sm shadow-[0_3px_0_#4d1313] active:translate-y-0.5"
          >
            DEL
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="py-2.5 sm:py-3 rounded-lg bg-[#a62b2b] hover:bg-[#bf3232] text-white font-bold text-sm shadow-[0_3px_0_#5e1818] active:translate-y-0.5"
          >
            AC
          </button>

          {/* Row 2 */}
          <button
            type="button"
            onClick={() => handleInputChar('4')}
            className="py-2.5 sm:py-3 rounded-lg bg-[#383d47] hover:bg-[#424854] text-white font-bold text-base sm:text-lg shadow-[0_3px_0_#1e2127] active:translate-y-0.5"
          >
            4
          </button>
          <button
            type="button"
            onClick={() => handleInputChar('5')}
            className="py-2.5 sm:py-3 rounded-lg bg-[#383d47] hover:bg-[#424854] text-white font-bold text-base sm:text-lg shadow-[0_3px_0_#1e2127] active:translate-y-0.5"
          >
            5
          </button>
          <button
            type="button"
            onClick={() => handleInputChar('6')}
            className="py-2.5 sm:py-3 rounded-lg bg-[#383d47] hover:bg-[#424854] text-white font-bold text-base sm:text-lg shadow-[0_3px_0_#1e2127] active:translate-y-0.5"
          >
            6
          </button>
          <button
            type="button"
            onClick={() => handleInputChar('×')}
            className="py-2.5 sm:py-3 rounded-lg bg-[#2a2d34] hover:bg-[#343842] text-zinc-100 font-bold text-base shadow-[0_3px_0_#17191d] active:translate-y-0.5"
          >
            ×
          </button>
          <button
            type="button"
            onClick={() => handleInputChar('÷')}
            className="py-2.5 sm:py-3 rounded-lg bg-[#2a2d34] hover:bg-[#343842] text-zinc-100 font-bold text-base shadow-[0_3px_0_#17191d] active:translate-y-0.5"
          >
            ÷
          </button>

          {/* Row 3 */}
          <button
            type="button"
            onClick={() => handleInputChar('1')}
            className="py-2.5 sm:py-3 rounded-lg bg-[#383d47] hover:bg-[#424854] text-white font-bold text-base sm:text-lg shadow-[0_3px_0_#1e2127] active:translate-y-0.5"
          >
            1
          </button>
          <button
            type="button"
            onClick={() => handleInputChar('2')}
            className="py-2.5 sm:py-3 rounded-lg bg-[#383d47] hover:bg-[#424854] text-white font-bold text-base sm:text-lg shadow-[0_3px_0_#1e2127] active:translate-y-0.5"
          >
            2
          </button>
          <button
            type="button"
            onClick={() => handleInputChar('3')}
            className="py-2.5 sm:py-3 rounded-lg bg-[#383d47] hover:bg-[#424854] text-white font-bold text-base sm:text-lg shadow-[0_3px_0_#1e2127] active:translate-y-0.5"
          >
            3
          </button>
          <button
            type="button"
            onClick={() => handleInputChar('+')}
            className="py-2.5 sm:py-3 rounded-lg bg-[#2a2d34] hover:bg-[#343842] text-zinc-100 font-bold text-base shadow-[0_3px_0_#17191d] active:translate-y-0.5"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => handleInputChar('-')}
            className="py-2.5 sm:py-3 rounded-lg bg-[#2a2d34] hover:bg-[#343842] text-zinc-100 font-bold text-base shadow-[0_3px_0_#17191d] active:translate-y-0.5"
          >
            -
          </button>

          {/* Row 4 */}
          <button
            type="button"
            onClick={() => handleInputChar('0')}
            className="py-2.5 sm:py-3 rounded-lg bg-[#383d47] hover:bg-[#424854] text-white font-bold text-base sm:text-lg shadow-[0_3px_0_#1e2127] active:translate-y-0.5"
          >
            0
          </button>
          <button
            type="button"
            onClick={() => handleInputChar('.')}
            className="py-2.5 sm:py-3 rounded-lg bg-[#383d47] hover:bg-[#424854] text-white font-bold text-base sm:text-lg shadow-[0_3px_0_#1e2127] active:translate-y-0.5"
          >
            .
          </button>
          <button
            type="button"
            onClick={handleToggleSign}
            className="py-2.5 sm:py-3 rounded-lg bg-[#2a2d34] hover:bg-[#343842] text-zinc-200 font-bold text-sm shadow-[0_3px_0_#17191d] active:translate-y-0.5"
            title="שינוי סימן חיובי/שלילי (-)"
          >
            (-)
          </button>
          <button
            type="button"
            onClick={handleExe}
            className="col-span-2 py-2.5 sm:py-3 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-black text-sm sm:text-base shadow-[0_3px_0_#1e40af] active:translate-y-0.5"
            title="אשר ערך / בצע פעולה"
          >
            EXE
          </button>
        </div>

        {/* Bottom subtle model details & Mobile Install helper */}
        <div className="mt-4 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-400">
          <span>Casio FC-200V Emulation Engine</span>
          <button
            type="button"
            onClick={onOpenMobileGuide}
            className="text-blue-400 hover:text-blue-300 font-semibold underline"
          >
            התקנה לאייפון / אנדרואיד 📱
          </button>
        </div>
      </div>
    </div>
  );
};
