// ═══════════════════════════════════════════════════════════════
// Moroccan Business Logic Formulas
// Based on CORFIT ERP PRD — B2B Wholesale Morocco
// ═══════════════════════════════════════════════════════════════

/**
 * Extract TVA from a TTC (tax-inclusive) amount.
 * Formula: amount × vatPct / (100 + vatPct)
 * Default VAT rate in Morocco: 20%
 */
export function tvaFromTTC(amountTTC: number, vatPct: number = 20): number {
  if (vatPct <= 0) return 0;
  return Math.round((amountTTC * vatPct) / (100 + vatPct) * 100) / 100;
}

/**
 * Compute HT (tax-exclusive) amount from TTC.
 * Formula: amountTTC / (1 + vatPct/100)
 */
export function htFromTTC(amountTTC: number, vatPct: number = 20): number {
  return Math.round((amountTTC / (1 + vatPct / 100)) * 100) / 100;
}

/**
 * Landed cost for an import purchase.
 * Formula: goods + freight + transit + (goods × customsPct / 100)
 */
export function landedCost(
  goods: number,
  freight: number,
  transit: number,
  customsPct: number
): number {
  return Math.round((goods + freight + transit + (goods * customsPct) / 100) * 100) / 100;
}

/**
 * Unit landed cost — divides total landed cost by quantity received.
 */
export function unitLandedCost(
  goods: number,
  freight: number,
  transit: number,
  customsPct: number,
  quantity: number
): number {
  if (quantity <= 0) return 0;
  return Math.round((landedCost(goods, freight, transit, customsPct) / quantity) * 100) / 100;
}

/**
 * Net salary calculation (Moroccan payroll).
 * Formula: base + primes - avances - round(base × 0.0448)
 * CNSS employee share = 4.48% of base salary
 */
export function netSalary(
  base: number,
  primes: number = 0,
  avances: number = 0
): number {
  const cnssDeduction = Math.round(base * 0.0448);
  return Math.round((base + primes - avances - cnssDeduction) * 100) / 100;
}

/**
 * CNSS employee share: 4.48% of base salary
 */
export function cnssEmployee(baseSalary: number): number {
  return Math.round(baseSalary * 0.0448 * 100) / 100;
}

/**
 * CNSS employer share: 21.48% of base salary
 */
export function cnssEmployer(baseSalary: number): number {
  return Math.round(baseSalary * 0.2148 * 100) / 100;
}

/**
 * Commercial commission: 2.5% of paid invoice total.
 */
export function commission(paidTotal: number, rate: number = 0.025): number {
  return Math.round(paidTotal * rate * 100) / 100;
}

/**
 * Moroccan TVA rates (official schedule).
 */
export const MOROCCAN_TVA_RATES = [
  { label: "20%", value: 0.20, description: "Taux normal" },
  { label: "14%", value: 0.14, description: "Transport, énergie" },
  { label: "10%", value: 0.10, description: "Hôtellerie, restauration" },
  { label: "7%",  value: 0.07, description: "Produits de base" },
  { label: "0%",  value: 0.00, description: "Exonéré" },
] as const;

/**
 * Format currency in Moroccan Dirhams (DH).
 */
export function formatDH(amount: number): string {
  return new Intl.NumberFormat("fr-MA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + " DH";
}
