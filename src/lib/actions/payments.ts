"use server";

import { revalidatePath } from "next/cache";

export async function addPayment(data: {
  amount: number;
  date: string;
  method: "VIREMENT" | "CHEQUE" | "ESPECES" | "CARTE";
  reference?: string;
  notes?: string;
  documentId: string;
}) {
  // TODO: Persist to database

  revalidatePath("/suivi-paiements");
  revalidatePath("/factures");
  revalidatePath("/statistiques");

  return { success: true };
}
