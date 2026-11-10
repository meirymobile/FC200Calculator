/**
 * Depreciation Calculation Engine for Casio FC-200V (DEPR Mode)
 * Supports SL (Straight-Line), SYD (Sum-of-the-Years'-Digits), DB (Declining Balance)
 */

export type DepreciationMethod = 'SL' | 'SYD' | 'DB';

export interface DepreciationParams {
  method: DepreciationMethod;
  n: number;   // Useful life in years
  cst: number; // Initial Cost
  sal: number; // Salvage Value
  j: number;   // Target year for calculation (1 <= j <= n)
  dbFactor?: number; // DB factor (default 2 for double declining)
}

export interface DepreciationResult {
  dpj: number; // Depreciation amount in year j
  rdv: number; // Remaining Depreciable Value at end of year j (Book Value)
  acc: number; // Accumulated Depreciation up to year j
}

export function calculateDepreciation(p: DepreciationParams): DepreciationResult {
  const n = Math.max(1, Math.round(p.n));
  const j = Math.max(1, Math.min(n, Math.round(p.j)));
  const cst = Math.max(0, p.cst);
  const sal = Math.max(0, Math.min(cst, p.sal));

  if (p.method === 'SL') {
    const annualDepr = (cst - sal) / n;
    const dpj = annualDepr;
    const acc = Math.min(annualDepr * j, cst - sal);
    const rdv = cst - acc;
    return { dpj, rdv, acc };
  }

  if (p.method === 'SYD') {
    const denom = (n * (n + 1)) / 2;
    let acc = 0;
    let dpj = 0;

    for (let yr = 1; yr <= j; yr++) {
      const yrDepr = (cst - sal) * ((n - yr + 1) / denom);
      if (yr === j) {
        dpj = yrDepr;
      }
      acc += yrDepr;
    }

    acc = Math.min(acc, cst - sal);
    const rdv = cst - acc;
    return { dpj, rdv, acc };
  }

  // Declining Balance (DB)
  const factor = p.dbFactor || 2.0; // standard double declining balance
  const rate = Math.min(1, factor / n);
  let bookValue = cst;
  let acc = 0;
  let dpj = 0;

  for (let yr = 1; yr <= j; yr++) {
    let yrDepr = bookValue * rate;
    if (bookValue - yrDepr < sal) {
      yrDepr = Math.max(0, bookValue - sal);
    }
    if (yr === j) {
      dpj = yrDepr;
    }
    bookValue -= yrDepr;
    acc += yrDepr;
  }

  return { dpj, rdv: bookValue, acc };
}

