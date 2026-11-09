import { TVMParams } from '../types/calculator';

/**
 * Calculates the periodic interest rate based on annual I%, P/Y and C/Y
 */
export function getPeriodicRate(iAnnualPercent: number, py: number, cy: number): number {
  if (iAnnualPercent === 0) return 0;
  const r = iAnnualPercent / 100;
  if (py === cy) {
    return r / py;
  }
  // When compounding frequency differs from payment frequency:
  // (1 + i_period) = (1 + r / cy)^(cy / py)
  return Math.pow(1 + r / cy, cy / py) - 1;
}

/**
 * Converts periodic rate back to annual I% given py and cy
 */
export function periodicRateToAnnual(iPeriod: number, py: number, cy: number): number {
  if (iPeriod === 0) return 0;
  if (py === cy) {
    return iPeriod * py * 100;
  }
  // (1 + r / cy) = (1 + i_period)^(py / cy)
  const rOverCy = Math.pow(1 + iPeriod, py / cy) - 1;
  return rOverCy * cy * 100;
}

/**
 * Calculates Future Value (FV)
 */
export function solveFV(params: TVMParams): number {
  const { set, n, i, pv, pmt, py, cy } = params;
  const rate = getPeriodicRate(i, py, cy);
  const s = set === 'Begin' ? 1 : 0;

  if (rate === 0) {
    return -(pv + pmt * n);
  }

  const factor = Math.pow(1 + rate, n);
  const annuityFactor = ((factor - 1) / rate) * (1 + rate * s);
  return -(pv * factor + pmt * annuityFactor);
}

/**
 * Calculates Present Value (PV)
 */
export function solvePV(params: TVMParams): number {
  const { set, n, i, pmt, fv, py, cy } = params;
  const rate = getPeriodicRate(i, py, cy);
  const s = set === 'Begin' ? 1 : 0;

  if (rate === 0) {
    return -(fv + pmt * n);
  }

  const factor = Math.pow(1 + rate, n);
  const annuityFactor = ((factor - 1) / rate) * (1 + rate * s);
  return -(fv + pmt * annuityFactor) / factor;
}

/**
 * Calculates Payment amount per period (PMT)
 */
export function solvePMT(params: TVMParams): number {
  const { set, n, i, pv, fv, py, cy } = params;
  const rate = getPeriodicRate(i, py, cy);
  const s = set === 'Begin' ? 1 : 0;

  if (rate === 0) {
    if (n === 0) throw new Error('מספר התקופות אינו יכול להיות 0');
    return -(pv + fv) / n;
  }

  const factor = Math.pow(1 + rate, n);
  const annuityFactor = ((factor - 1) / rate) * (1 + rate * s);
  return -(pv * factor + fv) / annuityFactor;
}

/**
 * Calculates Number of Periods (n)
 */
export function solveN(params: TVMParams): number {
  const { set, i, pv, pmt, fv, py, cy } = params;
  const rate = getPeriodicRate(i, py, cy);
  const s = set === 'Begin' ? 1 : 0;

  if (rate === 0) {
    if (pmt === 0) throw new Error('אין תשלום תקופתי (PMT = 0)');
    const res = -(pv + fv) / pmt;
    if (res <= 0) throw new Error('נתוני חישוב לא חוקיים עבור מספר תקופות');
    return res;
  }

  const annuityPre = (pmt * (1 + rate * s)) / rate;
  const num = annuityPre - fv;
  const den = pv + annuityPre;

  if (den === 0 || num / den <= 0) {
    throw new Error('לא ניתן לחשב n עם הנתונים הנוכחיים (אין מענה מתמטי)');
  }

  const nVal = Math.log(num / den) / Math.log(1 + rate);
  return nVal;
}

/**
 * Evaluates the net value function for finding interest rate
 */
function tvmEquation(rate: number, n: number, pv: number, pmt: number, fv: number, s: number): number {
  if (Math.abs(rate) < 1e-12) {
    return pv + pmt * n + fv;
  }
  const factor = Math.pow(1 + rate, n);
  const annuityFactor = ((factor - 1) / rate) * (1 + rate * s);
  return pv * factor + pmt * annuityFactor + fv;
}

/**
 * Solves for Annual Interest Rate (I%) using hybrid Brent/bisection method
 */
export function solveI(params: TVMParams): number {
  const { set, n, pv, pmt, fv, py, cy } = params;
  const s = set === 'Begin' ? 1 : 0;

  if (n <= 0) throw new Error('מספר התקופות חייב להיות גדול מאפס');

  // Check if i = 0 is a solution
  const val0 = tvmEquation(0, n, pv, pmt, fv, s);
  if (Math.abs(val0) < 1e-8) {
    return 0;
  }

  // Bounds for periodic rate: between -0.99 (-99%) and 10.0 (1000%)
  let low = -0.999;
  let high = 10.0;
  let fLow = tvmEquation(low, n, pv, pmt, fv, s);
  let fHigh = tvmEquation(high, n, pv, pmt, fv, s);

  if (fLow * fHigh > 0) {
    // Try wider or narrower bounds
    let step = 0.05;
    let found = false;
    let cur = -0.9;
    let prevVal = tvmEquation(cur, n, pv, pmt, fv, s);
    while (cur < 5.0) {
      cur += step;
      const curVal = tvmEquation(cur, n, pv, pmt, fv, s);
      if (prevVal * curVal <= 0) {
        low = cur - step;
        high = cur;
        found = true;
        break;
      }
      prevVal = curVal;
    }
    if (!found) {
      throw new Error('לא נמצא פתרון לריבית בתחום ההגיוני');
    }
  }

  // Bisection + Secant iteration
  let mid = (low + high) / 2;
  for (let iter = 0; iter < 120; iter++) {
    mid = (low + high) / 2;
    const fMid = tvmEquation(mid, n, pv, pmt, fv, s);
    if (Math.abs(fMid) < 1e-11 || (high - low) < 1e-11) {
      break;
    }
    if (fLow * fMid < 0) {
      high = mid;
    } else {
      low = mid;
      fLow = fMid;
    }
  }

  return periodicRateToAnnual(mid, py, cy);
}

