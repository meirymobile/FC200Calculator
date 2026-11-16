/**
 * Casio FC-200V Authentic LCD Display Number Formatter
 * Strict 10-digit maximum display precision matching physical Casio 10+2 LCD.
 * Never exceeds 10 digits to prevent crowding or touching function labels.
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

  const isNeg = val < 0;
  const abs = Math.abs(val);

  // If number >= 10^10 or < 10^-3, use compact scientific notation matching Casio 10+2 LCD
  if (abs >= 1e10 || (abs < 1e-3 && abs > 0)) {
    const expStr = abs.toExponential(5);
    const [mantissa, exponent] = expStr.split('e');
    const expNum = parseInt(exponent, 10);
    const sign = expNum >= 0 ? '+' : '';
    const cleanMantissa = mantissa.replace(/\.?0+$/, '');
    const prefix = isNeg ? '-' : '';
    return `${prefix}${cleanMantissa} ${sign}${expNum}`;
  }

  // Determine number of integer digits
  const intPart = Math.floor(abs);
  const intDigits = intPart === 0 ? 1 : intPart.toString().length;

  // Maximum decimal places to ensure total digits <= 10
  const maxDecimals = Math.max(0, 10 - intDigits);

  let formatted = abs.toFixed(maxDecimals);
  // Clean trailing decimal zeros and trailing dot
  if (formatted.includes('.')) {
    formatted = formatted.replace(/0+$/, '').replace(/\.$/, '');
  }

  return (isNeg ? '-' : '') + formatted;
}
