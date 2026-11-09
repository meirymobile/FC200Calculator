import { InterestConversionParams } from '../types/calculator';

/**
 * Calculates Effective Rate (EFF) from Nominal Rate (APR) and periods per year (n)
 * EFF = (1 + APR / (100 * n))^n - 1
 */
export function aprToEff(apr: number, n: number): number {
  if (n <= 0) throw new Error('מספר תקופות בשנה (n) חייב להיות גדול מ-0');
  const effDecimal = Math.pow(1 + (apr / 100) / n, n) - 1;
  return Number((effDecimal * 100).toFixed(4));
}

/**
 * Calculates Nominal Rate (APR) from Effective Rate (EFF) and periods per year (n)
 * APR = n * ((1 + EFF / 100)^(1/n) - 1) * 100
 */
export function effToApr(eff: number, n: number): number {
  if (n <= 0) throw new Error('מספר תקופות בשנה (n) חייב להיות גדול מ-0');
  const effDec = eff / 100;
  if (effDec <= -1) throw new Error('ריבית אפקטיבית אינה יכולה להיות קטנה ממינוס 100%');
  const aprDecimal = n * (Math.pow(1 + effDec, 1 / n) - 1);
  return Number((aprDecimal * 100).toFixed(4));
}
