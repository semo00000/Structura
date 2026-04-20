import { z } from "zod";

// ─────────────────────────────────────────────
// Document Line Schema
// ─────────────────────────────────────────────
export const documentLineSchema = z.object({
  productId: z.string().optional(),
  description: z.string().min(1, "Description requise"),
  quantity: z.number().min(1, "Min. 1"),
  unitPriceHT: z.number().min(0, "Prix invalide"),
  tvaRate: z.number().min(0).max(1),
  unit: z.string().min(1, "Unité requise"),
});

export type DocumentLineFormValues = z.infer<typeof documentLineSchema>;

// ─────────────────────────────────────────────
// Full Document Schema
// ─────────────────────────────────────────────
export const documentSchema = z.object({
  type: z.enum(["DEVIS", "FACTURE", "BON_LIVRAISON", "BON_COMMANDE", "AVOIR"]),
  contactId: z.string().min(1, "Veuillez sélectionner un client"),
  date: z.string().min(1, "Date requise"),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
  footer: z.string().optional(),
  lines: z.array(documentLineSchema).min(1, "Ajoutez au moins une ligne"),
});

export type DocumentFormValues = z.infer<typeof documentSchema>;

// ─────────────────────────────────────────────
// TVA Options for Morocco
// ─────────────────────────────────────────────
export const TVA_OPTIONS = [
  { label: "20%", value: 0.20 },
  { label: "14%", value: 0.14 },
  { label: "10%", value: 0.10 },
  { label: "7%", value: 0.07 },
  { label: "0%", value: 0.00 },
] as const;

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
export function computeLineTotals(line: {
  quantity: number;
  unitPriceHT: number;
  tvaRate: number;
}) {
  const totalHT = line.quantity * line.unitPriceHT;
  const totalTVA = totalHT * line.tvaRate;
  const totalTTC = totalHT + totalTVA;
  return { totalHT, totalTVA, totalTTC };
}

export function computeDocumentTotals(
  lines: Array<{ quantity: number; unitPriceHT: number; tvaRate: number }>
) {
  let totalHT = 0;
  let totalTVA = 0;

  for (const line of lines) {
    const lt = computeLineTotals(line);
    totalHT += lt.totalHT;
    totalTVA += lt.totalTVA;
  }

  return { totalHT, totalTVA, totalTTC: totalHT + totalTVA };
}

// ─────────────────────────────────────────────
// Currency Formatter (MAD)
// ─────────────────────────────────────────────
export function formatMAD(amount: number): string {
  return new Intl.NumberFormat("fr-MA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ─────────────────────────────────────────────
// Default empty line
// ─────────────────────────────────────────────
export const EMPTY_LINE: DocumentLineFormValues = {
  productId: "",
  description: "",
  quantity: 1,
  unitPriceHT: 0,
  tvaRate: 0.20,
  unit: "unité",
};
