/**
 * Date and Day Calculation Engine for Casio FC-200V (DAYS Mode)
 * Supports:
 * - Actual/365 and 30/360 day conventions
 * - Parsing Casio format YYYY.MMDD (e.g. 2026.1109 = 9 Nov 2026)
 */

export type DayBasis = '365' | '360';

export interface DaysParams {
  d1: string; // "YYYY.MMDD"
  d2: string; // "YYYY.MMDD"
  basis: DayBasis;
}

export function parseCasioDate(dStr: string): { year: number; month: number; day: number; date: Date } {
  // Allow format YYYY.MMDD, YYYY-MM-DD or YYYYMMDD
  const clean = dStr.trim();
  let y = 2026, m = 1, d = 1;

  if (clean.includes('.')) {
    const parts = clean.split('.');
    y = parseInt(parts[0], 10) || 2026;
    const decimalPart = parts[1] || '0101';
    m = parseInt(decimalPart.slice(0, 2), 10) || 1;
    d = parseInt(decimalPart.slice(2, 4), 10) || 1;
  } else if (clean.includes('-')) {
    const parts = clean.split('-');
    y = parseInt(parts[0], 10) || 2026;
    m = parseInt(parts[1], 10) || 1;
    d = parseInt(parts[2], 10) || 1;
  } else if (clean.length === 8) {
    y = parseInt(clean.slice(0, 4), 10);
    m = parseInt(clean.slice(4, 6), 10);
    d = parseInt(clean.slice(6, 8), 10);
  }

  // Month is 0-indexed in JS Date
  const dateObj = new Date(Date.UTC(y, m - 1, d));
  return { year: y, month: m, day: d, date: dateObj };
}

export function formatCasioDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}.${m}${d}`;
}

export function calculateDaysBetween(d1Str: string, d2Str: string, basis: DayBasis = '365'): number {
  const p1 = parseCasioDate(d1Str);
  const p2 = parseCasioDate(d2Str);

  if (basis === '365') {
    // Actual days
    const diffMs = p2.date.getTime() - p1.date.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  } else {
    // 30/360 US/NASD convention
    let d1Day = p1.day;
    let d2Day = p2.day;

    if (d1Day === 31) d1Day = 30;
    if (d2Day === 31 && d1Day >= 30) d2Day = 30;

    return (p2.year - p1.year) * 360 + (p2.month - p1.month) * 30 + (d2Day - d1Day);
  }
}

export function addDaysToDate(d1Str: string, days: number): string {
  const p1 = parseCasioDate(d1Str);
  const targetTime = p1.date.getTime() + days * (1000 * 60 * 60 * 24);
  return formatCasioDate(new Date(targetTime));
}
