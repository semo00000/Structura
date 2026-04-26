"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addPayment(data: {
  amount: number;
  date: string;
  method: "VIREMENT" | "CHEQUE" | "ESPECES" | "CARTE";
  reference?: string;
  notes?: string;
  documentId: string;
}) {
  if (!prisma) {
    return { success: false as const, error: "Base de données non disponible" };
  }

  try {
    const document = await prisma.document.findUnique({
      where: { id: data.documentId },
    });

    if (!document) {
      return { success: false as const, error: "Facture introuvable" };
    }

    // Insert payment
    await prisma.payment.create({
      data: {
        amount: data.amount,
        date: new Date(data.date),
        method: data.method,
        reference: data.reference,
        notes: data.notes,
        documentId: document.id,
        companyId: document.companyId,
      },
    });

    // Update totalPaid and status for this document
    const newTotalPaid = document.totalPaid + data.amount;

    let newStatus = document.status;
    if (newTotalPaid >= document.totalTTC) {
      newStatus = "PAID";
    } else if (newTotalPaid > 0) {
      // Even if it was SENT, once touched by money it becomes PENDING (partiellement)
      newStatus = "PENDING";
    }

    await prisma.document.update({
      where: { id: document.id },
      data: {
        totalPaid: { increment: data.amount },
        status: newStatus,
      },
    });

    revalidatePath("/suivi-paiements");
    revalidatePath("/factures");
    revalidatePath("/statistiques");

    return { success: true };
  } catch (err: any) {
    console.error("Error adding payment", err);
    return { success: false as const, error: err.message || "Erreur système" };
  }
}
