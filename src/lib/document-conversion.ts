// ═══════════════════════════════════════════════════════════════
// Document Conversion Flow
// Devis → Facture → Bon de Livraison (+ Avoir from Facture)
// Devis → Bon de Commande → Facture
// Based on CORFIT ERP PRD conversion chain
// ═══════════════════════════════════════════════════════════════

import { ID } from "appwrite";
import { APPWRITE_CONFIG, databases } from "@/lib/appwrite";
import { DOC_TYPE_META, type DocumentType } from "@/lib/document-helpers";

/**
 * Generate a fresh document number for the target type.
 * Format: PREFIX-YYYY-NNNN (e.g. FAC-2026-0042)
 */
function generateDocumentNumber(type: DocumentType): string {
  const meta = DOC_TYPE_META[type];
  const year = new Date().getFullYear();
  const seq = String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0");
  return `${meta.prefix}-${year}-${seq}`;
}

/**
 * The full conversion map — which document types can convert to which.
 * Each entry: sourceType → allowed target types.
 */
export const CONVERSION_MAP: Record<DocumentType, DocumentType[]> = {
  DEVIS: ["FACTURE", "BON_COMMANDE"],
  BON_COMMANDE: ["FACTURE"],
  FACTURE: ["AVOIR", "BON_LIVRAISON"],
  BON_LIVRAISON: ["FACTURE"],
  AVOIR: [],
};

/**
 * Convert a source document into a target document type.
 *
 * Steps:
 * 1. Fetch the source document from Appwrite
 * 2. Flip its status to "CONVERTIE"
 * 3. Create a new document with:
 *    - Fresh ID and number
 *    - Today's date
 *    - Inherited: contactId, lines, totals, notes, footer, vatPct
 *    - originRef = "SourceType SourceNumber" (e.g. "Devis DEV-2026-0001")
 *    - originDocId = source.$id
 *    - Status = "DRAFT"
 * 4. Return the new document's ID
 */
export async function convertDocument(
  sourceDocId: string,
  targetType: DocumentType,
  userId: string
): Promise<{ success: boolean; newDocId?: string; newNumber?: string; error?: string }> {
  const { databaseId, documentsCollectionId } = APPWRITE_CONFIG;

  if (!databaseId || !documentsCollectionId) {
    return { success: false, error: "Configuration Appwrite manquante." };
  }

  try {
    // 1. Fetch source document
    const sourceDoc = await databases.getDocument(
      databaseId,
      documentsCollectionId,
      sourceDocId
    );

    const sourceType = sourceDoc.type as DocumentType;

    // Validate the conversion is allowed
    const allowed = CONVERSION_MAP[sourceType];
    if (!allowed || !allowed.includes(targetType)) {
      return {
        success: false,
        error: `Conversion de ${sourceType} vers ${targetType} non autorisée.`,
      };
    }

    // 2. Flip source document status to "CONVERTIE"
    await databases.updateDocument(databaseId, documentsCollectionId, sourceDocId, {
      status: "CONVERTIE",
    });

    // 3. Build the new document
    const newNumber = generateDocumentNumber(targetType);
    const sourceMeta = DOC_TYPE_META[sourceType];
    const originRef = `${sourceMeta.label} ${sourceDoc.number}`;

    const payload: Record<string, unknown> = {
      type: targetType,
      number: newNumber,
      userId,
      status: "DRAFT",
      contactId: sourceDoc.contactId || "",
      date: new Date().toISOString().split("T")[0],
      dueDate: sourceDoc.dueDate || null,
      notes: sourceDoc.notes || "",
      footer: sourceDoc.footer || "",
      totalHT: sourceDoc.totalHT || 0,
      totalTVA: sourceDoc.totalTVA || 0,
      totalTTC: sourceDoc.totalTTC || 0,
      totalPaid: 0,
      originRef,
      originDocId: sourceDocId,
      vatPct: sourceDoc.vatPct || 20,
    };

    // Copy line items if they exist
    if (sourceDoc.linesJson) {
      payload.linesJson = sourceDoc.linesJson;
    }

    // 4. Create the new document
    const newDoc = await databases.createDocument(
      databaseId,
      documentsCollectionId,
      ID.unique(),
      payload
    );

    return {
      success: true,
      newDocId: newDoc.$id,
      newNumber,
    };
  } catch (err) {
    console.error("Document conversion failed:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erreur lors de la conversion.",
    };
  }
}

/**
 * Get human-readable conversion label.
 */
export function getConversionLabel(sourceType: DocumentType, targetType: DocumentType): string {
  const targetMeta = DOC_TYPE_META[targetType];
  return `Convertir en ${targetMeta.label}`;
}

/**
 * Check if a document type can be converted to another.
 */
export function canConvert(sourceType: DocumentType, targetType: DocumentType): boolean {
  const allowed = CONVERSION_MAP[sourceType];
  return allowed ? allowed.includes(targetType) : false;
}
