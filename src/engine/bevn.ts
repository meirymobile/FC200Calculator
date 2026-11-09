/**
 * Break-Even Analysis Engine for Casio FC-200V (BEVN Mode)
 * Parameters:
 *   PRC: Selling Price per unit
 *   VC:  Variable Cost per unit
 *   FC:  Fixed Costs
 *   Q:   Sales Quantity / Units
 *   PRF: Profit
 */

export interface BEVNParams {
  prc: number; // Unit Price
  vc: number;  // Variable Cost per unit
  fc: number;  // Fixed Cost
  q: number;   // Quantity
  prf: number; // Profit
}

export function solveBEVNProfit(p: BEVNParams): number {
  return p.q * (p.prc - p.vc) - p.fc;
}

export function solveBEVNQuantity(p: BEVNParams): number {
  const marginPerUnit = p.prc - p.vc;
  if (marginPerUnit === 0) {
    throw new Error('Margin per unit is zero (PRC = VC)');
  }
  return (p.fc + p.prf) / marginPerUnit;
}

export function solveBEVNPrice(p: BEVNParams): number {
  if (p.q === 0) throw new Error('Quantity cannot be zero');
  return p.vc + (p.fc + p.prf) / p.q;
}

export function solveBEVNVariableCost(p: BEVNParams): number {
  if (p.q === 0) throw new Error('Quantity cannot be zero');
  return p.prc - (p.fc + p.prf) / p.q;
}

export function solveBEVNFixedCost(p: BEVNParams): number {
  return p.q * (p.prc - p.vc) - p.prf;
}

export function calculateBreakEvenPoint(p: BEVNParams): { bepUnits: number; bepSales: number } {
  const marginPerUnit = p.prc - p.vc;
  if (marginPerUnit <= 0) {
    return { bepUnits: 0, bepSales: 0 };
  }
  const bepUnits = p.fc / marginPerUnit;
  const bepSales = bepUnits * p.prc;
  return { bepUnits, bepSales };
}
