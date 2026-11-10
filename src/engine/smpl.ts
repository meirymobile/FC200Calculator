/**
 * Simple Interest Calculation Engine for Casio FC-200V (SMPL Mode)
 * Parameters:
 *   set: Basis - '365' (Actual/365) or '360' (30/360)
 *   dys: Number of days
 *   i:   Annual interest rate in percent (e.g. 5%)
 *   pv:  Present value / Principal (e.g. -100000)
 *   si:  Simple interest amount
 *   sfv: Simple future value (-(PV + SI))
 */

export interface SMPLParams {
  set: '365' | '360';
  dys: number;
  i: number;
  pv: number;
  si?: number;
  sfv?: number;
}

export function solveSMPLInterest(p: SMPLParams): number {
  const basis = p.set === '360' ? 360 : 365;
  const pvAbs = Math.abs(p.pv);
  const interest = (pvAbs * p.dys * (p.i / 100)) / basis;
  return interest;
}

export function solveSMPLFutureValue(p: SMPLParams): number {
  const interest = solveSMPLInterest(p);
  const pvAbs = Math.abs(p.pv);
  return -(pvAbs + interest);
}

export function solveSMPLPrincipal(dys: number, i: number, si: number, basis: '365' | '360' = '365'): number {
  const b = basis === '360' ? 360 : 365;
  if (dys === 0 || i === 0) throw new Error('Days and interest rate must be non-zero');
  const pv = (si * b) / (dys * (i / 100));
  return -pv;
}

export function solveSMPLRate(dys: number, pv: number, si: number, basis: '365' | '360' = '365'): number {
  const b = basis === '360' ? 360 : 365;
  const pvAbs = Math.abs(pv);
  if (dys === 0 || pvAbs === 0) throw new Error('Days and principal must be non-zero');
  return ((si * b) / (pvAbs * dys)) * 100;
}

export function solveSMPLDays(pv: number, i: number, si: number, basis: '365' | '360' = '365'): number {
  const b = basis === '360' ? 360 : 365;
  const pvAbs = Math.abs(pv);
  if (pvAbs === 0 || i === 0) throw new Error('Principal and interest rate must be non-zero');
  return Math.round((si * b) / (pvAbs * (i / 100)));
}

