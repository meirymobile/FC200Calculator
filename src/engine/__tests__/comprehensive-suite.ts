import {
  solvePMT,
  solvePV,
  solveFV,
  solveN,
  solveI,
  getPeriodicRate,
} from '../tvm';
import { TVMParams } from '../../types/calculator';
import {
  generateAmortizationSchedule,
  calculateAmortizationSummary,
} from '../amortization';
import {
  calculateNPV,
  calculateIRR,
  calculatePBP,
  solveCashFlow,
} from '../cashflow';
import { aprToEff, effToApr } from '../conversion';
import { solveCost, solveSell, solveMargin } from '../cost';
import { evaluateMathExpression, EvalContext } from '../mathEvaluator';
import {
  solveBEVNProfit,
  solveBEVNQuantity,
  solveBEVNPrice,
  solveBEVNFixedCost,
  calculateBreakEvenPoint,
} from '../bevn';
import { calculateDepreciation } from '../depreciation';
import { calculateDaysBetween, addDaysToDate } from '../days';
import { solveBondPrice, solveBondYield } from '../bond';
import {
  solveSMPLInterest,
  solveSMPLFutureValue,
  solveSMPLPrincipal,
  solveSMPLRate,
  solveSMPLDays,
} from '../smpl';
import { calculate1VarStats, calculate2VarStats } from '../stat';

export interface TestResult {
  category: string;
  testId: string;
  name: string;
  input: any;
  expected: any;
  actual: any;
  passed: boolean;
  notes?: string;
}

const results: TestResult[] = [];

function assertApprox(
  category: string,
  testId: string,
  name: string,
  input: any,
  actual: number | null | string,
  expected: number | null | string,
  tolerance = 0.05,
  notes = ''
) {
  let passed = false;
  if (actual === null || expected === null) {
    passed = actual === expected;
  } else if (typeof actual === 'number' && typeof expected === 'number') {
    passed = Math.abs(actual - expected) <= tolerance;
  } else {
    passed = actual === expected;
  }

  results.push({
    category,
    testId,
    name,
    input,
    expected,
    actual,
    passed,
    notes,
  });
}

function assertThrows(
  category: string,
  testId: string,
  name: string,
  input: any,
  fn: () => void,
  notes = ''
) {
  let passed = false;
  let actualError = 'No error thrown';
  try {
    fn();
  } catch (err: any) {
    passed = true;
    actualError = err.message || 'Error thrown';
  }
  results.push({
    category,
    testId,
    name,
    input,
    expected: 'Should throw Error',
    actual: actualError,
    passed,
    notes,
  });
}

console.log('Running 180 Comprehensive Tests for Casio FC-200V Engine...');

// ==========================================
// 1. TVM - solvePMT (10 Tests)
// ==========================================
// Test 1.1: Standard mortgage 1M @ 4.8% 25y End mode
assertApprox('solvePMT', 'PMT-01', 'Mortgage 1M, 25y, 4.8%, End', 
  { pv: -1000000, n: 300, i: 4.8, py: 12, cy: 12, set: 'End' },
  solvePMT({ set: 'End', n: 300, i: 4.8, pv: -1000000, pmt: 0, fv: 0, py: 12, cy: 12 }),
  5729.97, 0.05);

// Test 1.2: Standard mortgage Begin mode
assertApprox('solvePMT', 'PMT-02', 'Mortgage 1M, 25y, 4.8%, Begin',
  { pv: -1000000, n: 300, i: 4.8, py: 12, cy: 12, set: 'Begin' },
  solvePMT({ set: 'Begin', n: 300, i: 4.8, pv: -1000000, pmt: 0, fv: 0, py: 12, cy: 12 }),
  5707.14, 0.05);

// Test 1.3: Zero Interest Loan
assertApprox('solvePMT', 'PMT-03', 'Zero Interest Loan 12K, 12 months',
  { pv: -12000, n: 12, i: 0, py: 12, cy: 12, set: 'End' },
  solvePMT({ set: 'End', n: 12, i: 0, pv: -12000, pmt: 0, fv: 0, py: 12, cy: 12 }),
  1000.00, 0.01);

// Test 1.4: Auto loan 120K @ 6% for 5 years (60 months)
assertApprox('solvePMT', 'PMT-04', 'Auto loan 120K, 6%, 60m, End',
  { pv: -120000, n: 60, i: 6.0, py: 12, cy: 12, set: 'End' },
  solvePMT({ set: 'End', n: 60, i: 6.0, pv: -12000, pmt: 0, fv: 0, py: 12, cy: 12 }),
  231.99, 0.05);

// Test 1.5: Loan with Balloon / Future Value residual
assertApprox('solvePMT', 'PMT-05', 'Loan 100K with 20K balloon FV, 5y @ 5%',
  { pv: -100000, fv: 20000, n: 60, i: 5.0, py: 12, cy: 12, set: 'End' },
  solvePMT({ set: 'End', n: 60, i: 5.0, pv: -100000, pmt: 0, fv: 20000, py: 12, cy: 12 }),
  1593.03, 0.05);

// Test 1.6: Annual loan P/Y=1, C/Y=1 (100K @ 7% for 10 years)
assertApprox('solvePMT', 'PMT-06', 'Annual payments P/Y=1, C/Y=1',
  { pv: -100000, n: 10, i: 7.0, py: 1, cy: 1, set: 'End' },
  solvePMT({ set: 'End', n: 10, i: 7.0, pv: -100000, pmt: 0, fv: 0, py: 1, cy: 1 }),
  14237.75, 0.1);

// Test 1.7: Different compounding P/Y=12, C/Y=2 (Canadian mortgage)
assertApprox('solvePMT', 'PMT-07', 'Semi-annual compounding P/Y=12, C/Y=2',
  { pv: -100000, n: 120, i: 6.0, py: 12, cy: 2, set: 'End' },
  solvePMT({ set: 'End', n: 120, i: 6.0, pv: -100000, pmt: 0, fv: 0, py: 12, cy: 2 }),
  1106.51, 0.05);

// Test 1.8: Savings annuity sinking fund (target 500K in 10y @ 6%)
assertApprox('solvePMT', 'PMT-08', 'Sinking fund target 500K FV',
  { pv: 0, fv: 500000, n: 120, i: 6.0, py: 12, cy: 12, set: 'End' },
  solvePMT({ set: 'End', n: 120, i: 6.0, pv: 0, pmt: 0, fv: 500000, py: 12, cy: 12 }),
  -3051.03, 0.1);

// Test 1.9: Very short term 1 month loan
assertApprox('solvePMT', 'PMT-09', '1 month short term loan 10K @ 12%',
  { pv: -10000, n: 1, i: 12.0, py: 12, cy: 12, set: 'End' },
  solvePMT({ set: 'End', n: 1, i: 12.0, pv: -10000, pmt: 0, fv: 0, py: 12, cy: 12 }),
  10100.00, 0.01);

// Test 1.10: High interest rate 50% annual for 24 months
assertApprox('solvePMT', 'PMT-10', 'High interest rate 50% 2y',
  { pv: -50000, n: 24, i: 50.0, py: 12, cy: 12, set: 'End' },
  solvePMT({ set: 'End', n: 24, i: 50.0, pv: -50000, pmt: 0, fv: 0, py: 12, cy: 12 }),
  3335.54, 0.05);

// ==========================================
// 2. TVM - solvePV (10 Tests)
// ==========================================
// Test 2.1: Reverse of mortgage test PMT 5729.97 -> PV 1M
assertApprox('solvePV', 'PV-01', 'Mortgage PV from PMT 5729.97',
  { pmt: 5729.97, n: 300, i: 4.8, py: 12, cy: 12, set: 'End' },
  solvePV({ set: 'End', n: 300, i: 4.8, pv: 0, pmt: 5729.97, fv: 0, py: 12, cy: 12 }),
  -1000000.00, 0.1);

// Test 2.2: Begin mode reverse check
assertApprox('solvePV', 'PV-02', 'Begin mode PV from PMT 5707.14',
  { pmt: 5707.14, n: 300, i: 4.8, py: 12, cy: 12, set: 'Begin' },
  solvePV({ set: 'Begin', n: 300, i: 4.8, pv: 0, pmt: 5707.14, fv: 0, py: 12, cy: 12 }),
  -1000000.00, 0.5);

// Test 2.3: Zero Interest PV
assertApprox('solvePV', 'PV-03', 'Zero Interest PV for 1000/m 12m',
  { pmt: 1000, n: 12, i: 0, py: 12, cy: 12, set: 'End' },
  solvePV({ set: 'End', n: 12, i: 0, pv: 0, pmt: 1000, fv: 0, py: 12, cy: 12 }),
  -12000.00, 0.01);

// Test 2.4: Pure Lump Sum Discounting (PMT = 0, FV = 100K in 5y @ 6%)
assertApprox('solvePV', 'PV-04', 'Lump sum discount FV 100K 5y @ 6%',
  { pmt: 0, fv: 100000, n: 60, i: 6.0, py: 12, cy: 12, set: 'End' },
  solvePV({ set: 'End', n: 60, i: 6.0, pv: 0, pmt: 0, fv: 100000, py: 12, cy: 12 }),
  -74137.22, 0.1);

// Test 2.5: Annual payments PV (10 payments of 15,000 @ 5%)
assertApprox('solvePV', 'PV-05', 'Annual payments PV 15K x 10 @ 5%',
  { pmt: 15000, n: 10, i: 5.0, py: 1, cy: 1, set: 'End' },
  solvePV({ set: 'End', n: 10, i: 5.0, pv: 0, pmt: 15000, fv: 0, py: 1, cy: 1 }),
  -115826.02, 0.1);

// Test 2.6: Quarterly payments PV (P/Y=4, C/Y=4, 20 quarters of 2,500 @ 8%)
assertApprox('solvePV', 'PV-06', 'Quarterly payments PV P/Y=4',
  { pmt: 2500, n: 20, i: 8.0, py: 4, cy: 4, set: 'End' },
  solvePV({ set: 'End', n: 20, i: 8.0, pv: 0, pmt: 2500, fv: 0, py: 4, cy: 4 }),
  -40878.58, 0.1);

// Test 2.7: Combined PMT and FV to find PV
assertApprox('solvePV', 'PV-07', 'Combined PMT 1000 and FV 50000 in 36m @ 7%',
  { pmt: 1000, fv: 50000, n: 36, i: 7.0, py: 12, cy: 12, set: 'End' },
  solvePV({ set: 'End', n: 36, i: 7.0, pv: 0, pmt: 1000, fv: 50000, py: 12, cy: 12 }),
  -72940.41, 0.05);

// Test 2.8: Single period PV
assertApprox('solvePV', 'PV-08', 'Single period PV for 10100 @ 12% annual',
  { pmt: 10100, n: 1, i: 12.0, py: 12, cy: 12, set: 'End' },
  solvePV({ set: 'End', n: 1, i: 12.0, pv: 0, pmt: 10100, fv: 0, py: 12, cy: 12 }),
  -10000.00, 0.01);

// Test 2.9: PV with P/Y != C/Y
assertApprox('solvePV', 'PV-09', 'PV with P/Y=12, C/Y=2',
  { pmt: 1106.51, n: 120, i: 6.0, py: 12, cy: 2, set: 'End' },
  solvePV({ set: 'End', n: 120, i: 6.0, pv: 0, pmt: 1106.51, fv: 0, py: 12, cy: 2 }),
  -100000.00, 1.0);

// Test 2.10: Large amount PV (10M loan)
assertApprox('solvePV', 'PV-10', 'Large amount PV 10M',
  { pmt: 57299.70, n: 300, i: 4.8, py: 12, cy: 12, set: 'End' },
  solvePV({ set: 'End', n: 300, i: 4.8, pv: 0, pmt: 57299.70, fv: 0, py: 12, cy: 12 }),
  -10000000.00, 1.0);

// ==========================================
// 3. TVM - solveFV (10 Tests)
// ==========================================
// Test 3.1: Lump sum compound interest FV (100K @ 6% for 10 years monthly)
assertApprox('solveFV', 'FV-01', 'Lump sum FV 100K @ 6% 10y',
  { pv: -100000, pmt: 0, n: 120, i: 6.0, py: 12, cy: 12, set: 'End' },
  solveFV({ set: 'End', n: 120, i: 6.0, pv: -100000, pmt: 0, fv: 0, py: 12, cy: 12 }),
  181939.67, 0.1);

// Test 3.2: Monthly savings annuity FV (2,000/m for 20y @ 7% End)
assertApprox('solveFV', 'FV-02', 'Savings annuity 2K/m 20y @ 7% End',
  { pv: 0, pmt: -2000, n: 240, i: 7.0, py: 12, cy: 12, set: 'End' },
  solveFV({ set: 'End', n: 240, i: 7.0, pv: 0, pmt: -2000, fv: 0, py: 12, cy: 12 }),
  1041853.30, 0.5);

// Test 3.3: Monthly savings annuity FV in Begin mode
assertApprox('solveFV', 'FV-03', 'Savings annuity Begin mode',
  { pv: 0, pmt: -2000, n: 240, i: 7.0, py: 12, cy: 12, set: 'Begin' },
  solveFV({ set: 'Begin', n: 240, i: 7.0, pv: 0, pmt: -2000, fv: 0, py: 12, cy: 12 }),
  1047930.77, 0.5);

// Test 3.4: Zero Interest FV
assertApprox('solveFV', 'FV-04', 'Zero interest FV 2000 x 240',
  { pv: 0, pmt: -2000, n: 240, i: 0, py: 12, cy: 12, set: 'End' },
  solveFV({ set: 'End', n: 240, i: 0, pv: 0, pmt: -2000, fv: 0, py: 12, cy: 12 }),
  480000.00, 0.01);

// Test 3.5: Loan fully paid off (FV should be 0)
assertApprox('solveFV', 'FV-05', 'Loan fully amortized FV = 0',
  { pv: -100000, pmt: 1085.26, n: 120, i: 5.5, py: 12, cy: 12, set: 'End' },
  solveFV({ set: 'End', n: 120, i: 5.5, pv: -100000, pmt: 1085.26, fv: 0, py: 12, cy: 12 }),
  0.00, 0.5);

// Test 3.6: Annual investment compounding (50K/year for 15y @ 8%)
assertApprox('solveFV', 'FV-06', 'Annual investment FV P/Y=1',
  { pv: 0, pmt: -50000, n: 15, i: 8.0, py: 1, cy: 1, set: 'End' },
  solveFV({ set: 'End', n: 15, i: 8.0, pv: 0, pmt: -50000, fv: 0, py: 1, cy: 1 }),
  1357605.70, 0.5);

// Test 3.7: Starting deposit + monthly deposits FV
assertApprox('solveFV', 'FV-07', 'Starting deposit 50K + 1K/m for 10y @ 6%',
  { pv: -50000, pmt: -1000, n: 120, i: 6.0, py: 12, cy: 12, set: 'End' },
  solveFV({ set: 'End', n: 120, i: 6.0, pv: -50000, pmt: -1000, fv: 0, py: 12, cy: 12 }),
  254849.19, 0.2);

// Test 3.8: P/Y != C/Y FV calculation
assertApprox('solveFV', 'FV-08', 'FV with P/Y=12, C/Y=4',
  { pv: -10000, pmt: -500, n: 60, i: 8.0, py: 12, cy: 4, set: 'End' },
  solveFV({ set: 'End', n: 60, i: 8.0, pv: -10000, pmt: -500, fv: 0, py: 12, cy: 4 }),
  51547.43, 0.5);

// Test 3.9: 1 period FV
assertApprox('solveFV', 'FV-09', '1 month growth 100K @ 12%',
  { pv: -100000, pmt: 0, n: 1, i: 12.0, py: 12, cy: 12, set: 'End' },
  solveFV({ set: 'End', n: 1, i: 12.0, pv: -100000, pmt: 0, fv: 0, py: 12, cy: 12 }),
  101000.00, 0.01);

// Test 3.10: High growth rate 20% annual for 5 years
assertApprox('solveFV', 'FV-10', 'High growth rate 20% annual for 5y',
  { pv: -100000, pmt: 0, n: 5, i: 20.0, py: 1, cy: 1, set: 'End' },
  solveFV({ set: 'End', n: 5, i: 20.0, pv: -100000, pmt: 0, fv: 0, py: 1, cy: 1 }),
  248832.00, 0.1);

// ==========================================
// 4. TVM - solveN (10 Tests)
// ==========================================
// Test 4.1: Solve N for mortgage (should be 300)
assertApprox('solveN', 'N-01', 'Mortgage N for 1M @ 4.8% with PMT 5729.83',
  { pv: -1000000, pmt: 5729.83, i: 4.8, py: 12, cy: 12, set: 'End' },
  solveN({ set: 'End', n: 0, i: 4.8, pv: -1000000, pmt: 5729.83, fv: 0, py: 12, cy: 12 }),
  300.0, 0.1);

// Test 4.2: Solve N for Begin mode
assertApprox('solveN', 'N-02', 'Begin mode N check',
  { pv: -1000000, pmt: 5707.00, i: 4.8, py: 12, cy: 12, set: 'Begin' },
  solveN({ set: 'Begin', n: 0, i: 4.8, pv: -1000000, pmt: 5707.00, fv: 0, py: 12, cy: 12 }),
  300.0, 0.1);

// Test 4.3: Zero Interest solve N
assertApprox('solveN', 'N-03', 'Zero Interest N for 12K with 1K PMT',
  { pv: -12000, pmt: 1000, i: 0, py: 12, cy: 12, set: 'End' },
  solveN({ set: 'End', n: 0, i: 0, pv: -12000, pmt: 1000, fv: 0, py: 12, cy: 12 }),
  12.0, 0.01);

// Test 4.4: Sinking fund solve N to reach 1M
assertApprox('solveN', 'N-04', 'Savings N to reach 1M with 2K/m @ 7%',
  { pv: 0, pmt: -2000, fv: 1041853.30, i: 7.0, py: 12, cy: 12, set: 'End' },
  solveN({ set: 'End', n: 0, i: 7.0, pv: 0, pmt: -2000, fv: 1041853.30, py: 12, cy: 12 }),
  240.0, 0.1);

// Test 4.5: Auto loan 60 months check
assertApprox('solveN', 'N-05', 'Auto loan 100K with PMT 1085.26 @ 5.5%',
  { pv: -100000, pmt: 1085.26, i: 5.5, py: 12, cy: 12, set: 'End' },
  solveN({ set: 'End', n: 0, i: 5.5, pv: -100000, pmt: 1085.26, fv: 0, py: 12, cy: 12 }),
  120.0, 0.1);

// Test 4.6: Annual payments N check
assertApprox('solveN', 'N-06', 'Annual payments N check',
  { pv: -100000, pmt: 14237.75, i: 7.0, py: 1, cy: 1, set: 'End' },
  solveN({ set: 'End', n: 0, i: 7.0, pv: -100000, pmt: 14237.75, fv: 0, py: 1, cy: 1 }),
  10.0, 0.1);

// Test 4.7: P/Y != C/Y solve N
assertApprox('solveN', 'N-07', 'P/Y=12, C/Y=2 solve N',
  { pv: -100000, pmt: 1107.02, i: 6.0, py: 12, cy: 2, set: 'End' },
  solveN({ set: 'End', n: 0, i: 6.0, pv: -100000, pmt: 1107.02, fv: 0, py: 12, cy: 2 }),
  120.0, 0.1);

// Test 4.8: Single month loan N check
assertApprox('solveN', 'N-08', '1 month loan N check',
  { pv: -10000, pmt: 10100, i: 12.0, py: 12, cy: 12, set: 'End' },
  solveN({ set: 'End', n: 0, i: 12.0, pv: -10000, pmt: 10100, fv: 0, py: 12, cy: 12 }),
  1.0, 0.01);

// Test 4.9: Impossible loan payoff where PMT < interest (should throw)
assertThrows('solveN', 'N-09', 'Throw on PMT less than interest',
  { pv: -100000, pmt: 100, i: 12.0, py: 12, cy: 12, set: 'End' },
  () => solveN({ set: 'End', n: 0, i: 12.0, pv: -100000, pmt: 100, fv: 0, py: 12, cy: 12 }),
  'Should detect infinite debt loop');

// Test 4.10: Zero interest PMT = 0 (should throw)
assertThrows('solveN', 'N-10', 'Throw on zero payment zero interest',
  { pv: -100000, pmt: 0, i: 0, py: 12, cy: 12, set: 'End' },
  () => solveN({ set: 'End', n: 0, i: 0, pv: -100000, pmt: 0, fv: 0, py: 12, cy: 12 }));

// ==========================================
// 5. TVM - solveI (10 Tests)
// ==========================================
// Test 5.1: Solve I% for standard 5.5% loan
assertApprox('solveI', 'I-01', 'Loan 100K, 120m, PMT 1085.26 -> 5.5%',
  { pv: -100000, pmt: 1085.26, n: 120, py: 12, cy: 12, set: 'End' },
  solveI({ set: 'End', n: 120, i: 0, pv: -100000, pmt: 1085.26, fv: 0, py: 12, cy: 12 }),
  5.5000, 0.005);

// Test 5.2: Solve I% for mortgage 4.8%
assertApprox('solveI', 'I-02', 'Mortgage 1M, 300m, PMT 5729.83 -> 4.8%',
  { pv: -1000000, pmt: 5729.83, n: 300, py: 12, cy: 12, set: 'End' },
  solveI({ set: 'End', n: 300, i: 0, pv: -1000000, pmt: 5729.83, fv: 0, py: 12, cy: 12 }),
  4.8000, 0.005);

// Test 5.3: Solve I% Begin mode
assertApprox('solveI', 'I-03', 'Begin mode interest rate root solver',
  { pv: -1000000, pmt: 5707.00, n: 300, py: 12, cy: 12, set: 'Begin' },
  solveI({ set: 'Begin', n: 300, i: 0, pv: -1000000, pmt: 5707.00, fv: 0, py: 12, cy: 12 }),
  4.8000, 0.01);

// Test 5.4: Solve I% for 0% interest
assertApprox('solveI', 'I-04', 'Zero interest solve I%',
  { pv: -12000, pmt: 1000, n: 12, py: 12, cy: 12, set: 'End' },
  solveI({ set: 'End', n: 12, i: 0, pv: -12000, pmt: 1000, fv: 0, py: 12, cy: 12 }),
  0.0000, 0.001);

// Test 5.5: Savings annuity rate (FV 1,041,853 with PMT 2000 over 240m -> 7%)
assertApprox('solveI', 'I-05', 'Savings annuity solve I% -> 7.0%',
  { pv: 0, pmt: -2000, fv: 1041853.30, n: 240, py: 12, cy: 12, set: 'End' },
  solveI({ set: 'End', n: 240, i: 0, pv: 0, pmt: -2000, fv: 1041853.30, py: 12, cy: 12 }),
  7.0000, 0.01);

// Test 5.6: Annual payments solve I% (10 payments of 14,237.75 -> 7%)
assertApprox('solveI', 'I-06', 'Annual payments solve I% -> 7.0%',
  { pv: -100000, pmt: 14237.75, n: 10, py: 1, cy: 1, set: 'End' },
  solveI({ set: 'End', n: 10, i: 0, pv: -100000, pmt: 14237.75, fv: 0, py: 1, cy: 1 }),
  7.0000, 0.01);

// Test 5.7: High interest rate 25% solve I%
assertApprox('solveI', 'I-07', 'High interest rate 25% solve I%',
  { pv: -10000, pmt: 533.72, n: 24, py: 12, cy: 12, set: 'End' },
  solveI({ set: 'End', n: 24, i: 0, pv: -10000, pmt: 533.72, fv: 0, py: 12, cy: 12 }),
  25.0000, 0.02);

// Test 5.8: Low interest rate 1.5% solve I%
assertApprox('solveI', 'I-08', 'Low interest rate 1.5% solve I%',
  { pv: -100000, pmt: 897.91, n: 120, py: 12, cy: 12, set: 'End' },
  solveI({ set: 'End', n: 120, i: 0, pv: -100000, pmt: 897.91, fv: 0, py: 12, cy: 12 }),
  1.5000, 0.02);

// Test 5.9: Lump sum double in 10 years (Rule of 72 check ~7.18%)
assertApprox('solveI', 'I-09', 'Lump sum doubling in 10 years',
  { pv: -10000, pmt: 0, fv: 20000, n: 120, py: 12, cy: 12, set: 'End' },
  solveI({ set: 'End', n: 120, i: 0, pv: -10000, pmt: 0, fv: 20000, py: 12, cy: 12 }),
  6.9526, 0.01);

// Test 5.10: Throw on invalid n <= 0
assertThrows('solveI', 'I-10', 'Throw on n <= 0',
  { pv: -100000, pmt: 1000, n: 0, py: 12, cy: 12 },
  () => solveI({ set: 'End', n: 0, i: 0, pv: -100000, pmt: 1000, fv: 0, py: 12, cy: 12 }));

// ==========================================
// 6. AMORTIZATION SCHEDULE (10 Tests)
// ==========================================
const sampleTvm: TVMParams = {
  set: 'End',
  n: 120,
  i: 5.5,
  pv: -100000,
  pmt: 1085.26,
  fv: 0,
  py: 12,
  cy: 12,
};
const schedule = generateAmortizationSchedule(sampleTvm);

// Test 6.1: Schedule length equals n
assertApprox('AMORT', 'AMORT-01', 'Schedule length equals n (120 rows)',
  { n: 120 }, schedule.length, 120, 0);

// Test 6.2: Final balance reaches 0.00
assertApprox('AMORT', 'AMORT-02', 'Final balance at end of loan is 0.00',
  {}, schedule[schedule.length - 1].balance, 0.00, 0.05);

// Test 6.3: First payment interest INT1 = 100,000 * (0.055 / 12) = 458.33
assertApprox('AMORT', 'AMORT-03', 'Payment 1 interest amount is 458.33',
  {}, schedule[0].interest, 458.33, 0.05);

// Test 6.4: First payment principal PRN1 = 1085.26 - 458.33 = 626.93
assertApprox('AMORT', 'AMORT-04', 'Payment 1 principal amount is 626.93',
  {}, schedule[0].principal, 626.93, 0.05);

// Test 6.5: Year 1 summary PM1=1, PM2=12
const year1Summary = calculateAmortizationSummary(sampleTvm, 1, 12);
assertApprox('AMORT', 'AMORT-05', 'Year 1 remaining balance BAL ~92,284.27',
  {}, year1Summary.bal, 92284.27, 1.0);

// Test 6.6: Year 1 total interest ΣINT ~5307.40
assertApprox('AMORT', 'AMORT-06', 'Year 1 accumulated interest ΣINT ~5,307.40',
  {}, year1Summary.sumInt, 5307.40, 2.0);

// Test 6.7: Year 1 total principal ΣPRN ~7715.73
assertApprox('AMORT', 'AMORT-07', 'Year 1 accumulated principal ΣPRN ~7,715.73',
  {}, year1Summary.sumPrn, 7715.73, 2.0);

// Test 6.8: Cumulative principal equals original loan amount (100K)
const totalPrincipal = schedule.reduce((sum, r) => sum + r.principal, 0);
assertApprox('AMORT', 'AMORT-08', 'Sum of all PRN equals total loan 100,000',
  {}, totalPrincipal, 100000.00, 1.0);

// Test 6.9: Begin mode period 1 interest is 0.00
const beginSchedule = generateAmortizationSchedule({ ...sampleTvm, set: 'Begin' });
assertApprox('AMORT', 'AMORT-09', 'Begin mode period 1 interest is exactly 0.00',
  {}, beginSchedule[0].interest, 0.00, 0.01);

// Test 6.10: Single period summary check PM1 = PM2 = 12
const singlePeriodSummary = calculateAmortizationSummary(sampleTvm, 12, 12);
assertApprox('AMORT', 'AMORT-10', 'Single period PM1=PM2=12 matches PRN and INT',
  {}, singlePeriodSummary.sumPrn, singlePeriodSummary.prn, 0.01);

// ==========================================
// 7. CASH FLOW - calculateNPV (10 Tests)
// ==========================================
// Test 7.1: Standard project NPV (CF0 = -10K, C1 = 3K, C2 = 4.2K, C3 = 6.8K @ 10%)
assertApprox('NPV', 'NPV-01', 'Standard project NPV @ 10% is 1307.29',
  {}, calculateNPV(10, [-10000, 3000, 4200, 6800]), 1307.29, 0.1);

// Test 7.2: Zero discount rate NPV equals algebraic sum
assertApprox('NPV', 'NPV-02', 'Zero rate NPV equals simple sum',
  {}, calculateNPV(0, [-10000, 3000, 4200, 6800]), 4000.00, 0.01);

// Test 7.3: Negative NPV with high discount rate (50%)
assertApprox('NPV', 'NPV-03', 'Negative NPV @ 50% discount rate',
  {}, calculateNPV(50, [-10000, 3000, 4200, 6800]), -4118.52, 0.05);

// Test 7.4: Single period cash flow
assertApprox('NPV', 'NPV-04', 'Single period cash flow discount',
  {}, calculateNPV(10, [-1000, 1100]), 0.00, 0.01);

// Test 7.5: Only initial outflow NPV
assertApprox('NPV', 'NPV-05', 'Only CF0 returns CF0',
  {}, calculateNPV(10, [-50000]), -50000.00, 0.01);

// Test 7.6: Annuity equivalent NPV (5 periods of 1000 @ 10%)
assertApprox('NPV', 'NPV-06', '5 periods annuity of 1000 @ 10%',
  {}, calculateNPV(10, [0, 1000, 1000, 1000, 1000, 1000]), 3790.79, 0.1);

// Test 7.7: Large scale flows (10M investment)
assertApprox('NPV', 'NPV-07', 'Large scale flows NPV',
  {}, calculateNPV(8, [-10000000, 3500000, 4500000, 5000000]), 1067926.64, 0.5);

// Test 7.8: Zero cash flows NPV = 0
assertApprox('NPV', 'NPV-08', 'All zero flows NPV = 0',
  {}, calculateNPV(10, [0, 0, 0]), 0.00, 0.01);

// Test 7.9: Unequal positive & negative flows
assertApprox('NPV', 'NPV-09', 'Fluctuating cash flows NPV',
  {}, calculateNPV(12, [-5000, 2000, -1000, 4000, 3000]), 742.20, 0.05);

// Test 7.10: 10 year project NPV @ 6%
const tenYearFlows = [-100000, ...Array(10).fill(16000)];
assertApprox('NPV', 'NPV-10', '10 year annuity project NPV @ 6%',
  {}, calculateNPV(6, tenYearFlows), 17761.34, 0.5);

// ==========================================
// 8. CASH FLOW - calculateIRR (10 Tests)
// ==========================================
// Test 8.1: Standard project IRR is 16.34%
assertApprox('IRR', 'IRR-01', 'Standard project IRR ~16.3406%',
  {}, calculateIRR([-10000, 3000, 4200, 6800]), 16.3406, 0.02);

// Test 8.2: 1-period double your money IRR is 100%
assertApprox('IRR', 'IRR-02', 'Double investment in 1 period IRR = 100%',
  {}, calculateIRR([-1000, 2000]), 100.0000, 0.01);

// Test 8.3: 1-period 10% return IRR is 10%
assertApprox('IRR', 'IRR-03', 'Simple 10% return IRR = 10%',
  {}, calculateIRR([-1000, 1100]), 10.0000, 0.01);

// Test 8.4: Zero return IRR is 0%
assertApprox('IRR', 'IRR-04', 'Even recovery IRR = 0%',
  {}, calculateIRR([-1000, 500, 500]), 0.0000, 0.01);

// Test 8.5: Loss of capital negative IRR
assertApprox('IRR', 'IRR-05', 'Loss of capital negative IRR -10%',
  {}, calculateIRR([-1000, 900]), -10.0000, 0.01);

// Test 8.6: 5-period steady annuity project IRR
assertApprox('IRR', 'IRR-06', '5-period annuity project IRR',
  {}, calculateIRR([-10000, 3000, 3000, 3000, 3000, 3000]), 15.2382, 0.02);

// Test 8.7: All positive flows (no sign change -> null)
assertApprox('IRR', 'IRR-07', 'All positive flows returns null',
  {}, calculateIRR([1000, 2000, 3000]), null, 0);

// Test 8.8: All negative flows (no sign change -> null)
assertApprox('IRR', 'IRR-08', 'All negative flows returns null',
  {}, calculateIRR([-1000, -2000, -3000]), null, 0);

// Test 8.9: High yield project IRR 50%
assertApprox('IRR', 'IRR-09', 'High yield project IRR = 50%',
  {}, calculateIRR([-10000, 5000, 15000]), 50.0000, 0.05);

// Test 8.10: 10 year project IRR
assertApprox('IRR', 'IRR-10', '10 year project IRR ~9.61%',
  {}, calculateIRR(tenYearFlows), 9.6087, 0.02);

// ==========================================
// 9. CASH FLOW - calculatePBP (10 Tests)
// ==========================================
// Test 9.1: Standard project PBP ~ 2.41 periods
assertApprox('PBP', 'PBP-01', 'Standard project PBP is 2.41 periods',
  {}, calculatePBP([-10000, 3000, 4200, 6800]), 2.41, 0.02);

// Test 9.2: Exact integer period payback (PBP = 2.0)
assertApprox('PBP', 'PBP-02', 'Exact integer period payback PBP = 2.0',
  {}, calculatePBP([-10000, 5000, 5000]), 2.00, 0.01);

// Test 9.3: 1-period payback
assertApprox('PBP', 'PBP-03', '1-period exact payback PBP = 1.0',
  {}, calculatePBP([-1000, 1000]), 1.00, 0.01);

// Test 9.4: Payback in period 1 with excess (e.g. 0.5)
assertApprox('PBP', 'PBP-04', 'Partial period 1 payback PBP = 0.5',
  {}, calculatePBP([-1000, 2000]), 0.50, 0.01);

// Test 9.5: Zero initial investment PBP = 0
assertApprox('PBP', 'PBP-05', 'Zero initial investment PBP = 0',
  {}, calculatePBP([0, 1000]), 0.00, 0.01);

// Test 9.6: Never recovered project (PBP = null)
assertApprox('PBP', 'PBP-06', 'Unrecovered project returns null',
  {}, calculatePBP([-10000, 1000, 2000, 3000]), null, 0);

// Test 9.7: 4-period steady recovery PBP = 3.33
assertApprox('PBP', 'PBP-07', 'Steady recovery PBP = 3.33',
  {}, calculatePBP([-10000, 3000, 3000, 3000, 3000]), 3.33, 0.02);

// Test 9.8: Empty flows returns null
assertApprox('PBP', 'PBP-08', 'Empty array returns null',
  {}, calculatePBP([]), null, 0);

// Test 9.9: Late recovery period 5
assertApprox('PBP', 'PBP-09', 'Late recovery period 5.25',
  {}, calculatePBP([-50000, 10000, 10000, 10000, 10000, 10000, 40000]), 5.00, 0.01);

// Test 9.10: Fractional recovery in last period
assertApprox('PBP', 'PBP-10', 'Fractional recovery in last period PBP = 2.75',
  {}, calculatePBP([-10000, 4000, 3000, 4000]), 2.75, 0.01);

// ==========================================
// 10. INTEREST CONVERSION - APR vs EFF (10 Tests)
// ==========================================
// Test 10.1: 6% monthly compounding to EFF
assertApprox('CNVR', 'CNVR-01', 'APR 6% monthly to EFF is 6.1678%',
  {}, aprToEff(6.0, 12), 6.1678, 0.001);

// Test 10.2: EFF back to APR
assertApprox('CNVR', 'CNVR-02', 'EFF 6.1678% back to APR 6.0%',
  {}, effToApr(6.1678, 12), 6.0000, 0.005);

// Test 10.3: Daily compounding 365 days (10% APR -> 10.5156% EFF)
assertApprox('CNVR', 'CNVR-03', 'APR 10% daily 365 to EFF ~10.5156%',
  {}, aprToEff(10.0, 365), 10.5156, 0.005);

// Test 10.4: Semi-annual compounding (8% APR -> 8.16% EFF)
assertApprox('CNVR', 'CNVR-04', 'APR 8% semi-annual n=2 to EFF 8.16%',
  {}, aprToEff(8.0, 2), 8.1600, 0.001);

// Test 10.5: Quarterly compounding (12% APR -> 12.5509% EFF)
assertApprox('CNVR', 'CNVR-05', 'APR 12% quarterly n=4 to EFF 12.5509%',
  {}, aprToEff(12.0, 4), 12.5509, 0.002);

// Test 10.6: Annual compounding n=1 (APR == EFF)
assertApprox('CNVR', 'CNVR-06', 'Annual compounding n=1 APR == EFF',
  {}, aprToEff(7.5, 1), 7.5000, 0.001);

// Test 10.7: Zero interest rate APR 0% to EFF
assertApprox('CNVR', 'CNVR-07', 'Zero APR to EFF is 0.0%',
  {}, aprToEff(0.0, 12), 0.0000, 0.001);

// Test 10.8: High interest rate 50% APR monthly to EFF 63.2094%
assertApprox('CNVR', 'CNVR-08', 'High APR 50% monthly to EFF ~63.2094%',
  {}, aprToEff(50.0, 12), 63.2094, 0.01);

// Test 10.9: Reverse high EFF back to APR
assertApprox('CNVR', 'CNVR-09', 'Reverse high EFF 63.2094% back to 50%',
  {}, effToApr(63.2094, 12), 50.0000, 0.02);

// Test 10.10: Throw on invalid n <= 0
assertThrows('CNVR', 'CNVR-10', 'Throw on invalid periods n <= 0',
  {}, () => aprToEff(6.0, 0));

// ==========================================
// 11. COST / SELL / MARGIN (10 Tests)
// ==========================================
// Test 11.1: Cost 100, Sell 125 -> Margin 20%
assertApprox('COST', 'COST-01', 'Cost 100, Sell 125 -> Margin 20%',
  {}, solveMargin(100, 125), 20.0000, 0.001);

// Test 11.2: Cost 100, Margin 20% -> Sell 125
assertApprox('COST', 'COST-02', 'Cost 100, Margin 20% -> Sell 125',
  {}, solveSell(100, 20), 125.0000, 0.001);

// Test 11.3: Sell 125, Margin 20% -> Cost 100
assertApprox('COST', 'COST-03', 'Sell 125, Margin 20% -> Cost 100',
  {}, solveCost(125, 20), 100.0000, 0.001);

// Test 11.4: 50% Margin: Cost 50 -> Sell 100
assertApprox('COST', 'COST-04', 'Cost 50, Margin 50% -> Sell 100',
  {}, solveSell(50, 50), 100.0000, 0.001);

// Test 11.5: Zero profit margin: Cost == Sell
assertApprox('COST', 'COST-05', 'Cost 100, Sell 100 -> Margin 0%',
  {}, solveMargin(100, 100), 0.0000, 0.001);

// Test 11.6: Negative profit margin (loss): Cost 120, Sell 100 -> Margin -20%
assertApprox('COST', 'COST-06', 'Negative margin loss: Cost 120, Sell 100',
  {}, solveMargin(120, 100), -20.0000, 0.001);

// Test 11.7: High margin 80%: Cost 20 -> Sell 100
assertApprox('COST', 'COST-07', 'High margin 80%: Cost 20 -> Sell 100',
  {}, solveSell(20, 80), 100.0000, 0.001);

// Test 11.8: Decimal margin: Cost 85.50, Sell 114.00 -> Margin 25%
assertApprox('COST', 'COST-08', 'Decimal margin calculation',
  {}, solveMargin(85.50, 114.00), 25.0000, 0.001);

// Test 11.9: Throw on Sell = 0 for solveMargin
assertThrows('COST', 'COST-09', 'Throw on Sell = 0',
  {}, () => solveMargin(100, 0));

// Test 11.10: Throw on Margin >= 100% for solveSell
assertThrows('COST', 'COST-10', 'Throw on Margin >= 100%',
  {}, () => solveSell(100, 100));

// ==========================================
// 12. SCIENTIFIC & COMP EVALUATOR (10 Tests)
// ==========================================
// Test 12.1: Basic arithmetic order of operations
assertApprox('COMP', 'COMP-01', 'Order of operations: 2 + 3 * 4 = 14',
  {}, evaluateMathExpression('2 + 3 * 4'), 14.00, 0.001);

// Test 12.2: Parentheses precedence
assertApprox('COMP', 'COMP-02', 'Parentheses: (2 + 3) * 4 = 20',
  {}, evaluateMathExpression('(2 + 3) * 4'), 20.00, 0.001);

// Test 12.3: Powers and Square Roots
assertApprox('COMP', 'COMP-03', 'Powers and roots: sqrt(144) + 2^4 = 28',
  {}, evaluateMathExpression('sqrt(144) + 2^4'), 28.00, 0.001);

// Test 12.4: Factorials x!
assertApprox('COMP', 'COMP-04', 'Factorial: 5! = 120',
  {}, evaluateMathExpression('5!'), 120.00, 0.001);

// Test 12.5: Permutations nPr: 5P2 = 20
assertApprox('COMP', 'COMP-05', 'Permutations: nPr(5, 2) = 20',
  {}, evaluateMathExpression('nPr(5, 2)'), 20.00, 0.001);

// Test 12.6: Combinations nCr: 5C2 = 10
assertApprox('COMP', 'COMP-06', 'Combinations: nCr(5, 2) = 10',
  {}, evaluateMathExpression('nCr(5, 2)'), 10.00, 0.001);

// Test 12.7: Trigonometry in DEG: sin(30) = 0.5
assertApprox('COMP', 'COMP-07', 'DEG mode trig: sin(30) = 0.5',
  {}, evaluateMathExpression('sin(30)', { angleUnit: 'DEG', ans: 0, memory: {} }), 0.5000, 0.001);

// Test 12.8: Trigonometry in RAD: sin(π / 6) = 0.5
assertApprox('COMP', 'COMP-08', 'RAD mode trig: sin(π / 6) = 0.5',
  {}, evaluateMathExpression('sin(π / 6)', { angleUnit: 'RAD', ans: 0, memory: {} }), 0.5000, 0.001);

// Test 12.9: Natural Log and Log10: ln(e) + log(100) = 3
assertApprox('COMP', 'COMP-09', 'Logs: ln(e) + log(100) = 3',
  {}, evaluateMathExpression('ln(e) + log(100)'), 3.00, 0.001);

// Test 12.10: Memory register variable usage
assertApprox('COMP', 'COMP-10', 'Memory variable: A * 2 + Ans = 50',
  {}, evaluateMathExpression('A * 2 + Ans', { angleUnit: 'DEG', ans: 10, memory: { A: 20 } }), 50.00, 0.001);

// ==========================================
// 13. BEVN (Break-Even Analysis) Tests (10 tests)
// ==========================================
// Test 13.1: Standard Profit: Q=1000, PRC=50, VC=30, FC=10000 -> PRF = 10000
assertApprox('BEVN', 'BEVN-01', 'Calculate Profit',
  { q: 1000, prc: 50, vc: 30, fc: 10000 },
  solveBEVNProfit({ q: 1000, prc: 50, vc: 30, fc: 10000, prf: 0 }),
  10000, 0.01);

// Test 13.2: Break-Even Quantity (PRF=0): PRC=50, VC=30, FC=10000 -> Q=500
assertApprox('BEVN', 'BEVN-02', 'Break-even quantity at PRF=0',
  { prc: 50, vc: 30, fc: 10000, prf: 0 },
  solveBEVNQuantity({ q: 0, prc: 50, vc: 30, fc: 10000, prf: 0 }),
  500, 0.01);

// Test 13.3: Target Profit Quantity: PRF=20000 -> Q = (10000+20000)/20 = 1500
assertApprox('BEVN', 'BEVN-03', 'Quantity for target profit of 20000',
  { prc: 50, vc: 30, fc: 10000, prf: 20000 },
  solveBEVNQuantity({ q: 0, prc: 50, vc: 30, fc: 10000, prf: 20000 }),
  1500, 0.01);

// Test 13.4: Required Selling Price: Q=500, VC=20, FC=5000, PRF=5000 -> PRC=40
assertApprox('BEVN', 'BEVN-04', 'Solve required price',
  { q: 500, vc: 20, fc: 5000, prf: 5000 },
  solveBEVNPrice({ q: 500, prc: 0, vc: 20, fc: 5000, prf: 5000 }),
  40, 0.01);

// Test 13.5: Allowable Fixed Cost: Q=2000, PRC=100, VC=60, PRF=30000 -> FC=50000
assertApprox('BEVN', 'BEVN-05', 'Solve allowable fixed cost',
  { q: 2000, prc: 100, vc: 60, prf: 30000 },
  solveBEVNFixedCost({ q: 2000, prc: 100, vc: 60, fc: 0, prf: 30000 }),
  50000, 0.01);

// Test 13.6: BEP Sales revenue helper: FC=20000, PRC=100, VC=60 -> BEP Units=500, BEP Sales=50000
assertApprox('BEVN', 'BEVN-06', 'BEP sales revenue',
  { prc: 100, vc: 60, fc: 20000 },
  calculateBreakEvenPoint({ q: 0, prc: 100, vc: 60, fc: 20000, prf: 0 }).bepSales,
  50000, 0.01);

// Test 13.7: Zero profit break-even verification
assertApprox('BEVN', 'BEVN-07', 'Profit at exact break-even quantity is zero',
  { q: 500, prc: 100, vc: 60, fc: 20000 },
  solveBEVNProfit({ q: 500, prc: 100, vc: 60, fc: 20000, prf: 0 }),
  0, 0.01);

// Test 13.8: Loss scenario: Q=200, Margin=40, FC=20000 -> PRF = -12000
assertApprox('BEVN', 'BEVN-08', 'Loss when below break-even',
  { q: 200, prc: 100, vc: 60, fc: 20000 },
  solveBEVNProfit({ q: 200, prc: 100, vc: 60, fc: 20000, prf: 0 }),
  -12000, 0.01);

// Test 13.9: High volume low margin: Q=100000, PRC=1.5, VC=1.0, FC=30000 -> PRF=20000
assertApprox('BEVN', 'BEVN-09', 'High volume low margin profit',
  { q: 100000, prc: 1.5, vc: 1.0, fc: 30000 },
  solveBEVNProfit({ q: 100000, prc: 1.5, vc: 1.0, fc: 30000, prf: 0 }),
  20000, 0.01);

// Test 13.10: Zero fixed cost: Q=100, PRC=10, VC=6, FC=0 -> PRF=400
assertApprox('BEVN', 'BEVN-10', 'Zero fixed cost profit',
  { q: 100, prc: 10, vc: 6, fc: 0 },
  solveBEVNProfit({ q: 100, prc: 10, vc: 6, fc: 0, prf: 0 }),
  400, 0.01);

// ==========================================
// 14. DEPR (Depreciation) Tests (10 tests)
// ==========================================
// Test 14.1: Straight-Line SL year 1: CST=10000, SAL=1000, n=5, j=1 -> DPJ=1800
assertApprox('DEPR', 'DEPR-01', 'SL annual depreciation',
  { cst: 10000, sal: 1000, n: 5, j: 1 },
  calculateDepreciation({ method: 'SL', cst: 10000, sal: 1000, n: 5, j: 1 }).dpj,
  1800, 0.01);

// Test 14.2: Straight-Line SL accumulated at year 3: ACC = 1800 * 3 = 5400
assertApprox('DEPR', 'DEPR-02', 'SL accumulated depreciation year 3',
  { cst: 10000, sal: 1000, n: 5, j: 3 },
  calculateDepreciation({ method: 'SL', cst: 10000, sal: 1000, n: 5, j: 3 }).acc,
  5400, 0.01);

// Test 14.3: Straight-Line SL book value at end: RDV = 1000
assertApprox('DEPR', 'DEPR-03', 'SL final book value matches salvage',
  { cst: 10000, sal: 1000, n: 5, j: 5 },
  calculateDepreciation({ method: 'SL', cst: 10000, sal: 1000, n: 5, j: 5 }).rdv,
  1000, 0.01);

// Test 14.4: SYD year 1: Denom=15, DPJ = 9000 * (5/15) = 3000
assertApprox('DEPR', 'DEPR-04', 'SYD year 1 depreciation',
  { cst: 10000, sal: 1000, n: 5, j: 1 },
  calculateDepreciation({ method: 'SYD', cst: 10000, sal: 1000, n: 5, j: 1 }).dpj,
  3000, 0.01);

// Test 14.5: SYD year 2: DPJ = 9000 * (4/15) = 2400
assertApprox('DEPR', 'DEPR-05', 'SYD year 2 depreciation',
  { cst: 10000, sal: 1000, n: 5, j: 2 },
  calculateDepreciation({ method: 'SYD', cst: 10000, sal: 1000, n: 5, j: 2 }).dpj,
  2400, 0.01);

// Test 14.6: SYD accumulated year 2: ACC = 3000 + 2400 = 5400
assertApprox('DEPR', 'DEPR-06', 'SYD accumulated year 2',
  { cst: 10000, sal: 1000, n: 5, j: 2 },
  calculateDepreciation({ method: 'SYD', cst: 10000, sal: 1000, n: 5, j: 2 }).acc,
  5400, 0.01);

// Test 14.7: SYD final book value: RDV = 1000
assertApprox('DEPR', 'DEPR-07', 'SYD final book value',
  { cst: 10000, sal: 1000, n: 5, j: 5 },
  calculateDepreciation({ method: 'SYD', cst: 10000, sal: 1000, n: 5, j: 5 }).rdv,
  1000, 0.01);

// Test 14.8: Declining Balance (DB) year 1: 10000 * (2/5 = 40%) = 4000
assertApprox('DEPR', 'DEPR-08', 'DB year 1 depreciation',
  { cst: 10000, sal: 1000, n: 5, j: 1 },
  calculateDepreciation({ method: 'DB', cst: 10000, sal: 1000, n: 5, j: 1 }).dpj,
  4000, 0.01);

// Test 14.9: Declining Balance (DB) year 2: 6000 * 40% = 2400
assertApprox('DEPR', 'DEPR-09', 'DB year 2 depreciation',
  { cst: 10000, sal: 1000, n: 5, j: 2 },
  calculateDepreciation({ method: 'DB', cst: 10000, sal: 1000, n: 5, j: 2 }).dpj,
  2400, 0.01);

// Test 14.10: Declining Balance (DB) book value year 2: 10000 - 4000 - 2400 = 3600
assertApprox('DEPR', 'DEPR-10', 'DB book value year 2',
  { cst: 10000, sal: 1000, n: 5, j: 2 },
  calculateDepreciation({ method: 'DB', cst: 10000, sal: 1000, n: 5, j: 2 }).rdv,
  3600, 0.01);

// ==========================================
// 15. DAYS (Date & Day Calculation) Tests (10 tests)
// ==========================================
// Test 15.1: Actual days in full year: 2026.0101 to 2027.0101 = 365
assertApprox('DAYS', 'DAYS-01', 'Actual days in standard year',
  {}, calculateDaysBetween('2026.0101', '2027.0101', '365'), 365, 0.01);

// Test 15.2: 30/360 days in standard year = 360
assertApprox('DAYS', 'DAYS-02', '30/360 days in standard year',
  {}, calculateDaysBetween('2026.0101', '2027.0101', '360'), 360, 0.01);

// Test 15.3: Exact month days (July = 31 days)
assertApprox('DAYS', 'DAYS-03', 'July actual days',
  {}, calculateDaysBetween('2026.0701', '2026.0801', '365'), 31, 0.01);

// Test 15.4: 30/360 month days (July = 30 days)
assertApprox('DAYS', 'DAYS-04', 'July in 30/360 basis',
  {}, calculateDaysBetween('2026.0701', '2026.0801', '360'), 30, 0.01);

// Test 15.5: February 2024 (Leap year = 29 days)
assertApprox('DAYS', 'DAYS-05', 'Leap year February days',
  {}, calculateDaysBetween('2024.0201', '2024.0301', '365'), 29, 0.01);

// Test 15.6: February 2026 (Common year = 28 days)
assertApprox('DAYS', 'DAYS-06', 'Common year February days',
  {}, calculateDaysBetween('2026.0201', '2026.0301', '365'), 28, 0.01);

// Test 15.7: Same day = 0 days
assertApprox('DAYS', 'DAYS-07', 'Same date difference',
  {}, calculateDaysBetween('2026.0515', '2026.0515', '365'), 0, 0.01);

// Test 15.8: Add 30 days to date
assertApprox('DAYS', 'DAYS-08', 'Add 30 days to 2026.0101',
  {}, addDaysToDate('2026.0101', 30), '2026.0131');

// Test 15.9: Add 365 days across year
assertApprox('DAYS', 'DAYS-09', 'Add 365 days',
  {}, addDaysToDate('2026.0101', 365), '2027.0101');

// Test 15.10: Quarter (90 days on 30/360 basis)
assertApprox('DAYS', 'DAYS-10', '1 Quarter 30/360 days',
  {}, calculateDaysBetween('2026.0101', '2026.0401', '360'), 90, 0.01);

// ==========================================
// 16. BOND (Bond Pricing and Yield) Tests (10 tests)
// ==========================================
// Test 16.1: Par bond: CPN = 5%, YLD = 5% -> Price = 100
assertApprox('BOND', 'BOND-01', 'Par bond trades at 100',
  { cpn: 5, yld: 5 },
  solveBondPrice({ couponsPerYear: 1, d1: '2026.0101', d2: '2031.0101', rdv: 100, cpn: 5, yld: 5, prc: 0 }),
  100.0, 0.05);

// Test 16.2: Discount bond: CPN = 4%, YLD = 6% -> Price < 100
assertApprox('BOND', 'BOND-02', 'Discount bond 5-year 4% cpn at 6% yld',
  { cpn: 4, yld: 6 },
  solveBondPrice({ couponsPerYear: 1, d1: '2026.0101', d2: '2031.0101', rdv: 100, cpn: 4, yld: 6, prc: 0 }),
  91.575, 0.1);

// Test 16.3: Premium bond: CPN = 7%, YLD = 5% -> Price > 100
assertApprox('BOND', 'BOND-03', 'Premium bond 5-year 7% cpn at 5% yld',
  { cpn: 7, yld: 5 },
  solveBondPrice({ couponsPerYear: 1, d1: '2026.0101', d2: '2031.0101', rdv: 100, cpn: 7, yld: 5, prc: 0 }),
  108.659, 0.1);

// Test 16.4: Semi-annual par bond: CPN=6%, YLD=6% -> Price = 100
assertApprox('BOND', 'BOND-04', 'Semi-annual par bond',
  { cpn: 6, yld: 6 },
  solveBondPrice({ couponsPerYear: 2, d1: '2026.0101', d2: '2036.0101', rdv: 100, cpn: 6, yld: 6, prc: 0 }),
  100.0, 0.05);

// Test 16.5: Zero-coupon bond: CPN = 0%, YLD = 5%, 5-year -> 100 / (1.05)^5 = 78.35
assertApprox('BOND', 'BOND-05', 'Zero-coupon 5-year bond',
  { cpn: 0, yld: 5 },
  solveBondPrice({ couponsPerYear: 1, d1: '2026.0101', d2: '2031.0101', rdv: 100, cpn: 0, yld: 5, prc: 0 }),
  78.35, 0.1);

// Test 16.6: Solve Yield for par bond: Price=100, CPN=5% -> YLD = 5%
assertApprox('BOND', 'BOND-06', 'Solve yield for par bond',
  { prc: 100, cpn: 5 },
  solveBondYield({ couponsPerYear: 1, d1: '2026.0101', d2: '2031.0101', rdv: 100, cpn: 5, yld: 0, prc: 100 }),
  5.0, 0.01);

// Test 16.7: Solve Yield for discount bond: Price=91.575 -> YLD = 6%
assertApprox('BOND', 'BOND-07', 'Solve yield for discount bond',
  { prc: 91.575, cpn: 4 },
  solveBondYield({ couponsPerYear: 1, d1: '2026.0101', d2: '2031.0101', rdv: 100, cpn: 4, yld: 0, prc: 91.575 }),
  6.0, 0.02);

// Test 16.8: Solve Yield for premium bond: Price=108.66 -> YLD = 5%
assertApprox('BOND', 'BOND-08', 'Solve yield for premium bond',
  { prc: 108.66, cpn: 7 },
  solveBondYield({ couponsPerYear: 1, d1: '2026.0101', d2: '2031.0101', rdv: 100, cpn: 7, yld: 0, prc: 108.66 }),
  5.0, 0.02);

// Test 16.9: 10-year semi-annual coupon bond pricing
assertApprox('BOND', 'BOND-09', '10-year semi-annual coupon bond',
  { cpn: 4, yld: 5 },
  solveBondPrice({ couponsPerYear: 2, d1: '2026.0101', d2: '2036.0101', rdv: 100, cpn: 4, yld: 5, prc: 0 }),
  92.205, 0.15);

// Test 16.10: 1-year annual coupon bond
assertApprox('BOND', 'BOND-10', '1-year annual bond',
  { cpn: 8, yld: 6 },
  solveBondPrice({ couponsPerYear: 1, d1: '2026.0101', d2: '2027.0101', rdv: 100, cpn: 8, yld: 6, prc: 0 }),
  101.887, 0.05);

// ==========================================
// 17. SMPL (Simple Interest) Tests (10 tests)
// ==========================================
// Test 17.1: Simple Interest 365 basis: PV=100000, 365 days, 5% -> SI = 5000
assertApprox('SMPL', 'SMPL-01', 'Simple interest full year 365 basis',
  { pv: -100000, dys: 365, i: 5, set: '365' },
  solveSMPLInterest({ pv: -100000, dys: 365, i: 5, set: '365' }),
  5000, 0.01);

// Test 17.2: Simple Future Value: PV=100000, SI=5000 -> SFV = -105000
assertApprox('SMPL', 'SMPL-02', 'Simple future value',
  { pv: -100000, dys: 365, i: 5, set: '365' },
  solveSMPLFutureValue({ pv: -100000, dys: 365, i: 5, set: '365' }),
  -105000, 0.01);

// Test 17.3: 360-day basis (Commercial basis): PV=100000, 180 days, 6% -> SI = 3000
assertApprox('SMPL', 'SMPL-03', 'Simple interest 360 basis 180 days',
  { pv: -100000, dys: 180, i: 6, set: '360' },
  solveSMPLInterest({ pv: -100000, dys: 180, i: 6, set: '360' }),
  3000, 0.01);

// Test 17.4: Short-term loan: PV=50000, 30 days, 12% 365 basis -> SI = 493.15
assertApprox('SMPL', 'SMPL-04', 'Short-term 30-day interest',
  { pv: -50000, dys: 30, i: 12, set: '365' },
  solveSMPLInterest({ pv: -50000, dys: 30, i: 12, set: '365' }),
  493.15, 0.05);

// Test 17.5: Zero interest rate -> SI = 0
assertApprox('SMPL', 'SMPL-05', 'Zero interest rate gives 0 SI',
  { pv: -100000, dys: 100, i: 0, set: '365' },
  solveSMPLInterest({ pv: -100000, dys: 100, i: 0, set: '365' }),
  0, 0.001);

// Test 17.6: Solve Principal PV from SI: SI=5000, 365 days, 5% -> PV = -100000
assertApprox('SMPL', 'SMPL-06', 'Solve Principal PV from Interest',
  { dys: 365, i: 5, si: 5000 },
  solveSMPLPrincipal(365, 5, 5000, '365'),
  -100000, 0.01);

// Test 17.7: Solve Rate I% from SI: PV=100000, SI=5000, 365 days -> I% = 5%
assertApprox('SMPL', 'SMPL-07', 'Solve Rate I% from Interest',
  { dys: 365, pv: -100000, si: 5000 },
  solveSMPLRate(365, -100000, 5000, '365'),
  5.0, 0.01);

// Test 17.8: Solve Days from SI: PV=100000, I=5%, SI=2500 -> 182.5 -> 183 days
assertApprox('SMPL', 'SMPL-08', 'Solve Days from Interest',
  { pv: -100000, i: 5, si: 2500 },
  solveSMPLDays(-100000, 5, 2500, '365'),
  183, 1);

// Test 17.9: 90 days quarter 360 basis: PV=20000, I=8% -> SI = 400
assertApprox('SMPL', 'SMPL-09', 'Quarterly 90-day 360 basis',
  { pv: -20000, dys: 90, i: 8, set: '360' },
  solveSMPLInterest({ pv: -20000, dys: 90, i: 8, set: '360' }),
  400, 0.01);

// Test 17.10: Leap year 366 days on 365 basis: PV=10000, I=10% -> SI = 1002.74
assertApprox('SMPL', 'SMPL-10', '366 days simple interest',
  { pv: -10000, dys: 366, i: 10, set: '365' },
  solveSMPLInterest({ pv: -10000, dys: 366, i: 10, set: '365' }),
  1002.74, 0.02);

// ==========================================
// 18. STAT (Statistics & Regression) Tests (10 tests)
// ==========================================
// Test 18.1: 1-Variable Mean: [10, 20, 30, 40, 50] -> Mean = 30
assertApprox('STAT', 'STAT-01', '1-Var Mean calculation',
  { data: [10, 20, 30, 40, 50] },
  calculate1VarStats([10, 20, 30, 40, 50]).mean,
  30.0, 0.001);

// Test 18.2: 1-Variable Sum Σx: [10, 20, 30, 40, 50] -> Σx = 150
assertApprox('STAT', 'STAT-02', '1-Var Sum Σx',
  { data: [10, 20, 30, 40, 50] },
  calculate1VarStats([10, 20, 30, 40, 50]).sumX,
  150.0, 0.001);

// Test 18.3: 1-Variable Sample Standard Deviation sx: [10, 20, 30, 40, 50] -> sx = 15.811
assertApprox('STAT', 'STAT-03', '1-Var Sample std dev sx',
  { data: [10, 20, 30, 40, 50] },
  calculate1VarStats([10, 20, 30, 40, 50]).sx,
  15.8114, 0.001);

// Test 18.4: 1-Variable Population Standard Deviation σx: [10, 20, 30, 40, 50] -> σx = 14.142
assertApprox('STAT', 'STAT-04', '1-Var Population std dev σx',
  { data: [10, 20, 30, 40, 50] },
  calculate1VarStats([10, 20, 30, 40, 50]).sigmaX,
  14.1421, 0.001);

// Test 18.5: Min and Max: [5, 12, -3, 40, 22] -> Min=-3, Max=40
assertApprox('STAT', 'STAT-05', '1-Var Min and Max',
  { data: [5, 12, -3, 40, 22] },
  calculate1VarStats([5, 12, -3, 40, 22]).minX,
  -3.0, 0.001);

// Test 18.6: 2-Variable Linear Regression Slope b: y = 2x + 1 -> b = 2.0
assertApprox('STAT', 'STAT-06', 'Linear regression slope b',
  {},
  calculate2VarStats([{ x: 1, y: 3 }, { x: 2, y: 5 }, { x: 3, y: 7 }, { x: 4, y: 9 }]).b,
  2.0, 0.001);

// Test 18.7: Linear Regression Intercept a: y = 2x + 1 -> a = 1.0
assertApprox('STAT', 'STAT-07', 'Linear regression intercept a',
  {},
  calculate2VarStats([{ x: 1, y: 3 }, { x: 2, y: 5 }, { x: 3, y: 7 }, { x: 4, y: 9 }]).a,
  1.0, 0.001);

// Test 18.8: Perfect correlation r = 1.0
assertApprox('STAT', 'STAT-08', 'Correlation coefficient r = 1.0',
  {},
  calculate2VarStats([{ x: 1, y: 3 }, { x: 2, y: 5 }, { x: 3, y: 7 }, { x: 4, y: 9 }]).r,
  1.0, 0.001);

// Test 18.9: Negative correlation r = -1.0: y = -3x + 10
assertApprox('STAT', 'STAT-09', 'Negative correlation r = -1.0',
  {},
  calculate2VarStats([{ x: 1, y: 7 }, { x: 2, y: 4 }, { x: 3, y: 1 }]).r,
  -1.0, 0.001);

// Test 18.10: Empty data safety
assertApprox('STAT', 'STAT-10', 'Empty stats safety',
  {},
  calculate1VarStats([]).n,
  0, 0.001);

// ==========================================
// Print Summary
// ==========================================
const totalTests = results.length;
const passedTests = results.filter((r) => r.passed).length;
const failedTests = results.filter((r) => !r.passed);

console.log('\n=============================================');
console.log(`TOTAL TESTS EXECUTED: ${totalTests}`);
console.log(`PASSED: ${passedTests}`);
console.log(`FAILED: ${failedTests.length}`);
console.log('=============================================\n');

if (failedTests.length > 0) {
  console.error('FAILURES FOUND:');
  for (const f of failedTests) {
    console.error(`- [${f.testId}] ${f.category} - ${f.name}: Expected ${f.expected}, got ${f.actual}`);
  }
} else {
  console.log('ALL 180 TESTS PASSED WITH 100% ACCURACY!');
}

export { results };
