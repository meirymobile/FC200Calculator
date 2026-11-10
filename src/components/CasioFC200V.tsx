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
  solveBEVNProfit,
  solveBEVNQuantity,
  solveBEVNPrice,
  solveBEVNVariableCost,
  solveBEVNFixedCost,
  BEVNParams,
} from '../engine/bevn';
import {
  calculateDepreciation,
  DepreciationParams,
  DepreciationMethod,
} from '../engine/depreciation';
import { calculateDaysBetween, addDaysToDate, DayBasis } from '../engine/days';
import { solveBondPrice, solveBondYield, BondParams } from '../engine/bond';
import {
  solveSMPLInterest,
  solveSMPLFutureValue,
  solveSMPLPrincipal,
  solveSMPLRate,
  solveSMPLDays,
  SMPLParams,
} from '../engine/smpl';
import { calculate1VarStats, calculate2VarStats } from '../engine/stat';
import {
  generateTVMSolution,
  generateAmortSolution,
  generateCashFlowSolution,
} from '../engine/solutionsGenerator';
import { playKeyClick, toggleSound, isSoundEnabled } from '../utils/soundEffects';
import { Volume2, VolumeX, Settings } from 'lucide-react';

interface CasioFC200VProps {
  onSolutionGenerated: (solution: StepExplanation) => void;
  onAmortizationUpdated: (summary: AmortizationSummary, params: TVMParams) => void;
  onCashFlowUpdated: (params: CashFlowParams, results: CashFlowResults) => void;
  onOpenMobileGuide: () => void;
  onOpenSettings?: () => void;
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
  onOpenSettings,
  presetData,
}) => {
  // Mode state
  const [mode, setMode] = useState<CalculatorMode>('CMPD');
  const [isShift, setIsShift] = useState(false);
  const [isAlpha, setIsAlpha] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [angleUnit, setAngleUnit] = useState<'DEG' | 'RAD'>('DEG');
  const [soundOn, setSoundOn] = useState<boolean>(isSoundEnabled());

  // Short Cut register memory
  const [shortCut1, setShortCut1] = useState<CalculatorMode>('CMPD');
  const [shortCut2, setShortCut2] = useState<CalculatorMode>('AMRT');

  // Memory Registers (A, B, C, D, X, Y, M)
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
  const [isRecallMode, setIsRecallMode] = useState(false);

  // TVM (CMPD) state (P/Y=1, C/Y=1 default)
  const [tvmParams, setTvmParams] = useState<TVMParams>({
    set: 'End',
    n: 10,
    i: 5.5,
    pv: -100000,
    pmt: 0,
    fv: 0,
    py: 1,
    cy: 1,
  });

  // SMPL (Simple Interest) state
  const [smplParams, setSmplParams] = useState<SMPLParams>({
    set: '365',
    dys: 100,
    i: 5.0,
    pv: -100000,
  });

  // Amortization parameters
  const [amortPm1, setAmortPm1] = useState(1);
  const [amortPm2, setAmortPm2] = useState(1);

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

  // BEVN (Break-Even) parameters
  const [bevnParams, setBevnParams] = useState<BEVNParams>({
    prc: 100,
    vc: 60,
    fc: 20000,
    q: 500,
    prf: 0,
  });

  // DEPR (Depreciation) parameters
  const [deprParams, setDeprParams] = useState<DepreciationParams>({
    method: 'SL',
    n: 5,
    cst: 10000,
    sal: 1000,
    j: 1,
  });

  // DAYS (Date/Day) parameters
  const [daysParams, setDaysParams] = useState<{ d1: string; d2: string; basis: DayBasis }>({
    d1: '2026.0101',
    d2: '2027.0101',
    basis: '365',
  });

  // BOND parameters
  const [bondParams, setBondParams] = useState<BondParams>({
    couponsPerYear: 1,
    d1: '2026.0101',
    d2: '2031.0101',
    rdv: 100,
    cpn: 5.0,
    yld: 5.0,
    prc: 100,
  });

  // STAT parameters
  const [statData, setStatData] = useState<number[]>([10, 20, 30, 40, 50]);

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
      const updatedTvm = { ...tvmParams, pmt: initialPmt };
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
      case 'SMPL': {
        const si = solveSMPLInterest(smplParams);
        const sfv = solveSMPLFutureValue(smplParams);
        return [
          { key: 'smpl_set', label: 'Set', value: smplParams.set, canSolve: false },
          { key: 'smpl_dys', label: 'Dys', value: smplParams.dys, canSolve: true },
          { key: 'smpl_i', label: 'I%', value: `${smplParams.i}`, canSolve: true },
          { key: 'smpl_pv', label: 'PV', value: `${smplParams.pv}`, canSolve: true },
          { key: 'smpl_si', label: 'SI', value: si, canSolve: true },
          { key: 'smpl_sfv', label: 'SFV', value: sfv, canSolve: true },
        ];
      }
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
      case 'AMRT':
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
      case 'STAT': {
        const stats = calculate1VarStats(statData);
        return [
          { key: 'stat_n', label: 'n', value: stats.n, canSolve: false },
          { key: 'stat_xbar', label: 'x̄', value: stats.mean, canSolve: true },
          { key: 'stat_sumx', label: 'Σx', value: stats.sumX, canSolve: true },
          { key: 'stat_sumx2', label: 'Σx²', value: stats.sumX2, canSolve: true },
          { key: 'stat_sx', label: 'sx', value: stats.sx, canSolve: true },
          { key: 'stat_sigmax', label: 'σx', value: stats.sigmaX, canSolve: true },
          { key: 'stat_min', label: 'minX', value: stats.minX, canSolve: false },
          { key: 'stat_max', label: 'maxX', value: stats.maxX, canSolve: false },
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
      case 'DAYS': {
        const dys = calculateDaysBetween(daysParams.d1, daysParams.d2, daysParams.basis);
        return [
          { key: 'dys_d1', label: 'd1', value: daysParams.d1, canSolve: false },
          { key: 'dys_d2', label: 'd2', value: daysParams.d2, canSolve: false },
          { key: 'dys_dys', label: 'Dys', value: dys, canSolve: true },
          { key: 'dys_basis', label: 'Set', value: daysParams.basis, canSolve: false },
        ];
      }
      case 'DEPR': {
        const deprRes = calculateDepreciation(deprParams);
        return [
          { key: 'depr_mth', label: 'MTH', value: deprParams.method, canSolve: false },
          { key: 'depr_n', label: 'n', value: deprParams.n, canSolve: false },
          { key: 'depr_cst', label: 'CST', value: deprParams.cst, canSolve: false },
          { key: 'depr_sal', label: 'SAL', value: deprParams.sal, canSolve: false },
          { key: 'depr_j', label: 'j', value: deprParams.j, canSolve: false },
          { key: 'depr_dpj', label: 'DPJ', value: deprRes.dpj, canSolve: true },
          { key: 'depr_rdv', label: 'RDV', value: deprRes.rdv, canSolve: true },
          { key: 'depr_acc', label: 'ACC', value: deprRes.acc, canSolve: true },
        ];
      }
      case 'BOND':
        return [
          { key: 'bond_cpn', label: 'CPN', value: `${bondParams.cpn}%`, canSolve: false },
          { key: 'bond_yld', label: 'YLD', value: `${bondParams.yld}%`, canSolve: true },
          { key: 'bond_prc', label: 'PRC', value: bondParams.prc, canSolve: true },
          { key: 'bond_rdv', label: 'RDV', value: bondParams.rdv, canSolve: false },
        ];
      case 'BEVN':
        return [
          { key: 'bevn_prc', label: 'PRC', value: bevnParams.prc, canSolve: true },
          { key: 'bevn_vc', label: 'VC', value: bevnParams.vc, canSolve: true },
          { key: 'bevn_fc', label: 'FC', value: bevnParams.fc, canSolve: true },
          { key: 'bevn_q', label: 'Q', value: bevnParams.q, canSolve: true },
          { key: 'bevn_prf', label: 'PRF', value: bevnParams.prf, canSolve: true },
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

    // Handle variable recall if RCL was pressed
    if (isRecallMode && ['A', 'B', 'C', 'D', 'X', 'Y', 'M'].includes(char)) {
      const recalled = memory[char] ?? 0;
      setIsRecallMode(false);
      setStatusMessage(`RCL ${char}: ${recalled}`);
      if (mode === 'COMP') {
        setCompExpr((prev) => prev + recalled.toString());
      } else {
        updateCurrentParamValue(currentItem.key, recalled);
      }
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
  };

  // Scientific functions via Shift
  const handleScientific = (val: string, shiftVal?: string, alphaVal?: string) => {
    playKeyClick('func');
    let toInsert = val;

    if (isShift && shiftVal) {
      toInsert = shiftVal;
      setIsShift(false);
    } else if (isAlpha && alphaVal) {
      toInsert = alphaVal;
      setIsAlpha(false);
    }

    if (toInsert === 'DEG/RAD') {
      const newUnit = angleUnit === 'DEG' ? 'RAD' : 'DEG';
      setAngleUnit(newUnit);
      setStatusMessage(`ANGLE: ${newUnit}`);
      return;
    }

    if (toInsert === 'CLR') {
      setMemory({ A: 0, B: 0, C: 0, D: 0, X: 0, Y: 0, M: 0 });
      setAns(0);
      setCompExpr('');
      setCompResult('0');
      setStatusMessage('MEM CLEARED');
      return;
    }

    if (toInsert === 'STO') {
      setIsStoreMode(true);
      setStatusMessage('STO: PRESS A-D, X, Y, M');
      return;
    }

    if (toInsert === 'RCL') {
      setIsRecallMode(true);
      setStatusMessage('RCL: PRESS A-D, X, Y, M');
      return;
    }

    if (toInsert === 'M+') {
      const currentVal = mode === 'COMP' ? parseFloat(compResult) || 0 : parseFloat(String(currentItem.value)) || 0;
      setMemory((prev) => ({ ...prev, M: prev.M + currentVal }));
      setStatusMessage(`M+ (${memory.M + currentVal})`);
      return;
    }

    if (toInsert === 'M-') {
      const currentVal = mode === 'COMP' ? parseFloat(compResult) || 0 : parseFloat(String(currentItem.value)) || 0;
      setMemory((prev) => ({ ...prev, M: prev.M - currentVal }));
      setStatusMessage(`M- (${memory.M - currentVal})`);
      return;
    }

    if (mode === 'COMP') {
      setCompExpr((prev) => prev + toInsert);
    } else {
      // In menu mode, if it's a number/operator
      if (!isEditing) {
        setIsEditing(true);
        setEditValue(toInsert);
      } else {
        setEditValue((prev) => prev + toInsert);
      }
    }
  };

  // EXE button (Commit parameter or evaluate formula)
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
        setCompResult(res.toString());
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

    if (currentItem.key === 'smpl_set') {
      setSmplParams((p) => ({ ...p, set: p.set === '365' ? '360' : '365' }));
      return;
    }

    if (currentItem.key === 'depr_mth') {
      const methods: DepreciationMethod[] = ['SL', 'SYD', 'DB'];
      const nextIdx = (methods.indexOf(deprParams.method) + 1) % methods.length;
      setDeprParams((p) => ({ ...p, method: methods[nextIdx] }));
      return;
    }

    if (currentItem.key === 'dys_basis') {
      setDaysParams((p) => ({ ...p, basis: p.basis === '365' ? '360' : '365' }));
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
      let updated: TVMParams;
      if (key === 'py') {
        // In Casio FC-200V, updating P/Y automatically updates C/Y to match
        updated = { ...tvmParams, py: val, cy: val };
      } else {
        updated = { ...tvmParams, [key]: val };
      }
      setTvmParams(updated);
      const amort = calculateAmortizationSummary(updated, amortPm1, amortPm2);
      onAmortizationUpdated(amort, updated);
    } else if (mode === 'SMPL') {
      const fld = key.replace('smpl_', '') as keyof SMPLParams;
      setSmplParams((p) => ({ ...p, [fld]: val }));
    } else if (mode === 'AMRT' || mode === 'AMORT') {
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
    } else if (mode === 'BEVN') {
      const fld = key.replace('bevn_', '') as keyof BEVNParams;
      setBevnParams((p) => ({ ...p, [fld]: val }));
    } else if (mode === 'DEPR') {
      if (key === 'depr_n') setDeprParams((p) => ({ ...p, n: val }));
      else if (key === 'depr_cst') setDeprParams((p) => ({ ...p, cst: val }));
      else if (key === 'depr_sal') setDeprParams((p) => ({ ...p, sal: val }));
      else if (key === 'depr_j') setDeprParams((p) => ({ ...p, j: val }));
    } else if (mode === 'DAYS') {
      if (key === 'dys_d1') setDaysParams((p) => ({ ...p, d1: String(val) }));
      else if (key === 'dys_d2') setDaysParams((p) => ({ ...p, d2: String(val) }));
    } else if (mode === 'BOND') {
      if (key === 'bond_cpn') setBondParams((p) => ({ ...p, cpn: val }));
      else if (key === 'bond_yld') setBondParams((p) => ({ ...p, yld: val }));
      else if (key === 'bond_prc') setBondParams((p) => ({ ...p, prc: val }));
      else if (key === 'bond_rdv') setBondParams((p) => ({ ...p, rdv: val }));
    } else if (mode === 'STAT') {
      if (key === 'stat_add') {
        setStatData((p) => [...p, val]);
      }
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
      if (mode === 'SMPL') {
        const key = currentItem.key;
        if (key === 'smpl_si') {
          const si = solveSMPLInterest(smplParams);
          setSmplParams((p) => ({ ...p, si }));
          setStatusMessage('SOLVED SI');
        } else if (key === 'smpl_sfv') {
          const sfv = solveSMPLFutureValue(smplParams);
          setSmplParams((p) => ({ ...p, sfv }));
          setStatusMessage('SOLVED SFV');
        } else if (key === 'smpl_pv') {
          const pv = solveSMPLPrincipal(smplParams.dys, smplParams.i, smplParams.si || 5000, smplParams.set);
          setSmplParams((p) => ({ ...p, pv }));
          setStatusMessage('SOLVED PV');
        } else if (key === 'smpl_i') {
          const i = solveSMPLRate(smplParams.dys, smplParams.pv, smplParams.si || 5000, smplParams.set);
          setSmplParams((p) => ({ ...p, i }));
          setStatusMessage('SOLVED I%');
        } else if (key === 'smpl_dys') {
          const dys = solveSMPLDays(smplParams.pv, smplParams.i, smplParams.si || 5000, smplParams.set);
          setSmplParams((p) => ({ ...p, dys }));
          setStatusMessage('SOLVED Dys');
        }
      } else if (mode === 'CMPD') {
        const key = currentItem.key;
        let updatedParams = { ...tvmParams };

        if (key === 'pmt') {
          const res = solvePMT(tvmParams);
          updatedParams.pmt = res;
          setTvmParams(updatedParams);
          const sol = generateTVMSolution('pmt', updatedParams);
          onSolutionGenerated(sol);
          setStatusMessage('SOLVED PMT');
        } else if (key === 'pv') {
          const res = solvePV(tvmParams);
          updatedParams.pv = res;
          setTvmParams(updatedParams);
          const sol = generateTVMSolution('pv', updatedParams);
          onSolutionGenerated(sol);
          setStatusMessage('SOLVED PV');
        } else if (key === 'fv') {
          const res = solveFV(tvmParams);
          updatedParams.fv = res;
          setTvmParams(updatedParams);
          const sol = generateTVMSolution('fv', updatedParams);
          onSolutionGenerated(sol);
          setStatusMessage('SOLVED FV');
        } else if (key === 'n') {
          const res = solveN(tvmParams);
          updatedParams.n = res;
          setTvmParams(updatedParams);
          const sol = generateTVMSolution('n', updatedParams);
          onSolutionGenerated(sol);
          setStatusMessage('SOLVED n');
        } else if (key === 'i') {
          const res = solveI(tvmParams);
          updatedParams.i = res;
          setTvmParams(updatedParams);
          const sol = generateTVMSolution('i', updatedParams);
          onSolutionGenerated(sol);
          setStatusMessage('SOLVED I%');
        }

        const amort = calculateAmortizationSummary(updatedParams, amortPm1, amortPm2);
        onAmortizationUpdated(amort, updatedParams);
      } else if (mode === 'AMRT' || mode === 'AMORT') {
        const amort = calculateAmortizationSummary(tvmParams, amortPm1, amortPm2);
        onAmortizationUpdated(amort, tvmParams);
        const sol = generateAmortSolution(amort, tvmParams);
        onSolutionGenerated(sol);
        setStatusMessage(`AMRT ${currentItem.key.toUpperCase()}`);
      } else if (mode === 'CASH') {
        const res = solveCashFlow(cfParams);
        onCashFlowUpdated(cfParams, res);
        const sol = generateCashFlowSolution(cfParams, res);
        onSolutionGenerated(sol);
        setStatusMessage(`CASH ${currentItem.key.toUpperCase()}`);
      } else if (mode === 'STAT') {
        const stats = calculate1VarStats(statData);
        setStatusMessage(`STAT x̄: ${stats.mean.toFixed(2)}`);
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
      } else if (mode === 'BEVN') {
        if (currentItem.key === 'bevn_prf') {
          const prf = solveBEVNProfit(bevnParams);
          setBevnParams((p) => ({ ...p, prf }));
          setStatusMessage('SOLVED PRF');
        } else if (currentItem.key === 'bevn_q') {
          const q = solveBEVNQuantity(bevnParams);
          setBevnParams((p) => ({ ...p, q }));
          setStatusMessage('SOLVED Q');
        } else if (currentItem.key === 'bevn_prc') {
          const prc = solveBEVNPrice(bevnParams);
          setBevnParams((p) => ({ ...p, prc }));
          setStatusMessage('SOLVED PRC');
        } else if (currentItem.key === 'bevn_vc') {
          const vc = solveBEVNVariableCost(bevnParams);
          setBevnParams((p) => ({ ...p, vc }));
          setStatusMessage('SOLVED VC');
        } else if (currentItem.key === 'bevn_fc') {
          const fc = solveBEVNFixedCost(bevnParams);
          setBevnParams((p) => ({ ...p, fc }));
          setStatusMessage('SOLVED FC');
        }
      } else if (mode === 'DEPR') {
        const res = calculateDepreciation(deprParams);
        setStatusMessage(`DEPR ${deprParams.method} YR ${deprParams.j}`);
      } else if (mode === 'DAYS') {
        const d = calculateDaysBetween(daysParams.d1, daysParams.d2, daysParams.basis);
        setStatusMessage(`DAYS: ${d}`);
      } else if (mode === 'BOND') {
        if (currentItem.key === 'bond_prc') {
          const prc = solveBondPrice(bondParams);
          setBondParams((p) => ({ ...p, prc }));
          setStatusMessage('SOLVED PRC');
        } else if (currentItem.key === 'bond_yld') {
          const yld = solveBondYield(bondParams);
          setBondParams((p) => ({ ...p, yld }));
          setStatusMessage('SOLVED YLD');
        }
      }
    } catch (err: any) {
      setStatusMessage('ERROR: ' + (err.message || 'Math ERROR'));
    }
  };

  // Keyboard event listener for physical keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input element
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        handleInputChar(e.key);
      } else if (e.key === '.') {
        handleInputChar('.');
      } else if (e.key === '+') {
        handleInputChar('+');
      } else if (e.key === '-') {
        handleInputChar('-');
      } else if (e.key === '*') {
        handleInputChar('×');
      } else if (e.key === '/') {
        handleInputChar('÷');
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleExe();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleDelete();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClear();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleUp();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleDown();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleUp();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleDown();
      } else if (e.key.toLowerCase() === 's' && !isEditing) {
        e.preventDefault();
        handleSolve();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, currentItem, editValue, isEditing, tvmParams, cfParams, cnvrParams, costParams, compExpr, memory, ans, angleUnit]);

  return (
    <div dir="ltr" style={{ direction: 'ltr' }} className="flex flex-col items-center">
      {/* Outer Calculator Matte Black Chassis with subtle side curvature matching 2nd edition */}
      <div dir="ltr" style={{ direction: 'ltr' }} className="relative w-full max-w-[400px] sm:max-w-[425px] rounded-[32px] bg-[#17181c] p-3.5 sm:p-5 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.06),inset_0_1px_2px_rgba(255,255,255,0.12)] border border-[#26282e] select-none">
        
        {/* Authentic Top Header matching photo: CASIO FC-200V FINANCIAL CONSULTANT | SOLAR PANEL | 2nd edition */}
        <div className="flex items-center justify-between pb-2 pt-0.5 border-b border-zinc-800/80 mb-3 px-1">
          {/* Left: CASIO & FC-200V / FINANCIAL CONSULTANT */}
          <div className="flex flex-col">
            <span className="font-sans font-black tracking-widest text-lg sm:text-xl text-white leading-none">
              CASIO
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-[11px] font-bold text-zinc-300 tracking-wider">
                FC-200V
              </span>
            </div>
            <span className="text-[7.5px] uppercase tracking-wider text-zinc-400 font-semibold leading-tight">
              FINANCIAL CONSULTANT
            </span>
          </div>

          {/* Center: Glossy Solar Cell with photovoltaic lines */}
          <div className="w-16 h-7 rounded bg-[#0d0f13] border border-zinc-700/60 p-0.5 shadow-inner flex flex-col justify-between overflow-hidden">
            <div className="h-full w-full bg-gradient-to-r from-[#1a1212] via-[#2a1b1b] to-[#1a1212] flex justify-evenly items-center">
              <div className="w-px h-full bg-zinc-700/50" />
              <div className="w-px h-full bg-zinc-700/50" />
              <div className="w-px h-full bg-zinc-700/50" />
            </div>
          </div>

          {/* Right: 2nd edition & New Settings Button (exact green box location) */}
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-[11px] text-zinc-300 font-medium tracking-tight">
                2nd edition
              </span>
              <button
                type="button"
                onClick={() => {
                  const next = toggleSound();
                  setSoundOn(next);
                  if (next) playKeyClick('func');
                }}
                className="p-1 rounded-md bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                title={soundOn ? 'השתק צליל מקשים' : 'הפעל צליל מקשים'}
              >
                {soundOn ? <Volume2 className="w-3.5 h-3.5 text-blue-400" /> : <VolumeX className="w-3.5 h-3.5 text-zinc-500" />}
              </button>
            </div>

            {/* New Settings Button (Green Box) */}
            <button
              type="button"
              onClick={() => {
                playKeyClick('func');
                onOpenSettings?.();
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#252830] hover:bg-[#323642] text-zinc-200 hover:text-white text-[10px] sm:text-[10.5px] font-bold border border-zinc-700/80 shadow-sm active:scale-95 transition-all"
              title="הגדרות ותפריט סטודיו"
            >
              <Settings className="w-3 h-3 text-blue-400" />
              <span>Settings</span>
            </button>
          </div>
        </div>

        {/* Dual-Line LCD Screen */}
        <div className="mb-3">
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

        {/* ============================================================== */}
        {/* 1. TOP CONTROL BLOCK (SHIFT, ALPHA, REPLAY D-PAD, SETUP, ON) */}
        {/* ============================================================== */}
        <div className="grid grid-cols-3 items-center gap-1.5 mb-1 px-1">
          {/* Left: SHIFT & ALPHA oval pill buttons in recessed oval housing */}
          <div className="flex items-center gap-1.5 justify-center bg-[#131418] p-1.5 rounded-2xl border border-zinc-800/90 shadow-inner">
            {/* SHIFT */}
            <div className="flex flex-col items-center">
              <span className="text-[8px] font-bold text-[#d4b045] uppercase tracking-tighter mb-0.5">
                SHIFT
              </span>
              <button
                type="button"
                onClick={() => {
                  playKeyClick('func');
                  setIsShift(!isShift);
                  setIsAlpha(false);
                }}
                className={`w-7 h-5 sm:w-8 sm:h-5.5 rounded-full shadow transition-all active:scale-95 ${
                  isShift
                    ? 'bg-[#d4b045] text-black ring-1 ring-amber-300'
                    : 'bg-[#2a2c33] hover:bg-[#343740] border border-zinc-700/60'
                }`}
                title="SHIFT function"
              />
            </div>

            {/* ALPHA */}
            <div className="flex flex-col items-center">
              <span className="text-[8px] font-bold text-[#d45454] uppercase tracking-tighter mb-0.5">
                ALPHA
              </span>
              <button
                type="button"
                onClick={() => {
                  playKeyClick('func');
                  setIsAlpha(!isAlpha);
                  setIsShift(false);
                }}
                className={`w-7 h-5 sm:w-8 sm:h-5.5 rounded-full shadow transition-all active:scale-95 ${
                  isAlpha
                    ? 'bg-[#d45454] text-white ring-1 ring-red-300'
                    : 'bg-[#2a2c33] hover:bg-[#343740] border border-zinc-700/60'
                }`}
                title="ALPHA variable"
              />
            </div>
          </div>

          {/* Center: Authentic Matte Black Replay D-Pad with concentric rings */}
          <div className="flex justify-center">
            <DpadNavigation
              onUp={handleUp}
              onDown={handleDown}
              onLeft={handleUp}
              onRight={handleDown}
            />
          </div>

          {/* Right: SETUP & ON oval pill buttons in recessed oval housing */}
          <div className="flex items-center gap-1.5 justify-center bg-[#131418] p-1.5 rounded-2xl border border-zinc-800/90 shadow-inner">
            {/* SETUP */}
            <div className="flex flex-col items-center">
              <span className="text-[8px] font-bold text-zinc-300 uppercase tracking-tighter mb-0.5">
                SETUP
              </span>
              <button
                type="button"
                onClick={() => {
                  playKeyClick('func');
                  // Toggle Deg/Rad
                  const nextUnit = angleUnit === 'DEG' ? 'RAD' : 'DEG';
                  setAngleUnit(nextUnit);
                  setStatusMessage(`SETUP: ${nextUnit}`);
                }}
                className="w-7 h-5 sm:w-8 sm:h-5.5 rounded-full bg-[#2a2c33] hover:bg-[#343740] border border-zinc-700/60 shadow active:scale-95"
                title="הגדרות מחשבון"
              />
            </div>

            {/* ON */}
            <div className="flex flex-col items-center">
              <span className="text-[8px] font-bold text-zinc-300 uppercase tracking-tighter mb-0.5">
                ON
              </span>
              <button
                type="button"
                onClick={() => {
                  playKeyClick('func');
                  handleClear();
                  setStatusMessage('CASIO FC-200V ON');
                }}
                className="w-7 h-5 sm:w-8 sm:h-5.5 rounded-full bg-[#2a2c33] hover:bg-[#343740] border border-zinc-700/60 shadow active:scale-95"
                title="הפעלת מחשבון"
              />
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 2. SUB-NAV ROW (SHORT CUT 1, SHORT CUT 2, ESC, SOLVE)          */}
        {/* ============================================================== */}
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mb-2 px-1">
          {/* SHORT CUT 1 / FMEM 1 */}
          <div className="flex flex-col items-center">
            <span className="text-[8px] text-[#d4b045] font-bold tracking-tight">FMEM 1</span>
            <button
              type="button"
              onClick={() => {
                playKeyClick('func');
                if (isShift) {
                  setShortCut1(mode);
                  setIsShift(false);
                  setStatusMessage(`SAVED ${mode} TO FMEM 1`);
                } else {
                  handleSelectMode(shortCut1);
                  setStatusMessage(`SHORT CUT 1: ${shortCut1}`);
                }
              }}
              className="w-full py-1.5 rounded-lg bg-[#22242b] hover:bg-[#2b2e38] text-[#7da7d9] text-[9.5px] sm:text-[10px] font-bold border border-zinc-700/50 shadow active:translate-y-0.5"
            >
              SHORT CUT 1
            </button>
          </div>

          {/* SHORT CUT 2 / FMEM 2 */}
          <div className="flex flex-col items-center">
            <span className="text-[8px] text-[#d4b045] font-bold tracking-tight">FMEM 2</span>
            <button
              type="button"
              onClick={() => {
                playKeyClick('func');
                if (isShift) {
                  setShortCut2(mode);
                  setIsShift(false);
                  setStatusMessage(`SAVED ${mode} TO FMEM 2`);
                } else {
                  handleSelectMode(shortCut2);
                  setStatusMessage(`SHORT CUT 2: ${shortCut2}`);
                }
              }}
              className="w-full py-1.5 rounded-lg bg-[#22242b] hover:bg-[#2b2e38] text-[#7da7d9] text-[9.5px] sm:text-[10px] font-bold border border-zinc-700/50 shadow active:translate-y-0.5"
            >
              SHORT CUT 2
            </button>
          </div>

          {/* ESC */}
          <div className="flex flex-col items-center">
            <span className="h-3" />
            <button
              type="button"
              onClick={() => {
                playKeyClick('func');
                setIsEditing(false);
                setEditValue('');
                setStatusMessage('');
              }}
              className="w-full py-1.5 rounded-lg bg-[#22242b] hover:bg-[#2b2e38] text-[#7da7d9] text-[11px] font-bold border border-zinc-700/50 shadow active:translate-y-0.5"
            >
              ESC
            </button>
          </div>

          {/* SOLVE (Authentic light-blue button with dark blue font) */}
          <div className="flex flex-col items-center">
            <span className="h-3" />
            <button
              type="button"
              onClick={handleSolve}
              className="w-full py-1.5 rounded-lg bg-[#6ea4d8] hover:bg-[#80b4e6] text-[#0d2a4a] text-[12px] font-black tracking-wider border border-[#528fc7] shadow-[0_2px_8px_rgba(110,164,216,0.4)] active:translate-y-0.5"
              title="חשב פתרון עבור הפרמטר הנוכחי (SOLVE)"
            >
              SOLVE
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 3. FINANCIAL KEYS (2 ROWS × 6 KEYS = 12 KEYS TOTAL)            */}
        {/* ============================================================== */}
        <div className="space-y-1 mb-2 px-0.5">
          {/* Financial Row 1: SMPL, CMPD, CASH, AMRT, COMP, STAT (S-MENU) */}
          <div className="grid grid-cols-6 gap-1">
            {[
              { id: 'SMPL', label: 'SMPL' },
              { id: 'CMPD', label: 'CMPD' },
              { id: 'CASH', label: 'CASH' },
              { id: 'AMRT', label: 'AMRT' },
              { id: 'COMP', label: 'COMP' },
              { id: 'STAT', label: 'STAT', shift: 'S-MENU' },
            ].map((m) => (
              <div key={m.id} className="flex flex-col items-center">
                <span className="text-[7.5px] text-[#d4b045] font-bold h-3 leading-3">
                  {m.shift || ''}
                </span>
                <button
                  type="button"
                  onClick={() => handleSelectMode(m.id as CalculatorMode)}
                  className={`w-full py-1.5 rounded text-[10.5px] font-bold tracking-tight shadow-sm transition-all ${
                    mode === m.id
                      ? 'bg-blue-600 text-white ring-1 ring-blue-300'
                      : 'bg-[#22242b] text-zinc-100 hover:bg-[#2c2f38] border border-zinc-700/60 active:translate-y-0.5'
                  }`}
                >
                  {m.label}
                </button>
              </div>
            ))}
          </div>

          {/* Financial Row 2: CNVR (A), COST (B), DAYS (C), DEPR (D), BOND, BEVN */}
          <div className="grid grid-cols-6 gap-1">
            {[
              { id: 'CNVR', label: 'CNVR', alpha: 'A' },
              { id: 'COST', label: 'COST', alpha: 'B' },
              { id: 'DAYS', label: 'DAYS', alpha: 'C' },
              { id: 'DEPR', label: 'DEPR', alpha: 'D' },
              { id: 'BOND', label: 'BOND' },
              { id: 'BEVN', label: 'BEVN' },
            ].map((m) => (
              <div key={m.id} className="flex flex-col items-center">
                <span className="text-[7.5px] text-[#d45454] font-bold h-3 leading-3">
                  {m.alpha || ''}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (isAlpha && m.alpha) {
                      handleInputChar(m.alpha);
                      setIsAlpha(false);
                    } else {
                      handleSelectMode(m.id as CalculatorMode);
                    }
                  }}
                  className={`w-full py-1.5 rounded text-[10.5px] font-bold tracking-tight shadow-sm transition-all ${
                    mode === m.id
                      ? 'bg-blue-600 text-white ring-1 ring-blue-300'
                      : 'bg-[#22242b] text-zinc-100 hover:bg-[#2c2f38] border border-zinc-700/60 active:translate-y-0.5'
                  }`}
                >
                  {m.label}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ============================================================== */}
        {/* 4. EDIT & MEMORY ROW (6 KEYS)                                   */}
        {/*    (-), RCL (STO), ( (%), ) (,, X), CTLG (VARS, Y), M+ (M-, M)  */}
        {/* ============================================================== */}
        <div className="grid grid-cols-6 gap-1 mb-2.5 px-0.5">
          {/* (-) */}
          <div className="flex flex-col items-center">
            <span className="h-3" />
            <button
              type="button"
              onClick={() => handleInputChar('-')}
              className="w-full py-1.5 rounded bg-[#202227] hover:bg-[#282a31] text-zinc-200 text-xs font-bold border border-zinc-700/50 shadow active:translate-y-0.5"
            >
              (-)
            </button>
          </div>

          {/* RCL (STO) */}
          <div className="flex flex-col items-center">
            <span className="text-[7.5px] text-[#d4b045] font-bold h-3 leading-3">STO</span>
            <button
              type="button"
              onClick={() => {
                playKeyClick('func');
                if (isShift) {
                  setIsStoreMode(true);
                  setIsShift(false);
                  setStatusMessage('STO: PRESS A-D, X, Y, M');
                } else {
                  setIsRecallMode(true);
                  setStatusMessage('RCL: PRESS A-D, X, Y, M');
                }
              }}
              className="w-full py-1.5 rounded bg-[#202227] hover:bg-[#282a31] text-zinc-200 text-[10.5px] font-bold border border-zinc-700/50 shadow active:translate-y-0.5"
            >
              RCL
            </button>
          </div>

          {/* ( (%) */}
          <div className="flex flex-col items-center">
            <span className="text-[7.5px] text-[#d4b045] font-bold h-3 leading-3">%</span>
            <button
              type="button"
              onClick={() => handleInputChar('(')}
              className="w-full py-1.5 rounded bg-[#202227] hover:bg-[#282a31] text-zinc-200 text-xs font-bold border border-zinc-700/50 shadow active:translate-y-0.5"
            >
              (
            </button>
          </div>

          {/* ) (,, X) */}
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-between w-full px-1 h-3 leading-3">
              <span className="text-[7.5px] text-[#d4b045] font-bold">,</span>
              <span className="text-[7.5px] text-[#d45454] font-bold">X</span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (isAlpha) {
                  handleInputChar('X');
                  setIsAlpha(false);
                } else {
                  handleInputChar(')');
                }
              }}
              className="w-full py-1.5 rounded bg-[#202227] hover:bg-[#282a31] text-zinc-200 text-xs font-bold border border-zinc-700/50 shadow active:translate-y-0.5"
            >
              )
            </button>
          </div>

          {/* CTLG (VARS, Y) */}
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-between w-full px-1 h-3 leading-3">
              <span className="text-[7.5px] text-[#d4b045] font-bold">VARS</span>
              <span className="text-[7.5px] text-[#d45454] font-bold">Y</span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (isAlpha) {
                  handleInputChar('Y');
                  setIsAlpha(false);
                } else {
                  playKeyClick('func');
                  setStatusMessage(`MEM: A=${memory.A} B=${memory.B} C=${memory.C} M=${memory.M}`);
                }
              }}
              className="w-full py-1.5 rounded bg-[#202227] hover:bg-[#282a31] text-zinc-200 text-[10px] font-bold border border-zinc-700/50 shadow active:translate-y-0.5"
            >
              CTLG
            </button>
          </div>

          {/* M+ (M-, M) */}
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-between w-full px-1 h-3 leading-3">
              <span className="text-[7.5px] text-[#d4b045] font-bold">M-</span>
              <span className="text-[7.5px] text-[#d45454] font-bold">M</span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (isAlpha) {
                  handleInputChar('M');
                  setIsAlpha(false);
                } else if (isShift) {
                  handleScientific('', 'M-');
                } else {
                  handleScientific('M+');
                }
              }}
              className="w-full py-1.5 rounded bg-[#202227] hover:bg-[#282a31] text-zinc-200 text-xs font-bold border border-zinc-700/50 shadow active:translate-y-0.5"
            >
              M+
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 5. 4×5 NUMERIC & SCIENTIFIC BLOCK (20 KEYS)                    */}
        {/* ============================================================== */}
        <div className="space-y-1.5 px-0.5">
          {/* Row 1: 7 (eˣ), 8 (ln), 9 (CLR), DEL (INS - Slate Blue), AC (OFF - Slate Blue) */}
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
            {/* 7 */}
            <div className="flex flex-col items-center">
              <span className="text-[8px] text-[#d4b045] font-bold h-3 leading-3">eˣ</span>
              <button
                type="button"
                onClick={() => {
                  if (isShift) {
                    handleScientific('', 'e^(');
                  } else {
                    handleInputChar('7');
                  }
                }}
                className="w-full py-2.5 sm:py-3 rounded-lg bg-[#30333d] hover:bg-[#3a3e49] text-white font-bold text-base sm:text-lg border border-zinc-700/40 shadow-[0_3px_0_#1c1e24] active:translate-y-0.5"
              >
                7
              </button>
            </div>

            {/* 8 */}
            <div className="flex flex-col items-center">
              <span className="text-[8px] text-[#d4b045] font-bold h-3 leading-3">ln</span>
              <button
                type="button"
                onClick={() => {
                  if (isShift) {
                    handleScientific('', 'ln(');
                  } else {
                    handleInputChar('8');
                  }
                }}
                className="w-full py-2.5 sm:py-3 rounded-lg bg-[#30333d] hover:bg-[#3a3e49] text-white font-bold text-base sm:text-lg border border-zinc-700/40 shadow-[0_3px_0_#1c1e24] active:translate-y-0.5"
              >
                8
              </button>
            </div>

            {/* 9 */}
            <div className="flex flex-col items-center">
              <span className="text-[8px] text-[#d4b045] font-bold h-3 leading-3">CLR</span>
              <button
                type="button"
                onClick={() => {
                  if (isShift) {
                    handleScientific('', 'CLR');
                  } else {
                    handleInputChar('9');
                  }
                }}
                className="w-full py-2.5 sm:py-3 rounded-lg bg-[#30333d] hover:bg-[#3a3e49] text-white font-bold text-base sm:text-lg border border-zinc-700/40 shadow-[0_3px_0_#1c1e24] active:translate-y-0.5"
              >
                9
              </button>
            </div>

            {/* DEL (INS) - Authentic Slate Blue/Gray keycap matching photo */}
            <div className="flex flex-col items-center">
              <span className="text-[8px] text-[#d4b045] font-bold h-3 leading-3">INS</span>
              <button
                type="button"
                onClick={handleDelete}
                className="w-full py-2.5 sm:py-3 rounded-lg bg-[#53657d] hover:bg-[#5f738e] text-white font-bold text-xs sm:text-sm border border-[#3e4c5e] shadow-[0_3px_0_#2b3441] active:translate-y-0.5"
              >
                DEL
              </button>
            </div>

            {/* AC (OFF) - Authentic Slate Blue/Gray keycap matching photo */}
            <div className="flex flex-col items-center">
              <span className="text-[8px] text-[#d4b045] font-bold h-3 leading-3">OFF</span>
              <button
                type="button"
                onClick={handleClear}
                className="w-full py-2.5 sm:py-3 rounded-lg bg-[#53657d] hover:bg-[#5f738e] text-white font-bold text-xs sm:text-sm border border-[#3e4c5e] shadow-[0_3px_0_#2b3441] active:translate-y-0.5"
              >
                AC
              </button>
            </div>
          </div>

          {/* Row 2: 4 (x²), 5 (√), 6 (^), ×, ÷ */}
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
            {/* 4 */}
            <div className="flex flex-col items-center">
              <span className="text-[8px] text-[#d4b045] font-bold h-3 leading-3">x²</span>
              <button
                type="button"
                onClick={() => {
                  if (isShift) {
                    handleScientific('', '^2');
                  } else {
                    handleInputChar('4');
                  }
                }}
                className="w-full py-2.5 sm:py-3 rounded-lg bg-[#30333d] hover:bg-[#3a3e49] text-white font-bold text-base sm:text-lg border border-zinc-700/40 shadow-[0_3px_0_#1c1e24] active:translate-y-0.5"
              >
                4
              </button>
            </div>

            {/* 5 */}
            <div className="flex flex-col items-center">
              <span className="text-[8px] text-[#d4b045] font-bold h-3 leading-3">√</span>
              <button
                type="button"
                onClick={() => {
                  if (isShift) {
                    handleScientific('', 'sqrt(');
                  } else {
                    handleInputChar('5');
                  }
                }}
                className="w-full py-2.5 sm:py-3 rounded-lg bg-[#30333d] hover:bg-[#3a3e49] text-white font-bold text-base sm:text-lg border border-zinc-700/40 shadow-[0_3px_0_#1c1e24] active:translate-y-0.5"
              >
                5
              </button>
            </div>

            {/* 6 */}
            <div className="flex flex-col items-center">
              <span className="text-[8px] text-[#d4b045] font-bold h-3 leading-3">^</span>
              <button
                type="button"
                onClick={() => {
                  if (isShift) {
                    handleScientific('', '^');
                  } else {
                    handleInputChar('6');
                  }
                }}
                className="w-full py-2.5 sm:py-3 rounded-lg bg-[#30333d] hover:bg-[#3a3e49] text-white font-bold text-base sm:text-lg border border-zinc-700/40 shadow-[0_3px_0_#1c1e24] active:translate-y-0.5"
              >
                6
              </button>
            </div>

            {/* × */}
            <div className="flex flex-col items-center">
              <span className="h-3" />
              <button
                type="button"
                onClick={() => handleInputChar('×')}
                className="w-full py-2.5 sm:py-3 rounded-lg bg-[#252830] hover:bg-[#2f333d] text-zinc-100 font-bold text-base sm:text-lg border border-zinc-700/50 shadow-[0_3px_0_#17191e] active:translate-y-0.5"
              >
                ×
              </button>
            </div>

            {/* ÷ */}
            <div className="flex flex-col items-center">
              <span className="h-3" />
              <button
                type="button"
                onClick={() => handleInputChar('÷')}
                className="w-full py-2.5 sm:py-3 rounded-lg bg-[#252830] hover:bg-[#2f333d] text-zinc-100 font-bold text-base sm:text-lg border border-zinc-700/50 shadow-[0_3px_0_#17191e] active:translate-y-0.5"
              >
                ÷
              </button>
            </div>
          </div>

          {/* Row 3: 1 (sin), 2 (cos), 3 (tan), +, - */}
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
            {/* 1 */}
            <div className="flex flex-col items-center">
              <span className="text-[8px] text-[#d4b045] font-bold h-3 leading-3">sin</span>
              <button
                type="button"
                onClick={() => {
                  if (isShift) {
                    handleScientific('', 'sin(');
                  } else {
                    handleInputChar('1');
                  }
                }}
                className="w-full py-2.5 sm:py-3 rounded-lg bg-[#30333d] hover:bg-[#3a3e49] text-white font-bold text-base sm:text-lg border border-zinc-700/40 shadow-[0_3px_0_#1c1e24] active:translate-y-0.5"
              >
                1
              </button>
            </div>

            {/* 2 */}
            <div className="flex flex-col items-center">
              <span className="text-[8px] text-[#d4b045] font-bold h-3 leading-3">cos</span>
              <button
                type="button"
                onClick={() => {
                  if (isShift) {
                    handleScientific('', 'cos(');
                  } else {
                    handleInputChar('2');
                  }
                }}
                className="w-full py-2.5 sm:py-3 rounded-lg bg-[#30333d] hover:bg-[#3a3e49] text-white font-bold text-base sm:text-lg border border-zinc-700/40 shadow-[0_3px_0_#1c1e24] active:translate-y-0.5"
              >
                2
              </button>
            </div>

            {/* 3 */}
            <div className="flex flex-col items-center">
              <span className="text-[8px] text-[#d4b045] font-bold h-3 leading-3">tan</span>
              <button
                type="button"
                onClick={() => {
                  if (isShift) {
                    handleScientific('', 'tan(');
                  } else {
                    handleInputChar('3');
                  }
                }}
                className="w-full py-2.5 sm:py-3 rounded-lg bg-[#30333d] hover:bg-[#3a3e49] text-white font-bold text-base sm:text-lg border border-zinc-700/40 shadow-[0_3px_0_#1c1e24] active:translate-y-0.5"
              >
                3
              </button>
            </div>

            {/* + */}
            <div className="flex flex-col items-center">
              <span className="h-3" />
              <button
                type="button"
                onClick={() => handleInputChar('+')}
                className="w-full py-2.5 sm:py-3 rounded-lg bg-[#252830] hover:bg-[#2f333d] text-zinc-100 font-bold text-base sm:text-lg border border-zinc-700/50 shadow-[0_3px_0_#17191e] active:translate-y-0.5"
              >
                +
              </button>
            </div>

            {/* - */}
            <div className="flex flex-col items-center">
              <span className="h-3" />
              <button
                type="button"
                onClick={() => handleInputChar('-')}
                className="w-full py-2.5 sm:py-3 rounded-lg bg-[#252830] hover:bg-[#2f333d] text-zinc-100 font-bold text-base sm:text-lg border border-zinc-700/50 shadow-[0_3px_0_#17191e] active:translate-y-0.5"
              >
                -
              </button>
            </div>
          </div>

          {/* Row 4: 0 (Rnd), . (Δ%), ×10ˣ (π, e), Ans (DRG▶), EXE */}
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
            {/* 0 */}
            <div className="flex flex-col items-center">
              <span className="text-[8px] text-[#d4b045] font-bold h-3 leading-3">Rnd</span>
              <button
                type="button"
                onClick={() => handleInputChar('0')}
                className="w-full py-2.5 sm:py-3 rounded-lg bg-[#30333d] hover:bg-[#3a3e49] text-white font-bold text-base sm:text-lg border border-zinc-700/40 shadow-[0_3px_0_#1c1e24] active:translate-y-0.5"
              >
                0
              </button>
            </div>

            {/* . (Δ%) */}
            <div className="flex flex-col items-center">
              <span className="text-[8px] text-[#d4b045] font-bold h-3 leading-3">Δ%</span>
              <button
                type="button"
                onClick={() => handleInputChar('.')}
                className="w-full py-2.5 sm:py-3 rounded-lg bg-[#30333d] hover:bg-[#3a3e49] text-white font-bold text-base sm:text-lg border border-zinc-700/40 shadow-[0_3px_0_#1c1e24] active:translate-y-0.5"
              >
                .
              </button>
            </div>

            {/* ×10ˣ (π, e) */}
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-between w-full px-1 h-3 leading-3">
                <span className="text-[7.5px] text-[#d4b045] font-bold">π</span>
                <span className="text-[7.5px] text-[#d45454] font-bold">e</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (isShift) {
                    handleScientific('', 'π');
                  } else if (isAlpha) {
                    handleScientific('', '', 'e');
                  } else {
                    handleScientific('*10^');
                  }
                }}
                className="w-full py-2.5 sm:py-3 rounded-lg bg-[#30333d] hover:bg-[#3a3e49] text-white font-bold text-xs sm:text-sm border border-zinc-700/40 shadow-[0_3px_0_#1c1e24] active:translate-y-0.5"
              >
                ×10ˣ
              </button>
            </div>

            {/* Ans (DRG▶) */}
            <div className="flex flex-col items-center">
              <span className="text-[7.5px] text-[#d4b045] font-bold h-3 leading-3">DRG▶</span>
              <button
                type="button"
                onClick={() => {
                  if (isShift) {
                    handleScientific('', 'DEG/RAD');
                  } else {
                    handleScientific(ans.toString());
                  }
                }}
                className="w-full py-2.5 sm:py-3 rounded-lg bg-[#30333d] hover:bg-[#3a3e49] text-zinc-100 font-bold text-xs sm:text-sm border border-zinc-700/40 shadow-[0_3px_0_#1c1e24] active:translate-y-0.5"
              >
                Ans
              </button>
            </div>

            {/* EXE */}
            <div className="flex flex-col items-center">
              <span className="h-3" />
              <button
                type="button"
                onClick={handleExe}
                className="w-full py-2.5 sm:py-3 rounded-lg bg-[#1f2229] hover:bg-[#282b34] text-white font-black text-sm sm:text-base border border-zinc-700/80 shadow-[0_3px_0_#101115] active:translate-y-0.5"
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

export default CasioFC200V;
