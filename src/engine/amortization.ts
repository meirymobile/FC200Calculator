import { TVMParams, AmortizationRow, AmortizationSummary } from '../types/calculator';
import { getPeriodicRate, solvePMT } from './tvm';

/**
 * Generates the full amortization schedule row by row
 */
export function generateAmortizationSchedule(params: TVMParams): AmortizationRow[] {
  const { set, n, i, py, cy } = params;
  let pv = Math.abs(params.pv);
  let pmt = Math.abs(params.pmt);

  // If PMT is 0 or not provided, calculate it
  if (pmt === 0 && pv > 0 && n > 0) {
    try {
      pmt = Math.abs(solvePMT(params));
    } catch {
      pmt = 0;
    }
  }

  const rate = getPeriodicRate(i, py, cy);
  const rows: AmortizationRow[] = [];
  const totalPeriods = Math.min(Math.max(1, Math.round(n)), 1200); // safety cap at 1200 months (100 years)

  let currentBalance = pv;
  let cumPrincipal = 0;
  let cumInterest = 0;

  for (let k = 1; k <= totalPeriods; k++) {
    let interestPayment = 0;
    let principalPayment = 0;

    if (set === 'Begin' && k === 1) {
      // First payment at begin period has 0 interest
      interestPayment = 0;
      principalPayment = Math.min(pmt, currentBalance);
    } else {
      interestPayment = currentBalance * rate;
      principalPayment = pmt - interestPayment;
    }

    // Adjustment for final period or negative balance overshoot
    if (k === totalPeriods || principalPayment > currentBalance) {
      principalPayment = currentBalance;
      pmt = principalPayment + interestPayment;
    }

    currentBalance = Math.max(0, currentBalance - principalPayment);
    cumPrincipal += principalPayment;
    cumInterest += interestPayment;

    rows.push({
      period: k,
      payment: Number(pmt.toFixed(2)),
      principal: Number(principalPayment.toFixed(2)),
      interest: Number(interestPayment.toFixed(2)),
      balance: Number(currentBalance.toFixed(2)),
      accumulatedPrincipal: Number(cumPrincipal.toFixed(2)),
      accumulatedInterest: Number(cumInterest.toFixed(2)),
    });

    if (currentBalance <= 0.001) {
      break;
    }
  }

  return rows;
}

/**
 * Calculates FC-200V specific AMORT outputs for PM1 and PM2
 */
export function calculateAmortizationSummary(
  params: TVMParams,
  pm1: number,
  pm2: number
): AmortizationSummary {
  const rows = generateAmortizationSchedule(params);
  const safePm1 = Math.max(1, Math.min(Math.round(pm1), rows.length));
  const safePm2 = Math.max(safePm1, Math.min(Math.round(pm2), rows.length));

  const targetRow = rows[safePm2 - 1] || {
    balance: 0,
    interest: 0,
    principal: 0,
    payment: 0,
    period: safePm2,
    accumulatedInterest: 0,
    accumulatedPrincipal: 0,
  };

  let sumInt = 0;
  let sumPrn = 0;

  for (let idx = safePm1 - 1; idx < safePm2 && idx < rows.length; idx++) {
    sumInt += rows[idx].interest;
    sumPrn += rows[idx].principal;
  }

  return {
    pm1: safePm1,
    pm2: safePm2,
    bal: targetRow.balance,
    int: targetRow.interest,
    prn: targetRow.principal,
    sumInt: Number(sumInt.toFixed(2)),
    sumPrn: Number(sumPrn.toFixed(2)),
    rows,
  };
}
