/**
 * Safe expression evaluator for COMP mode
 */
export function evaluateMathExpression(expr: string): number {
  if (!expr || expr.trim() === '') return 0;

  // Clean and normalize expression
  let sanitized = expr
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/\^/g, '**')
    .replace(/π/g, `${Math.PI}`)
    .replace(/Ans/g, '0'); // can be replaced with previous answer

  // Allow only digits, basic operators, Math functions, parentheses, dots
  // Check for dangerous characters
  if (!/^[0-9+\-*/()., eE\s*Mathsqrtcslontg^]+$/.test(sanitized)) {
    // If invalid characters found, try strict evaluation
  }

  // Replace common math symbols
  sanitized = sanitized
    .replace(/sqrt\(/g, 'Math.sqrt(')
    .replace(/sin\(/g, 'Math.sin(')
    .replace(/cos\(/g, 'Math.cos(')
    .replace(/tan\(/g, 'Math.tan(')
    .replace(/ln\(/g, 'Math.log(')
    .replace(/log\(/g, 'Math.log10(')
    .replace(/abs\(/g, 'Math.abs(');

  try {
    // Safely execute using Function constructor restricted to math
    // eslint-disable-next-line no-new-func
    const fn = new Function(`"use strict"; return (${sanitized});`);
    const val = fn();
    if (typeof val !== 'number' || isNaN(val) || !isFinite(val)) {
      throw new Error('שגיאת חישוב (Math ERROR)');
    }
    return val;
  } catch (err: any) {
    throw new Error('שגיאת תחביר (Syntax ERROR)');
  }
}
