/**
 * Statistics Engine for Casio FC-200V (STAT Mode)
 * Supports 1-Variable Statistics and 2-Variable Linear Regression
 */

export interface StatDataPoint {
  x: number;
  y?: number;
  freq?: number;
}

export interface Stat1VarResults {
  n: number;
  mean: number;       // x̄
  sumX: number;       // Σx
  sumX2: number;      // Σx²
  sigmaX: number;     // σx (population standard deviation)
  sx: number;         // sx (sample standard deviation)
  minX: number;
  maxX: number;
}

export interface Stat2VarResults extends Stat1VarResults {
  meanY: number;      // ȳ
  sumY: number;       // Σy
  sumY2: number;      // Σy²
  sumXY: number;      // Σxy
  sigmaY: number;     // σy
  sy: number;         // sy
  a: number;          // Regression intercept: y = a + bx
  b: number;          // Regression slope
  r: number;          // Correlation coefficient
}

export function calculate1VarStats(values: number[]): Stat1VarResults {
  if (values.length === 0) {
    return { n: 0, mean: 0, sumX: 0, sumX2: 0, sigmaX: 0, sx: 0, minX: 0, maxX: 0 };
  }

  const n = values.length;
  let sumX = 0;
  let sumX2 = 0;
  let minX = values[0];
  let maxX = values[0];

  for (const v of values) {
    sumX += v;
    sumX2 += v * v;
    if (v < minX) minX = v;
    if (v > maxX) maxX = v;
  }

  const mean = sumX / n;
  const variancePop = Math.max(0, (sumX2 - (sumX * sumX) / n) / n);
  const sigmaX = Math.sqrt(variancePop);
  const varianceSample = n > 1 ? Math.max(0, (sumX2 - (sumX * sumX) / n) / (n - 1)) : 0;
  const sx = Math.sqrt(varianceSample);

  return { n, mean, sumX, sumX2, sigmaX, sx, minX, maxX };
}

export function calculate2VarStats(pairs: { x: number; y: number }[]): Stat2VarResults {
  const xVals = pairs.map((p) => p.x);
  const base1 = calculate1VarStats(xVals);

  if (pairs.length === 0) {
    return {
      ...base1,
      meanY: 0,
      sumY: 0,
      sumY2: 0,
      sumXY: 0,
      sigmaY: 0,
      sy: 0,
      a: 0,
      b: 0,
      r: 0,
    };
  }

  const n = pairs.length;
  let sumY = 0;
  let sumY2 = 0;
  let sumXY = 0;

  for (const p of pairs) {
    sumY += p.y;
    sumY2 += p.y * p.y;
    sumXY += p.x * p.y;
  }

  const meanY = sumY / n;
  const varYPop = Math.max(0, (sumY2 - (sumY * sumY) / n) / n);
  const sigmaY = Math.sqrt(varYPop);
  const varYSample = n > 1 ? Math.max(0, (sumY2 - (sumY * sumY) / n) / (n - 1)) : 0;
  const sy = Math.sqrt(varYSample);

  const denomX = n * base1.sumX2 - base1.sumX * base1.sumX;
  const denomY = n * sumY2 - sumY * sumY;
  const numer = n * sumXY - base1.sumX * sumY;

  let b = 0;
  let a = 0;
  let r = 0;

  if (denomX !== 0) {
    b = numer / denomX;
    a = meanY - b * base1.mean;
  }

  if (denomX > 0 && denomY > 0) {
    r = numer / Math.sqrt(denomX * denomY);
  }

  return {
    ...base1,
    meanY,
    sumY,
    sumY2,
    sumXY,
    sigmaY,
    sy,
    a,
    b,
    r,
  };
}
