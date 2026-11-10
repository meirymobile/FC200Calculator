/**
 * Bond Pricing and Yield Engine for Casio FC-200V (BOND Mode)
 * Parameters:
 *   c/f (set): 1 (Annual coupon) or 2 (Semi-annual coupon)
 *   d1:  Purchase / Settlement Date (YYYY.MMDD)
 *   d2:  Redemption / Maturity Date (YYYY.MMDD)
 *   rdv: Redemption Value (per 100 par, default 100)
 *   cpn: Annual Coupon rate in percent (e.g. 5%)
 *   yld: Annual Yield to Maturity in percent (e.g. 6%)
 *   prc: Bond clean price
 */

import { calculateDaysBetween } from './days';

export interface BondParams {
  couponsPerYear: 1 | 2;
  d1: string;
  d2: string;
  rdv: number;
  cpn: number;
  yld: number;
  prc: number;
}

export function solveBondPrice(p: BondParams): number {
  const m = p.couponsPerYear;
  const days = Math.max(1, calculateDaysBetween(p.d1, p.d2, '365'));
  const years = days / 365.25;
  const n = Math.max(1, Math.round(years * m));
  const periodicYield = (p.yld / 100) / m;
  const periodicCoupon = (p.cpn / m);

  if (periodicYield === 0) {
    return periodicCoupon * n + p.rdv;
  }

  // Annuity factor for coupon stream
  const pvFactor = Math.pow(1 + periodicYield, -n);
  const couponPV = periodicCoupon * ((1 - pvFactor) / periodicYield);
  const redemptionPV = p.rdv * pvFactor;

  return couponPV + redemptionPV;
}

export function solveBondYield(p: BondParams): number {
  const targetPrice = p.prc;
  if (targetPrice <= 0) throw new Error('Price must be positive');

  // Bisection solver for Yield to Maturity (0% to 200%)
  let low = 0.0001;
  let high = 200.0;
  let bestYield = 0;

  for (let iter = 0; iter < 100; iter++) {
    const mid = (low + high) / 2;
    const estPrice = solveBondPrice({ ...p, yld: mid });

    if (Math.abs(estPrice - targetPrice) < 1e-7) {
      return mid;
    }

    if (estPrice > targetPrice) {
      low = mid;
    } else {
      high = mid;
    }
    bestYield = mid;
  }

  return bestYield;
}

