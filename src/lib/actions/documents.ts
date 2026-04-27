"use server";

// Server Actions for Commercial Documents (Factures, Devis, etc.)
// These will persist to the database.

import { revalidatePath } from "next/cache";
import { documentSchema } from "@/lib/validations/document";
import { computeLineTotals, computeDocumentTotals } from "@/lib/validations/document";

// ─────────────────────────────────────────────
// Generate document number (temporary — will be DB sequence)
// ─────────────────────────────────────────────
function generateDocumentNumber(
  type: "DEVIS" | "FACTURE" | "BON_LIVRAISON" | "BON_COMMANDE" | "AVOIR"
): string {
  const prefix: Record<string, string> = {
    DEVIS: "DEV",
    FACTURE: "FAC",
    BON_LIVRAISON: "BL",
    BON_COMMANDE: "BC",
    AVOIR: "AV",
  };
  const year = new Date().getFullYear();
  const seq = String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0");
  return `${prefix[type]}-${year}-${seq}`;
}

// ─────────────────────────────────────────────
// Create Document
// ─────────────────────────────────────────────
export async function createDocument(formData: unknown) {
  const parsed = documentSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  const number = generateDocumentNumber(data.type);
  const totals = computeDocumentTotals(data.lines);

  // Revalidate the lists so the new document shows up
  revalidatePath("/factures");
  revalidatePath("/devis");

  // TODO: Persist to database
  return {
    success: true,
    data: { id: `draft-${Date.now()}`, ...data, number, ...totals }
  };
}

// ─────────────────────────────────────────────
// Get Documents by type
// ─────────────────────────────────────────────
export async function getDocuments(
  type?: "DEVIS" | "FACTURE" | "BON_LIVRAISON" | "BON_COMMANDE" | "AVOIR"
) {
  // TODO: Fetch from database
  return { success: true, data: [] as any[] };
}
