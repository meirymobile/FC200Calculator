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
    .replace(/\bAns\b/g, `(${context.ans})`)
    .replace(/π/g, `(${Math.PI})`)
    .replace(/EXP/g, '*10^')
    .replace(/\be\b/g, `(${Math.E})`);

  // Replace memory variables A, B, C, D, X, Y, M
  if (context.memory) {
    for (const [varName, varVal] of Object.entries(context.memory)) {
      const reg = new RegExp(`\\b${varName}\\b`, 'g');
      sanitized = sanitized.replace(reg, `(${varVal})`);
    }
  }

  // Handle factorials x!
  sanitized = sanitized.replace(/(\d+(?:\.\d+)?|\([^()]+\))!/g, 'fact($1)');

  // Handle powers ^
  sanitized = sanitized.replace(/\^/g, '**');

  // Degree/Radian settings
  const isDeg = context.angleUnit === 'DEG';
  const toRad = isDeg ? `*(Math.PI/180)` : '';
  const fromRad = isDeg ? `*(180/Math.PI)` : '';

  // Safe token replacement to prevent collision (e.g. log matching inside Math.log from ln)
  sanitized = sanitized
    .replace(/\basin\(/g, '__ASIN__(')
    .replace(/\bacos\(/g, '__ACOS__(')
    .replace(/\batan\(/g, '__ATAN__(')
    .replace(/\bsinh\(/g, '__SINH__(')
    .replace(/\bcosh\(/g, '__COSH__(')
    .replace(/\btanh\(/g, '__TANH__(')
    .replace(/\bsin\(/g, '__SIN__(')
    .replace(/\bcos\(/g, '__COS__(')
    .replace(/\btan\(/g, '__TAN__(')
    .replace(/\bsqrt\(/g, '__SQRT__(')
    .replace(/\bcbrt\(/g, '__CBRT__(')
    .replace(/\bln\(/g, '__LN__(')
    .replace(/\blog\(/g, '__LOG__(')
    .replace(/\babs\(/g, '__ABS__(');

  // Convert tokens to final Math calls
  if (isDeg) {
    sanitized = sanitized
      .replace(/__SIN__\(([^)]+)\)/g, `Math.sin(($1)${toRad})`)
      .replace(/__COS__\(([^)]+)\)/g, `Math.cos(($1)${toRad})`)
      .replace(/__TAN__\(([^)]+)\)/g, `Math.tan(($1)${toRad})`)
      .replace(/__ASIN__\(([^)]+)\)/g, `(Math.asin($1)${fromRad})`)
      .replace(/__ACOS__\(([^)]+)\)/g, `(Math.acos($1)${fromRad})`)
      .replace(/__ATAN__\(([^)]+)\)/g, `(Math.atan($1)${fromRad})`);
  } else {
    sanitized = sanitized
      .replace(/__SIN__\(/g, 'Math.sin(')
      .replace(/__COS__\(/g, 'Math.cos(')
      .replace(/__TAN__\(/g, 'Math.tan(')
      .replace(/__ASIN__\(/g, 'Math.asin(')
      .replace(/__ACOS__\(/g, 'Math.acos(')
      .replace(/__ATAN__\(/g, 'Math.atan(');
  }

  sanitized = sanitized
    .replace(/__SINH__\(/g, 'Math.sinh(')
    .replace(/__COSH__\(/g, 'Math.cosh(')
    .replace(/__TANH__\(/g, 'Math.tanh(')
    .replace(/__SQRT__\(/g, 'Math.sqrt(')
    .replace(/__CBRT__\(/g, 'Math.cbrt(')
    .replace(/__LN__\(/g, 'Math.log(')
    .replace(/__LOG__\(/g, 'Math.log10(')
    .replace(/__ABS__\(/g, 'Math.abs(');

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
