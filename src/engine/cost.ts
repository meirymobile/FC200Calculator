import { CostSellMarginParams } from '../types/calculator';

export function solveMargin(cost: number, sell: number): number {
  if (sell === 0) throw new Error('מחיר המכירה אינו יכול להיות 0');
  const mar = ((sell - cost) / sell) * 100;
  return Number(mar.toFixed(4));
}

export function solveSell(cost: number, margin: number): number {
  if (margin >= 100) throw new Error('שולי הרווח חייבים להיות נמוכים מ-100%');
  const sell = cost / (1 - margin / 100);
  return Number(sell.toFixed(4));
}

export function solveCost(sell: number, margin: number): number {
  const cost = sell * (1 - margin / 100);
  return Number(cost.toFixed(4));
}

