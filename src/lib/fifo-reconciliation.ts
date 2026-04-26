/**
 * ═══════════════════════════════════════════════════════════════
 *  STRUCTURA — FIFO Partial Payment Reconciliation Engine
 * ═══════════════════════════════════════════════════════════════
 *
 *  The Karniy Algorithm:
 *  When a bakery hands cash to the wholesaler, this engine:
 *  1. Fetches ALL outstanding invoices for that bakery (FIFO by date)
 *  2. Applies the payment amount starting from the OLDEST invoice
 *  3. Splits the payment across invoices until exhausted
 *  4. Updates each invoice's totalPaid & status
 *  5. Creates a Payment document with the allocation map
 *  6. Creates an audit log entry for EVERY invoice touched
 *
 *  Status transitions:
 *    UNPAID/SENT/DRAFT → totalPaid > 0 but < totalTTC → PENDING (partial)
 *    PENDING           → totalPaid >= totalTTC        → PAID (fully cleared)
 *
 * ═══════════════════════════════════════════════════════════════
 */

import { ID, Query, type Models } from "appwrite";
import { APPWRITE_CONFIG, databases } from "@/lib/appwrite";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type PaymentMethod = "ESPECES" | "VIREMENT" | "CHEQUE" | "CARTE";

export type PaymentAllocation = {
  invoiceId: string;
  invoiceNumber: string;
  allocatedAmount: number;
  invoiceTotalBefore: number;
  invoiceTotalAfter: number;
  newStatus: "PAID" | "PENDING" | "SENT";
};

export type FIFOPaymentInput = {
  userId: string;
  contactId: string;
  amount: number;
  method: PaymentMethod;
  paymentDate: string; // ISO date string (YYYY-MM-DD)
  reference?: string;
  notes?: string;
};

export type FIFOPaymentResult = {
  success: boolean;
  paymentId: string;
  totalApplied: number;
  surplus: number; // Amount remaining if payment > total debt
  allocations: PaymentAllocation[];
  error?: string;
};

type InvoiceRecord = {
  $id: string;
  $createdAt: string;
  number: string;
  totalTTC: number;
  totalPaid: number;
  status: string;
  date: string;
  contactId: string;
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function readNumber(source: Record<string, unknown>, key: string): number {
  const value = source[key];
  if (typeof value === "number") return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function readString(source: Record<string, unknown>, key: string): string {
  const value = source[key];
  return typeof value === "string" ? value : "";
}

function computeNewStatus(
  totalPaid: number,
  totalTTC: number
): "PAID" | "PENDING" | "SENT" {
  if (totalPaid >= totalTTC && totalTTC > 0) return "PAID";
  if (totalPaid > 0) return "PENDING";
  return "SENT";
}

function mapInvoice(doc: Models.Document): InvoiceRecord {
  const source = doc as unknown as Record<string, unknown>;
  return {
    $id: doc.$id,
    $createdAt: doc.$createdAt,
    number: readString(source, "number") || `FAC-${doc.$id.slice(0, 6)}`,
    totalTTC: readNumber(source, "totalTTC"),
    totalPaid: readNumber(source, "totalPaid"),
    status: readString(source, "status") || "SENT",
    date: readString(source, "date") || doc.$createdAt,
    contactId: readString(source, "contactId"),
  };
}

// ─────────────────────────────────────────────
// Core FIFO Engine
// ─────────────────────────────────────────────

export async function applyFIFOPayment(
  input: FIFOPaymentInput
): Promise<FIFOPaymentResult> {
  const {
    userId,
    contactId,
    amount,
    method,
    paymentDate,
    reference,
    notes,
  } = input;

  const {
    databaseId,
    documentsCollectionId,
    paymentsCollectionId,
    paymentsAuditCollectionId,
  } = APPWRITE_CONFIG;

  // Validate config
  if (
    !databaseId ||
    !documentsCollectionId ||
    !paymentsCollectionId ||
    !paymentsAuditCollectionId
  ) {
    return {
      success: false,
      paymentId: "",
      totalApplied: 0,
      surplus: amount,
      allocations: [],
      error: "Configuration Appwrite incomplète.",
    };
  }

  // Validate amount
  if (amount <= 0) {
    return {
      success: false,
      paymentId: "",
      totalApplied: 0,
      surplus: 0,
      allocations: [],
      error: "Le montant doit être supérieur à 0.",
    };
  }

  try {
    // ─────────────────────────────────────────
    // Step 1: Fetch all outstanding invoices for this contact
    //         Sorted by creation date (FIFO: oldest first)
    // ─────────────────────────────────────────
    const response = await databases.listDocuments(
      databaseId,
      documentsCollectionId,
      [
        Query.equal("userId", userId),
        Query.equal("contactId", contactId),
        Query.equal("type", "FACTURE"),
        Query.orderAsc("$createdAt"),
        Query.limit(100),
      ]
    );

    const allInvoices = response.documents.map(mapInvoice);

    // Filter to only unpaid/partially paid invoices
    const outstandingInvoices = allInvoices.filter((inv) => {
      const remaining = inv.totalTTC - inv.totalPaid;
      return remaining > 0.005; // 0.5 centime tolerance for floating point
    });

    if (outstandingInvoices.length === 0) {
      return {
        success: false,
        paymentId: "",
        totalApplied: 0,
        surplus: amount,
        allocations: [],
        error: "Aucune facture impayée pour ce client.",
      };
    }

    // ─────────────────────────────────────────
    // Step 2: FIFO Reconciliation Algorithm
    //         Walk through invoices oldest→newest,
    //         subtracting from the payment pool
    // ─────────────────────────────────────────
    let remaining = amount;
    const allocations: PaymentAllocation[] = [];

    for (const invoice of outstandingInvoices) {
      if (remaining <= 0.005) break; // Payment exhausted

      const amountDue = Number(
        (invoice.totalTTC - invoice.totalPaid).toFixed(2)
      );
      const allocated = Math.min(remaining, amountDue);
      const newTotalPaid = Number(
        (invoice.totalPaid + allocated).toFixed(2)
      );
      const newStatus = computeNewStatus(newTotalPaid, invoice.totalTTC);

      allocations.push({
        invoiceId: invoice.$id,
        invoiceNumber: invoice.number,
        allocatedAmount: Number(allocated.toFixed(2)),
        invoiceTotalBefore: invoice.totalPaid,
        invoiceTotalAfter: newTotalPaid,
        newStatus,
      });

      remaining = Number((remaining - allocated).toFixed(2));
    }

    const totalApplied = Number((amount - remaining).toFixed(2));

    // ─────────────────────────────────────────
    // Step 3: Create Payment document
    // ─────────────────────────────────────────
    const paymentDoc = await databases.createDocument(
      databaseId,
      paymentsCollectionId,
      ID.unique(),
      {
        userId,
        contactId,
        amount,
        method,
        paymentDate,
        reference: reference || "",
        notes: notes || "",
        allocationsJson: JSON.stringify(allocations),
      } as unknown as Record<string, unknown>
    );

    // ─────────────────────────────────────────
    // Step 4: Update each invoice and write audit logs
    //         This is the critical mutation section
    // ─────────────────────────────────────────
    const updatePromises: Promise<unknown>[] = [];

    for (const alloc of allocations) {
      // Update the invoice document
      updatePromises.push(
        databases.updateDocument(
          databaseId,
          documentsCollectionId,
          alloc.invoiceId,
          {
            totalPaid: alloc.invoiceTotalAfter,
            status: alloc.newStatus,
          } as unknown as Record<string, unknown>
        )
      );

      // Create audit log entry
      updatePromises.push(
        databases.createDocument(
          databaseId,
          paymentsAuditCollectionId,
          ID.unique(),
          {
            userId,
            paymentId: paymentDoc.$id,
            invoiceId: alloc.invoiceId,
            invoiceNumber: alloc.invoiceNumber,
            allocatedAmount: alloc.allocatedAmount,
            invoiceTotalBefore: alloc.invoiceTotalBefore,
            invoiceTotalAfter: alloc.invoiceTotalAfter,
            newStatus: alloc.newStatus,
            contactId,
          } as unknown as Record<string, unknown>
        )
      );
    }

    // Execute all updates in parallel
    await Promise.all(updatePromises);

    return {
      success: true,
      paymentId: paymentDoc.$id,
      totalApplied,
      surplus: remaining,
      allocations,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erreur inconnue lors du paiement.";
    return {
      success: false,
      paymentId: "",
      totalApplied: 0,
      surplus: amount,
      allocations: [],
      error: message,
    };
  }
}

// ─────────────────────────────────────────────
// Utility: Get total debt for a contact
// ─────────────────────────────────────────────
export async function getContactDebtSummary(
  userId: string,
  contactId: string
): Promise<{
  totalDebt: number;
  totalPaid: number;
  totalRemaining: number;
  invoiceCount: number;
  outstandingCount: number;
}> {
  const { databaseId, documentsCollectionId } = APPWRITE_CONFIG;
  if (!databaseId || !documentsCollectionId) {
    return {
      totalDebt: 0,
      totalPaid: 0,
      totalRemaining: 0,
      invoiceCount: 0,
      outstandingCount: 0,
    };
  }

  const response = await databases.listDocuments(
    databaseId,
    documentsCollectionId,
    [
      Query.equal("userId", userId),
      Query.equal("contactId", contactId),
      Query.equal("type", "FACTURE"),
      Query.limit(100),
    ]
  );

  const invoices = response.documents.map(mapInvoice);
  let totalDebt = 0;
  let totalPaid = 0;
  let outstandingCount = 0;

  for (const inv of invoices) {
    totalDebt += inv.totalTTC;
    totalPaid += inv.totalPaid;
    if (inv.totalTTC - inv.totalPaid > 0.005) {
      outstandingCount++;
    }
  }

  return {
    totalDebt: Number(totalDebt.toFixed(2)),
    totalPaid: Number(totalPaid.toFixed(2)),
    totalRemaining: Number((totalDebt - totalPaid).toFixed(2)),
    invoiceCount: invoices.length,
    outstandingCount,
  };
}

// ─────────────────────────────────────────────
// Utility: Fetch payment history for a contact
// ─────────────────────────────────────────────
export async function getPaymentHistory(
  userId: string,
  contactId?: string
): Promise<Models.Document[]> {
  const { databaseId, paymentsCollectionId } = APPWRITE_CONFIG;
  if (!databaseId || !paymentsCollectionId) return [];

  const queries = [
    Query.equal("userId", userId),
    Query.orderDesc("$createdAt"),
    Query.limit(50),
  ];

  if (contactId) {
    queries.push(Query.equal("contactId", contactId));
  }

  const response = await databases.listDocuments(
    databaseId,
    paymentsCollectionId,
    queries
  );

  return response.documents;
}
