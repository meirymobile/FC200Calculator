import { CashFlowParams, CashFlowResults } from '../types/calculator';

/**
 * Expands repeated cash flows into a flat array of periods [CF0, CF1, CF2, ...]
 */
export function expandCashFlows(params: CashFlowParams): number[] {
  const result: number[] = [params.cf0];
  for (const item of params.flows) {
    const freq = Math.max(1, Math.round(item.frequency || 1));
    for (let i = 0; i < freq; i++) {
      result.push(item.flow);
    }
  }
  return result;
}

/**
 * Calculates Net Present Value (NPV)
 */
export function calculateNPV(ratePercent: number, flows: number[]): number {
  const r = ratePercent / 100;
  let npv = 0;
  for (let t = 0; t < flows.length; t++) {
    npv += flows[t] / Math.pow(1 + r, t);
  }
  return npv;
}

/**
 * Derivative of NPV with respect to r (used for Newton-Raphson IRR)
 */
function npvDerivative(r: number, flows: number[]): number {
  let dNpv = 0;
  for (let t = 1; t < flows.length; t++) {
    dNpv -= (t * flows[t]) / Math.pow(1 + r, t + 1);
  }
  return dNpv;
}

/**
 * Calculates Internal Rate of Return (IRR) as a percentage
 */
export function calculateIRR(flows: number[]): number | null {
  // Check if there is at least one positive and one negative cash flow
  let hasPos = false;
  let hasNeg = false;
  for (const cf of flows) {
    if (cf > 0) hasPos = true;
    if (cf < 0) hasNeg = true;
    if (hasPos && hasNeg) break;
  }
  if (!hasPos || !hasNeg) return null;

  // Newton-Raphson with multiple starting points and bisection fallback
  const guesses = [0.1, 0.05, 0.2, 0.0, -0.2, 0.5];

  for (const guess of guesses) {
    let r = guess;
    for (let i = 0; i < 80; i++) {
      if (r <= -0.999) r = -0.99;
      const npvVal = calculateNPV(r * 100, flows);
      if (Math.abs(npvVal) < 1e-7) {
        return Number((r * 100).toFixed(4));
      }
      const dNpv = npvDerivative(r, flows);
      if (Math.abs(dNpv) < 1e-12) break;
      const nextR = r - npvVal / dNpv;
      if (Math.abs(nextR - r) < 1e-9) {
        return Number((nextR * 100).toFixed(4));
      }
      r = nextR;
    }
  }

  // Bisection search fallback between -99% and 1000%
  let low = -0.99;
  let high = 10.0;
  let fLow = calculateNPV(low * 100, flows);
  let fHigh = calculateNPV(high * 100, flows);

  if (fLow * fHigh > 0) {
    // Scan intervals
    let found = false;
    let step = 0.05;
    for (let scan = -0.95; scan <= 5.0; scan += step) {
      const v1 = calculateNPV(scan * 100, flows);
      const v2 = calculateNPV((scan + step) * 100, flows);
      if (v1 * v2 <= 0) {
        low = scan;
        high = scan + step;
        fLow = v1;
        fHigh = v2;
        found = true;
        break;
      }
    }
    if (!found) return null;
  }

  for (let iter = 0; iter < 100; iter++) {
    const mid = (low + high) / 2;
    const fMid = calculateNPV(mid * 100, flows);
    if (Math.abs(fMid) < 1e-8 || (high - low) < 1e-8) {
      return Number((mid * 100).toFixed(4));
    }
    if (fLow * fMid < 0) {
      high = mid;
    } else {
      low = mid;
      fLow = fMid;
    }
  }

  return Number((((low + high) / 2) * 100).toFixed(4));
}

/**
 * Calculates Payback Period (PBP)
 */
export function calculatePBP(flows: number[]): number | null {
  if (flows.length === 0) return null;
  let cum = flows[0];
  if (cum >= 0) return 0;

  for (let t = 1; t < flows.length; t++) {
    const nextCum = cum + flows[t];
    if (nextCum >= 0) {
      // Linear interpolation within period t
      const fraction = Math.abs(cum) / flows[t];
      return Number(((t - 1) + fraction).toFixed(2));
    }
    cum = nextCum;
  }

  return null; // Not recovered within given periods
}

/**
 * Calculates all Cash Flow results
 */
export function solveCashFlow(params: CashFlowParams): CashFlowResults {
  const flatFlows = expandCashFlows(params);
  const npv = calculateNPV(params.rate, flatFlows);
  const irr = calculateIRR(flatFlows);
  const pbp = calculatePBP(flatFlows);
  const r = params.rate / 100;
  const nfv = npv * Math.pow(1 + r, flatFlows.length - 1);

  return {
    npv: Number(npv.toFixed(2)),
    irr,
    pbp,
    nfv: Number(nfv.toFixed(2)),
  };
}

