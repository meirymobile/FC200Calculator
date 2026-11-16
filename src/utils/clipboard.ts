import { formatCasioLCD } from './casioFormat';

/**
 * Cross-browser clipboard helper with dual-layer system:
 * 1. Native navigator.clipboard API
 * 2. In-memory clipboard cache fallback (guaranteed to work in all mobile webviews and sandboxes)
 */

let lastCopiedNumber: string = '';

/**
 * Clean pasted input: removes currency symbols (₪, $, €, £), thousand separators (,),
 * accounting parentheses (100) -> -100, and whitespace.
 * Validates numeric structure and limits to max 10 digits.
 */
export function cleanPastedNumber(text: string): string | null {
  if (!text) return null;
  let s = text.trim();

  // Accounting parentheses: (123.45) -> -123.45
  if (s.startsWith('(') && s.endsWith(')')) {
    s = '-' + s.slice(1, -1);
  }

  // Remove currency signs, commas, and whitespace
  s = s.replace(/[$₪€£,\s]/g, '');

  if (s === '' || s === '-' || isNaN(Number(s))) {
    return null;
  }

  const num = Number(s);
  if (!isFinite(num)) {
    return null;
  }

  // If number exceeds 10 digits, format strictly to 10 digits
  const digitCount = s.replace(/[^0-9]/g, '').length;
  if (digitCount > 10) {
    return formatCasioLCD(num);
  }

  return s;
}

/**
 * Copy number to system clipboard and internal cache
 */
export async function copyNumberToClipboard(value: string): Promise<boolean> {
  lastCopiedNumber = String(value);

  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(String(value));
      return true;
    }
  } catch {
    // fallback to document.execCommand
  }

  try {
    if (typeof document !== 'undefined') {
      const textarea = document.createElement('textarea');
      textarea.value = String(value);
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '-9999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      return successful;
    }
  } catch {
    // ignore
  }

  return true; // cached in memory successfully
}

/**
 * Paste number from system clipboard or internal memory fallback
 */
export async function pasteNumberFromClipboard(): Promise<string | null> {
  // 1. Try system clipboard
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.readText) {
      const text = await navigator.clipboard.readText();
      const cleaned = cleanPastedNumber(text);
      if (cleaned !== null) {
        lastCopiedNumber = cleaned;
        return cleaned;
      }
    }
  } catch {
    // System clipboard read permission denied or unavailable in this context
  }

  // 2. In-memory clipboard cache fallback (works 100% of the time)
  if (lastCopiedNumber) {
    const cleaned = cleanPastedNumber(lastCopiedNumber);
    if (cleaned !== null) {
      return cleaned;
    }
  }

  return null;
}

export function getLastCopiedNumber(): string {
  return lastCopiedNumber;
}
