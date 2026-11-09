/**
 * Advanced scientific expression evaluator for COMP mode matching Casio FC-200V
 */

// Factorial calculation n!
export function factorial(n: number): number {
  if (n < 0 || !Number.isInteger(n)) throw new Error('שגיאת תחום (Math ERROR)');
  if (n === 0 || n === 1) return 1;
  if (n > 170) return Infinity;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

// Permutations nPr = n! / (n - r)!
export function nPr(n: number, r: number): number {
  if (n < 0 || r < 0 || r > n || !Number.isInteger(n) || !Number.isInteger(r)) {
    throw new Error('שגיאת תחום (Math ERROR)');
  }
  return factorial(n) / factorial(n - r);
}

// Combinations nCr = n! / (r! * (n - r)!)
export function nCr(n: number, r: number): number {
  if (n < 0 || r < 0 || r > n || !Number.isInteger(n) || !Number.isInteger(r)) {
    throw new Error('שגיאת תחום (Math ERROR)');
  }
  return factorial(n) / (factorial(r) * factorial(n - r));
}

export interface EvalContext {
  angleUnit: 'DEG' | 'RAD';
  ans: number;
  memory: Record<string, number>;
}

export const defaultContext: EvalContext = {
  angleUnit: 'DEG',
  ans: 0,
  memory: { A: 0, B: 0, C: 0, D: 0, X: 0, Y: 0, M: 0 },
};

export function evaluateMathExpression(
  expr: string,
  context: EvalContext = defaultContext
): number {
  if (!expr || expr.trim() === '') return 0;

  let sanitized = expr
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/Ans/g, `(${context.ans})`)
    .replace(/π/g, `(${Math.PI})`)
    .replace(/EXP/g, '*10^')
    .replace(/e\b/g, `(${Math.E})`);

  // Replace memory variables A, B, C, D, X, Y, M
  for (const [varName, varVal] of Object.entries(context.memory)) {
    const reg = new RegExp(`\\b${varName}\\b`, 'g');
    sanitized = sanitized.replace(reg, `(${varVal})`);
  }

  // Handle factorials x!
  sanitized = sanitized.replace(/(\d+(?:\.\d+)?|\([^()]+\))!/g, 'fact($1)');

  // Handle powers ^
  sanitized = sanitized.replace(/\^/g, '**');

  // Handle degree/radian trigonometric conversions
  const isDeg = context.angleUnit === 'DEG';
  const toRad = isDeg ? `*(Math.PI/180)` : '';
  const fromRad = isDeg ? `*(180/Math.PI)` : '';

  // Standard math replacements
  sanitized = sanitized
    .replace(/sin\(/g, `Math.sin(`)
    .replace(/cos\(/g, `Math.cos(`)
    .replace(/tan\(/g, `Math.tan(`)
    .replace(/asin\(/g, `Math.asin(`)
    .replace(/acos\(/g, `Math.acos(`)
    .replace(/atan\(/g, `Math.atan(`)
    .replace(/sinh\(/g, `Math.sinh(`)
    .replace(/cosh\(/g, `Math.cosh(`)
    .replace(/tanh\(/g, `Math.tanh(`)
    .replace(/sqrt\(/g, `Math.sqrt(`)
    .replace(/cbrt\(/g, `Math.cbrt(`)
    .replace(/ln\(/g, `Math.log(`)
    .replace(/log\(/g, `Math.log10(`)
    .replace(/abs\(/g, `Math.abs(`);

  // If DEG mode, wrap trig arguments
  if (isDeg) {
    sanitized = sanitized
      .replace(/Math\.sin\(([^)]+)\)/g, `Math.sin(($1)${toRad})`)
      .replace(/Math\.cos\(([^)]+)\)/g, `Math.cos(($1)${toRad})`)
      .replace(/Math\.tan\(([^)]+)\)/g, `Math.tan(($1)${toRad})`)
      .replace(/Math\.asin\(([^)]+)\)/g, `(Math.asin($1)${fromRad})`)
      .replace(/Math\.acos\(([^)]+)\)/g, `(Math.acos($1)${fromRad})`)
      .replace(/Math\.atan\(([^)]+)\)/g, `(Math.atan($1)${fromRad})`);
  }

  try {
    // eslint-disable-next-line no-new-func
    const evaluator = new Function(
      'fact',
      'nPr',
      'nCr',
      `"use strict"; return (${sanitized});`
    );
    const result = evaluator(factorial, nPr, nCr);

    if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
      throw new Error('שגיאת חישוב (Math ERROR)');
    }
    return result;
  } catch (err: any) {
    if (err.message?.includes('Math ERROR')) throw err;
    throw new Error('שגיאת תחביר (Syntax ERROR)');
  }
}
