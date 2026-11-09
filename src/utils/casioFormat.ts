/**
 * Casio FC-200V Authentic LCD Display Number Formatter
 * Provides full 10-digit mantissa display precision filling the screen,
 * exactly like the authentic Casio 10+2 digit LCD display.
 */
export function formatCasioLCD(val: number | string | null | undefined): string {
  if (val === null || val === undefined || val === '') return '0';
  if (typeof val === 'string') {
    // If it's already a non-numeric label like 'Begin', 'End', 'ERROR', return it
    if (isNaN(Number(val))) return val;
    val = Number(val);
  }

  if (isNaN(val) || !isFinite(val)) return 'Math ERROR';
  if (val === 0) return '0';

  const abs = Math.abs(val);

  // If number exceeds 10 digits or is extremely small, use 10+2 scientific exponent notation
  if (abs >= 1e10 || (abs < 1e-4 && abs > 0)) {
    const expStr = val.toExponential(7); // e.g. "1.2345678e+12"
    const [mantissa, exponent] = expStr.split('e');
    const expNum = parseInt(exponent, 10);
    const sign = expNum >= 0 ? '+' : '';
    return `${mantissa} ${sign}${expNum}`;
  }

  // Display up to 10 significant digits
  let formatted = val.toPrecision(10);

  // Remove scientific notation if toPrecision produced it within normal range
  if (formatted.includes('e')) {
    formatted = Number(val).toFixed(9);
  }

  // Clean trailing decimal zeros while preserving precision
  if (formatted.includes('.')) {
    formatted = formatted.replace(/0+$/, '').replace(/\.$/, '');
  }

  return formatted;
}
