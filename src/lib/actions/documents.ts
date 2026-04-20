"use server";

// Server Actions for Commercial Documents (Factures, Devis, etc.)
// These will persist to PostgreSQL via Prisma when the DB is connected.

import { prisma } from "@/lib/prisma";
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

  // Build the lines with computed totals
  const linesWithTotals = data.lines.map((line, idx) => {
    const lineTotals = computeLineTotals(line);
    return {
      id: `dl${Date.now()}-${idx}`,
      order: idx,
      ...line,
      ...lineTotals,
    };
  });

  if (!prisma) {
    return { 
      success: true, 
      data: { id: "draft-123", ...data, number, ...totals } 
    };
  }

  // Find first company as fallback (since auth isn't wired yet)
  const company = await prisma.company.findFirst();
  if (!company) {
    return { success: false as const, error: "No company found. Please create one first." };
  }
  const CURRENT_COMPANY_ID = company.id;

  try {
    const document = await prisma.document.create({
      data: {
        type: data.type,
        number,
        status: "DRAFT",
        contactId: data.contactId,
        companyId: CURRENT_COMPANY_ID,
        date: new Date(data.date),
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        notes: data.notes,
        footer: data.footer,
        ...totals,
        lines: { 
          // Omit `id` to let PostgreSQL generate unique UUIDs for lines
          create: linesWithTotals.map(({ id, ...rest }) => rest)
        },
      },
      include: {
        lines: true,
        contact: true
      }
    });

    // Revalidate the lists so the new document shows up
    revalidatePath("/factures");
    revalidatePath("/devis");

    return { success: true as const, data: document };
  } catch (error) {
    console.error("Failed to create document:", error);
    return { success: false as const, error: "Database error occurred." };
  }
}

// ─────────────────────────────────────────────
// Get Documents by type
// ─────────────────────────────────────────────
export async function getDocuments(
  type?: "DEVIS" | "FACTURE" | "BON_LIVRAISON" | "BON_COMMANDE" | "AVOIR"
) {
  if (!prisma) return { success: true, data: [] as any[] };

  const company = await prisma.company.findFirst();
  if (!company) return { success: true, data: [] };
  const CURRENT_COMPANY_ID = company.id;

  try {
    const documents = await prisma.document.findMany({
      where: type ? { type, companyId: CURRENT_COMPANY_ID } : { companyId: CURRENT_COMPANY_ID },
      include: { contact: true, lines: true },
      orderBy: { createdAt: "desc" },
    });
    return { success: true as const, data: documents };
  } catch (error) {
    console.error("Failed to fetch documents:", error);
    return { success: false as const, error: "Database error occurred." };
  }
}
