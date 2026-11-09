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
import { evaluateMathExpression, EvalContext } from '../engine/mathEvaluator';
import {
  generateTVMSolution,
  generateAmortSolution,
  generateCashFlowSolution,
} from '../engine/solutionsGenerator';
import { playKeyClick, toggleSound, isSoundEnabled } from '../utils/soundEffects';
import { Volume2, VolumeX } from 'lucide-react';

interface CasioFC200VProps {
  onSolutionGenerated: (solution: StepExplanation) => void;
  onAmortizationUpdated: (summary: AmortizationSummary, params: TVMParams) => void;
  onCashFlowUpdated: (params: CashFlowParams, results: CashFlowResults) => void;
  onOpenMobileGuide: () => void;
  presetData?: {
    mode: CalculatorMode;
    tvm?: TVMParams;
    cash?: CashFlowParams;
    solvedField?: 'n' | 'i' | 'pv' | 'pmt' | 'fv';
    timestamp: number;
  };
}

export const CasioFC200V: React.FC<CasioFC200VProps> = ({
  onSolutionGenerated,
  onAmortizationUpdated,
  onCashFlowUpdated,
  onOpenMobileGuide,
  presetData,
}) => {
  // Mode state
  const [mode, setMode] = useState<CalculatorMode>('CMPD');
  const [isShift, setIsShift] = useState(false);
  const [isAlpha, setIsAlpha] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [soundOn, setSoundOn] = useState<boolean>(isSoundEnabled());
  const [angleUnit, setAngleUnit] = useState<'DEG' | 'RAD'>('DEG');

  // Memory registers
  const [memory, setMemory] = useState<Record<string, number>>({
    A: 0,
    B: 0,
    C: 0,
    D: 0,
    X: 0,
    Y: 0,
    M: 0,
  });
  const [ans, setAns] = useState<number>(0);
  const [isStoreMode, setIsStoreMode] = useState(false);

  // TVM (CMPD) state
  const [tvmParams, setTvmParams] = useState<TVMParams>({
    set: 'End',
    n: 120,
    i: 5.5,
    pv: -100000,
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
  const [paramIndex, setParamIndex] = useState<number>(1);
  const [editValue, setEditValue] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Preset loader
  useEffect(() => {
    if (!presetData) return;
    setMode(presetData.mode);
    setIsEditing(false);
    setEditValue('');
    setParamIndex(presetData.mode === 'CMPD' ? 4 : 0);

    if (presetData.tvm) {
      setTvmParams(presetData.tvm);
      const amort = calculateAmortizationSummary(presetData.tvm, amortPm1, amortPm2);
      onAmortizationUpdated(amort, presetData.tvm);
      const sol = generateTVMSolution(presetData.solvedField || 'pmt', presetData.tvm);
      onSolutionGenerated(sol);
      setStatusMessage('PRESET LOADED');
    } else if (presetData.cash) {
      setCfParams(presetData.cash);
      const res = solveCashFlow(presetData.cash);
      onCashFlowUpdated(presetData.cash, res);
      const sol = generateCashFlowSolution(presetData.cash, res);
      onSolutionGenerated(sol);
      setStatusMessage('CASH PRESET');
    }
  }, [presetData?.timestamp]);

  // Initial calculation on mount
  useEffect(() => {
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

  // Menu items for LCD screen based on mode
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
      case 'DAYS':
        return [
          { key: 'dys_d1', label: 'd1', value: '2026.1109', canSolve: false },
          { key: 'dys_d2', label: 'd2', value: '2027.1109', canSolve: false },
          { key: 'dys_dys', label: 'Dys', value: 365, canSolve: true },
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
    playKeyClick('func');
    if (mode === 'COMP') return;
    setIsEditing(false);
    setEditValue('');
    setParamIndex((prev) => (prev > 0 ? prev - 1 : menuItems.length - 1));
  };

  const handleDown = () => {
    playKeyClick('func');
    if (mode === 'COMP') return;
    setIsEditing(false);
    setEditValue('');
    setParamIndex((prev) => (prev < menuItems.length - 1 ? prev + 1 : 0));
  };

  // Switch mode
  const handleSelectMode = (newMode: CalculatorMode) => {
    playKeyClick('func');
    setMode(newMode);
    setIsEditing(false);
    setEditValue('');
    setParamIndex(newMode === 'CMPD' ? 1 : 0);
    setStatusMessage('');
  };

  // Append character/digit
  const handleInputChar = (char: string) => {
    playKeyClick('num');

    // Handle variable storing if STO was pressed
    if (isStoreMode && ['A', 'B', 'C', 'D', 'X', 'Y', 'M'].includes(char)) {
      const valToStore = mode === 'COMP' ? parseFloat(compResult) || 0 : parseFloat(String(currentItem.value)) || 0;
      setMemory((prev) => ({ ...prev, [char]: valToStore }));
      setIsStoreMode(false);
      setStatusMessage(`${valToStore} -> ${char}`);
      return;
    }

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
    playKeyClick('del');
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
    playKeyClick('del');
    if (mode === 'COMP') {
      setCompExpr('');
      setCompResult('0');
    } else {
      setIsEditing(false);
      setEditValue('');
      setStatusMessage('');
    }
    setIsShift(false);
    setIsAlpha(false);
    setIsStoreMode(false);
  };

  // Toggle negative sign
  const handleToggleSign = () => {
    playKeyClick('num');
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

  // Handle scientific function insertion
  const handleScientific = (
    normal: string,
    shiftVal?: string,
    alphaVal?: string
  ) => {
    playKeyClick('func');

    let toInsert = normal;
    if (isShift && shiftVal) {
      toInsert = shiftVal;
      setIsShift(false);
    } else if (isAlpha && alphaVal) {
      toInsert = alphaVal;
      setIsAlpha(false);
    }

    if (toInsert === 'STO') {
      setIsStoreMode(true);
      setStatusMessage('STO');
      return;
    }

    if (toInsert === 'RCL') {
      setStatusMessage('RCL');
      return;
    }

    if (toInsert === 'DEG/RAD') {
      const nextUnit = angleUnit === 'DEG' ? 'RAD' : 'DEG';
      setAngleUnit(nextUnit);
      setStatusMessage(`ANGLE: ${nextUnit}`);
      return;
    }

    handleInputChar(toInsert);
  };

  // EXE button: commit current input or calculate COMP expression
  const handleExe = () => {
    playKeyClick('func');
    if (mode === 'COMP') {
      try {
        const evalContext: EvalContext = {
          angleUnit,
          ans,
          memory,
        };
        const res = evaluateMathExpression(compExpr, evalContext);
        setAns(res);
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
      handleDown();
    } else {
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

  // SOLVE button: the key of FC-200V
  const handleSolve = () => {
    playKeyClick('solve');
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
      <div className="relative w-full max-w-[410px] sm:max-w-[435px] rounded-3xl bg-[#16171a] p-3.5 sm:p-5 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.08),inset_0_1px_2px_rgba(255,255,255,0.12)] border border-[#23252a] select-none">
        
        {/* Brand & Model Name Header */}
        <div className="flex items-center justify-between pb-2.5 pt-1 border-b border-zinc-800/80 mb-3 px-1">
          <div className="flex items-baseline gap-2">
            <span className="font-sans font-black tracking-widest text-lg sm:text-xl text-white">
              CASIO
            </span>
            <span className="text-[10px] sm:text-xs text-zinc-400 font-medium tracking-wide">
              FC-200V
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-[9px] uppercase tracking-wider text-amber-500/90 font-bold">
                Financial Consultant
              </span>
              <span className="text-[8px] text-zinc-400 tracking-tight">
                TWO WAY POWER
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSoundOn(toggleSound())}
              className="p-1 rounded-md bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
              title={soundOn ? 'השתק צליל מקשים' : 'הפעל צליל מקשים'}
            >
              {soundOn ? <Volume2 className="w-3.5 h-3.5 text-blue-400" /> : <VolumeX className="w-3.5 h-3.5 text-zinc-500" />}
            </button>
          </div>
        </div>

        {/* Dual-Line LCD Screen */}
        <div className="mb-3.5">
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

        {/* 1. FINANCIAL MODES (10 KEYS: 2 ROWS × 5) */}
        <div className="mb-2.5">
          <div className="grid grid-cols-5 gap-1 sm:gap-1.5 mb-1.5">
            {[
              { id: 'SMPL', label: 'SMPL', shift: 'SET', desc: 'ריבית פשוטה' },
              { id: 'CMPD', label: 'CMPD', shift: 'B/E', desc: 'ריבית דריבית / TVM' },
              { id: 'CASH', label: 'CASH', shift: 'CF', desc: 'תזרים מזומנים' },
              { id: 'AMORT', label: 'AMORT', shift: 'PRN', desc: 'לוח סילוקין' },
              { id: 'CNVR', label: 'CNVR', shift: 'EFF', desc: 'המרת ריבית' },
            ].map((m) => (
              <div key={m.id} className="flex flex-col items-center">
                <span className="text-[8px] text-amber-400 font-bold tracking-tighter scale-90 mb-0.5">
                  {m.shift}
                </span>
                <button
                  type="button"
                  onClick={() => handleSelectMode(m.id as CalculatorMode)}
                  className={`w-full py-1.5 rounded text-[11px] font-bold transition-all shadow-sm ${
                    mode === m.id
                      ? 'bg-blue-600 text-white shadow-blue-500/30 shadow-md ring-1 ring-blue-400'
                      : 'bg-[#25282f] text-zinc-200 hover:bg-[#2e323b] active:translate-y-0.5'
                  }`}
                  title={m.desc}
                >
                  {m.label}
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-5 gap-1 sm:gap-1.5">
            {[
              { id: 'COST', label: 'COST', shift: 'MAR', desc: 'עלות, מכירה, רווח' },
              { id: 'DAYS', label: 'DAYS', shift: '360', desc: 'חישוב ימים ותאריכים' },
              { id: 'DEPR', label: 'DEPR', shift: 'SL', desc: 'חישובי פחת' },
              { id: 'BOND', label: 'BOND', shift: 'CPN', desc: 'אגרות חוב' },
              { id: 'BEVN', label: 'BEVN', shift: 'BEP', desc: 'נקודת איזון' },
            ].map((m) => (
              <div key={m.id} className="flex flex-col items-center">
                <span className="text-[8px] text-amber-400 font-bold tracking-tighter scale-90 mb-0.5">
                  {m.shift}
                </span>
                <button
                  type="button"
                  onClick={() => handleSelectMode(m.id as CalculatorMode)}
                  className={`w-full py-1.5 rounded text-[11px] font-bold transition-all shadow-sm ${
                    mode === m.id
                      ? 'bg-blue-600 text-white shadow-blue-500/30 shadow-md ring-1 ring-blue-400'
                      : 'bg-[#25282f] text-zinc-200 hover:bg-[#2e323b] active:translate-y-0.5'
                  }`}
                  title={m.desc}
                >
                  {m.label}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 2. NAVIGATION & CONTROL BLOCK (WITH BLUE-GRAY DPAD) */}
        <div className="grid grid-cols-3 items-center gap-1.5 mb-2.5 px-0.5">
          {/* Left: SHIFT, ALPHA, MODE */}
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => {
                playKeyClick('func');
                setIsShift(!isShift);
              }}
              className={`py-1.5 rounded text-xs font-black shadow transition-all ${
                isShift
                  ? 'bg-amber-500 text-black ring-1 ring-amber-300'
                  : 'bg-[#25282f] text-amber-400 hover:bg-[#2c3038]'
              }`}
            >
              SHIFT
            </button>
            <button
              type="button"
              onClick={() => {
                playKeyClick('func');
                setIsAlpha(!isAlpha);
              }}
              className={`py-1.5 rounded text-xs font-black shadow transition-all ${
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
              className={`py-1 rounded text-[10px] font-bold shadow ${
                mode === 'COMP' ? 'bg-zinc-200 text-zinc-900' : 'bg-[#202227] text-zinc-400 hover:text-white'
              }`}
              title="מצב מחשבון מדעי כללי"
            >
              COMP / CALC
            </button>
          </div>

          {/* Center: Authentic Blue-Gray REPLAY D-Pad */}
          <div className="flex justify-center">
            <DpadNavigation
              onUp={handleUp}
              onDown={handleDown}
              onLeft={handleUp}
              onRight={handleDown}
            />
          </div>

          {/* Right: ESC, SETUP, SOLVE */}
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => {
                playKeyClick('func');
                setIsEditing(false);
                setEditValue('');
                setStatusMessage('');
              }}
              className="py-1.5 rounded text-xs font-bold bg-[#25282f] text-zinc-300 hover:bg-[#2c3038] shadow active:translate-y-0.5"
            >
              ESC
            </button>

            {/* High-visibility SOLVE button */}
            <button
              type="button"
              onClick={handleSolve}
              className="py-2.5 rounded-lg text-xs sm:text-sm font-black bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-700 hover:from-blue-600 hover:to-indigo-500 text-white shadow-[0_4px_12px_rgba(37,99,235,0.4),inset_0_1px_1px_rgba(255,255,255,0.4)] active:translate-y-0.5 transition-all ring-1 ring-blue-400/50 flex flex-col items-center justify-center"
              title="בצע חישוב עבור הפרמטר הנוכחי"
            >
              <span>SOLVE</span>
              <span className="text-[7.5px] font-normal opacity-80">חשב תוצאה</span>
            </button>
          </div>
        </div>

        {/* 3. SCIENTIFIC KEYS (3 ROWS × 6 = 18 KEYS) */}
        <div className="space-y-1 mb-2">
          {/* Scientific Row 1: x⁻¹, √, x², ^, log, ln */}
          <div className="grid grid-cols-6 gap-1">
            {[
              { label: 'x⁻¹', shift: 'x!', val: '^-1', sVal: '!' },
              { label: '√', shift: '³√', val: 'sqrt(', sVal: 'cbrt(' },
              { label: 'x²', shift: 'x³', val: '^2', sVal: '^3' },
              { label: '^', shift: 'ˣ√', val: '^', sVal: '^(1/' },
              { label: 'log', shift: '10ˣ', val: 'log(', sVal: '10^' },
              { label: 'ln', shift: 'eˣ', val: 'ln(', sVal: 'e^' },
            ].map((k, i) => (
              <div key={i} className="flex flex-col items-center">
                <span className="text-[8px] text-amber-400 font-bold scale-90 h-3 leading-3">
                  {k.shift}
                </span>
                <button
                  type="button"
                  onClick={() => handleScientific(k.val, k.sVal)}
                  className="w-full py-1 rounded bg-[#202227] hover:bg-[#2a2c33] text-zinc-200 text-xs font-semibold shadow-sm active:translate-y-0.5 font-mono"
                >
                  {k.label}
                </button>
              </div>
            ))}
          </div>

          {/* Scientific Row 2: (-), °'", hyp, sin, cos, tan with Alpha labels A, B, C, D, X, Y */}
          <div className="grid grid-cols-6 gap-1">
            {[
              { label: '(-)', shift: 'a b/c', alpha: 'A', val: '(-)', sVal: '/', aVal: 'A' },
              { label: '° \' "', shift: '←', alpha: 'B', val: '°', sVal: '', aVal: 'B' },
              { label: 'hyp', shift: 'sin⁻¹', alpha: 'C', val: 'sinh(', sVal: 'asin(', aVal: 'C' },
              { label: 'sin', shift: 'cos⁻¹', alpha: 'D', val: 'sin(', sVal: 'acos(', aVal: 'D' },
              { label: 'cos', shift: 'tan⁻¹', alpha: 'X', val: 'cos(', sVal: 'atan(', aVal: 'X' },
              { label: 'tan', shift: 'd/c', alpha: 'Y', val: 'tan(', sVal: '/', aVal: 'Y' },
            ].map((k, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="flex items-center justify-between w-full px-0.5 h-3">
                  <span className="text-[7.5px] text-amber-400 font-bold scale-90">{k.shift}</span>
                  <span className="text-[7.5px] text-red-400 font-bold scale-90">{k.alpha}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleScientific(k.val, k.sVal, k.aVal)}
                  className="w-full py-1 rounded bg-[#202227] hover:bg-[#2a2c33] text-zinc-200 text-xs font-semibold shadow-sm active:translate-y-0.5 font-mono"
                >
                  {k.label}
                </button>
              </div>
            ))}
          </div>

          {/* Scientific Row 3: RCL/STO, ENG, (, ), ,, M+/M- with Alpha M */}
          <div className="grid grid-cols-6 gap-1">
            {[
              { label: 'RCL', shift: 'STO', alpha: '', val: 'RCL', sVal: 'STO', aVal: '' },
              { label: 'ENG', shift: 'D/R', alpha: '', val: 'ENG', sVal: 'DEG/RAD', aVal: '' },
              { label: '(', shift: '%', alpha: '', val: '(', sVal: '%', aVal: '' },
              { label: ')', shift: ',', alpha: '', val: ')', sVal: ',', aVal: '' },
              { label: ',', shift: ';', alpha: '', val: ',', sVal: ';', aVal: '' },
              { label: 'M+', shift: 'M-', alpha: 'M', val: 'M', sVal: '-M', aVal: 'M' },
            ].map((k, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="flex items-center justify-between w-full px-0.5 h-3">
                  <span className="text-[7.5px] text-amber-400 font-bold scale-90">{k.shift}</span>
                  {k.alpha && <span className="text-[7.5px] text-red-400 font-bold scale-90">{k.alpha}</span>}
                </div>
                <button
                  type="button"
                  onClick={() => handleScientific(k.val, k.sVal, k.aVal)}
                  className="w-full py-1 rounded bg-[#202227] hover:bg-[#2a2c33] text-zinc-200 text-xs font-semibold shadow-sm active:translate-y-0.5 font-mono"
                >
                  {k.label}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 4. MAIN NUMERIC KEYPAD (4 ROWS × 5 KEYS = 20 KEYS) */}
        <div className="space-y-1">
          {/* Numeric Row 1: 7, 8, 9, DEL (INS), AC (OFF) */}
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
            {['7', '8', '9'].map((num) => (
              <div key={num} className="flex flex-col items-center">
                <span className="h-2.5" />
                <button
                  type="button"
                  onClick={() => handleInputChar(num)}
                  className="w-full py-2.5 sm:py-3 rounded-lg bg-[#383d47] hover:bg-[#424854] text-white font-bold text-base sm:text-lg shadow-[0_3px_0_#1e2127] active:translate-y-0.5"
                >
                  {num}
                </button>
              </div>
            ))}
            <div className="flex flex-col items-center">
              <span className="text-[8px] text-amber-400 font-bold h-2.5">INS</span>
              <button
                type="button"
                onClick={handleDelete}
                className="w-full py-2.5 sm:py-3 rounded-lg bg-[#842020] hover:bg-[#992626] text-white font-bold text-sm shadow-[0_3px_0_#4d1313] active:translate-y-0.5"
              >
                DEL
              </button>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[8px] text-amber-400 font-bold h-2.5">OFF</span>
              <button
                type="button"
                onClick={handleClear}
                className="w-full py-2.5 sm:py-3 rounded-lg bg-[#a62b2b] hover:bg-[#bf3232] text-white font-bold text-sm shadow-[0_3px_0_#5e1818] active:translate-y-0.5"
              >
                AC
              </button>
            </div>
          </div>

          {/* Numeric Row 2: 4, 5, 6, × (nPr), ÷ (nCr) */}
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
            {['4', '5', '6'].map((num) => (
              <div key={num} className="flex flex-col items-center">
                <span className="h-2.5" />
                <button
                  type="button"
                  onClick={() => handleInputChar(num)}
                  className="w-full py-2.5 sm:py-3 rounded-lg bg-[#383d47] hover:bg-[#424854] text-white font-bold text-base sm:text-lg shadow-[0_3px_0_#1e2127] active:translate-y-0.5"
                >
                  {num}
                </button>
              </div>
            ))}
            <div className="flex flex-col items-center">
              <span className="text-[8px] text-amber-400 font-bold h-2.5">nPr</span>
              <button
                type="button"
                onClick={() => handleScientific('×', 'nPr')}
                className="w-full py-2.5 sm:py-3 rounded-lg bg-[#2a2d34] hover:bg-[#343842] text-zinc-100 font-bold text-base shadow-[0_3px_0_#17191d] active:translate-y-0.5"
              >
                ×
              </button>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[8px] text-amber-400 font-bold h-2.5">nCr</span>
              <button
                type="button"
                onClick={() => handleScientific('÷', 'nCr')}
                className="w-full py-2.5 sm:py-3 rounded-lg bg-[#2a2d34] hover:bg-[#343842] text-zinc-100 font-bold text-base shadow-[0_3px_0_#17191d] active:translate-y-0.5"
              >
                ÷
              </button>
            </div>
          </div>

          {/* Numeric Row 3: 1, 2, 3, + (Pol), - (Rec) */}
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
            {['1', '2', '3'].map((num) => (
              <div key={num} className="flex flex-col items-center">
                <span className="h-2.5" />
                <button
                  type="button"
                  onClick={() => handleInputChar(num)}
                  className="w-full py-2.5 sm:py-3 rounded-lg bg-[#383d47] hover:bg-[#424854] text-white font-bold text-base sm:text-lg shadow-[0_3px_0_#1e2127] active:translate-y-0.5"
                >
                  {num}
                </button>
              </div>
            ))}
            <div className="flex flex-col items-center">
              <span className="text-[8px] text-amber-400 font-bold h-2.5">Pol</span>
              <button
                type="button"
                onClick={() => handleInputChar('+')}
                className="w-full py-2.5 sm:py-3 rounded-lg bg-[#2a2d34] hover:bg-[#343842] text-zinc-100 font-bold text-base shadow-[0_3px_0_#17191d] active:translate-y-0.5"
              >
                +
              </button>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[8px] text-amber-400 font-bold h-2.5">Rec</span>
              <button
                type="button"
                onClick={() => handleInputChar('-')}
                className="w-full py-2.5 sm:py-3 rounded-lg bg-[#2a2d34] hover:bg-[#343842] text-zinc-100 font-bold text-base shadow-[0_3px_0_#17191d] active:translate-y-0.5"
              >
                -
              </button>
            </div>
          </div>

          {/* Numeric Row 4: 0, ., EXP (π/e), Ans (Ran#), EXE */}
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
            <div className="flex flex-col items-center">
              <span className="h-2.5" />
              <button
                type="button"
                onClick={() => handleInputChar('0')}
                className="w-full py-2.5 sm:py-3 rounded-lg bg-[#383d47] hover:bg-[#424854] text-white font-bold text-base sm:text-lg shadow-[0_3px_0_#1e2127] active:translate-y-0.5"
              >
                0
              </button>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[8px] text-amber-400 font-bold h-2.5">Ran#</span>
              <button
                type="button"
                onClick={() => handleScientific('.', `${Math.random().toFixed(3)}`)}
                className="w-full py-2.5 sm:py-3 rounded-lg bg-[#383d47] hover:bg-[#424854] text-white font-bold text-base sm:text-lg shadow-[0_3px_0_#1e2127] active:translate-y-0.5"
              >
                .
              </button>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-between w-full px-0.5 h-2.5">
                <span className="text-[7.5px] text-amber-400 font-bold">π</span>
                <span className="text-[7.5px] text-red-400 font-bold">e</span>
              </div>
              <button
                type="button"
                onClick={() => handleScientific('EXP', 'π', 'e')}
                className="w-full py-2.5 sm:py-3 rounded-lg bg-[#2a2d34] hover:bg-[#343842] text-zinc-200 font-bold text-xs sm:text-sm shadow-[0_3px_0_#17191d] active:translate-y-0.5 font-mono"
              >
                EXP
              </button>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[8px] text-amber-400 font-bold h-2.5">%</span>
              <button
                type="button"
                onClick={() => handleScientific('Ans', '%')}
                className="w-full py-2.5 sm:py-3 rounded-lg bg-[#2a2d34] hover:bg-[#343842] text-zinc-200 font-bold text-xs sm:text-sm shadow-[0_3px_0_#17191d] active:translate-y-0.5 font-mono"
              >
                Ans
              </button>
            </div>
            <div className="flex flex-col items-center">
              <span className="h-2.5" />
              <button
                type="button"
                onClick={handleExe}
                className="w-full py-2.5 sm:py-3 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-black text-sm sm:text-base shadow-[0_3px_0_#1e40af] active:translate-y-0.5"
                title="אשר ערך / בצע פעולה (EXE)"
              >
                EXE
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
