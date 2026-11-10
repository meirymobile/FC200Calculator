export type CalculatorMode =
  | 'COMP'
  | 'CMPD'
  | 'SMPL'
  | 'CASH'
  | 'AMRT'
  | 'AMORT'
  | 'STAT'
  | 'CNVR'
  | 'COST'
  | 'DAYS'
  | 'DEPR'
  | 'BOND'
  | 'BEVN';

export type PaymentTiming = 'Begin' | 'End';

export interface TVMParams {
  set: PaymentTiming;
  n: number;
  i: number; // Annual interest rate in percent, e.g. 5.5
  pv: number;
  pmt: number;
  fv: number;
  py: number; // Payments per year (default 12 or 1)
  cy: number; // Compounding periods per year (default 12 or 1)
}

export interface AmortizationRow {
  period: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
  accumulatedPrincipal: number;
  accumulatedInterest: number;
}

export interface AmortizationSummary {
  pm1: number;
  pm2: number;
  bal: number;
  int: number;
  prn: number;
  sumInt: number;
  sumPrn: number;
  rows: AmortizationRow[];
}

export interface CashFlowItem {
  id: string;
  flow: number; // Amount (positive inflow, negative outflow)
  frequency: number; // Number of consecutive periods
}

export interface CashFlowParams {
  rate: number; // Discount rate I%
  cf0: number; // Initial investment (usually negative)
  flows: CashFlowItem[];
}

export interface CashFlowResults {
  npv: number;
  irr: number | null;
  pbp: number | null; // Payback period
  nfv: number;
}

export interface InterestConversionParams {
  n: number; // compounding periods per year
  apr: number; // nominal rate %
  eff: number; // effective rate %
}

export interface CostSellMarginParams {
  cst: number; // Cost
  sel: number; // Sell price
  mar: number; // Margin %
}

export interface StepExplanation {
  title: string;
  category: string;
  summary: string;
  formula: string;
  parameters: { label: string; value: string | number; description: string }[];
  steps: string[];
  resultNote: string;
}

