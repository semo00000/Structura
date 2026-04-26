import type { LucideIcon } from "lucide-react";
import { FilePlus, FileText, ShoppingCart, Truck, FileCheck } from "lucide-react";

// ─── Document Types ──────────────────────────────
export type DocumentType = "FACTURE" | "DEVIS" | "BON_COMMANDE" | "BON_LIVRAISON" | "AVOIR";

// ─── Status Definitions ─────────────────────────
export type DocumentStatus = "DRAFT" | "SENT" | "PAID" | "PARTIAL" | "OVERDUE" | "CANCELLED" | "ACCEPTED" | "REFUSED" | "CONFIRMED" | "RECEIVED" | "ISSUED" | "APPLIED" | "REFUNDED";

export const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  SENT: "Envoyé",
  PAID: "Payé",
  PARTIAL: "Partiel",
  OVERDUE: "En retard",
  CANCELLED: "Annulé",
  ACCEPTED: "Accepté",
  REFUSED: "Refusé",
  CONFIRMED: "Confirmé",
  RECEIVED: "Reçu",
  ISSUED: "Émis",
  APPLIED: "Appliqué",
  REFUNDED: "Remboursé",
  CONVERTIE: "Convertie",
};

export const STATUS_STYLES: Record<string, string> = {
  DRAFT: "border-slate-300 text-slate-700 bg-transparent",
  SENT: "border-blue-400 text-blue-700 bg-transparent",
  PAID: "border-emerald-500 text-emerald-700 bg-transparent",
  PARTIAL: "border-amber-500 text-amber-700 bg-transparent",
  OVERDUE: "border-red-500 text-red-700 bg-transparent",
  CANCELLED: "border-red-300 text-red-500 bg-transparent",
  ACCEPTED: "border-emerald-500 text-emerald-700 bg-transparent",
  REFUSED: "border-red-500 text-red-700 bg-transparent",
  CONFIRMED: "border-emerald-500 text-emerald-700 bg-transparent",
  RECEIVED: "border-emerald-600 text-emerald-800 bg-transparent",
  ISSUED: "border-amber-500 text-amber-700 bg-transparent",
  APPLIED: "border-blue-400 text-blue-700 bg-transparent",
  REFUNDED: "border-emerald-500 text-emerald-700 bg-transparent",
  CONVERTIE: "border-indigo-400 text-indigo-700 bg-transparent",
};

// ─── Document Type Metadata ─────────────────────
type DocTypeMeta = {
  label: string;
  labelPlural: string;
  prefix: string;
  icon: LucideIcon;
  listRoute: string;
  newRoute: string;
  editRoute: (id: string) => string;
  contactType: "CLIENT" | "FOURNISSEUR";
  /** Document types this can be converted TO */
  convertibleTo?: { type: DocumentType; label: string }[];
  /** Available statuses for this type */
  statuses: string[];
};

export const DOC_TYPE_META: Record<DocumentType, DocTypeMeta> = {
  FACTURE: {
    label: "Facture",
    labelPlural: "Factures",
    prefix: "FAC",
    icon: FilePlus,
    listRoute: "/factures",
    newRoute: "/factures/new",
    editRoute: (id) => `/factures/${id}/edit`,
    contactType: "CLIENT",
    convertibleTo: [
      { type: "AVOIR", label: "Convertir en Avoir" },
      { type: "BON_LIVRAISON", label: "Convertir en Bon de Livraison" },
    ],
    statuses: ["DRAFT", "SENT", "PAID", "PARTIAL", "OVERDUE", "CANCELLED", "CONVERTIE"],
  },
  DEVIS: {
    label: "Devis",
    labelPlural: "Devis",
    prefix: "DEV",
    icon: FileText,
    listRoute: "/devis",
    newRoute: "/devis/new",
    editRoute: (id) => `/devis/${id}/edit`,
    contactType: "CLIENT",
    convertibleTo: [
      { type: "FACTURE", label: "Convertir en Facture" },
      { type: "BON_COMMANDE", label: "Convertir en Bon de Commande" },
    ],
    statuses: ["DRAFT", "SENT", "ACCEPTED", "REFUSED", "CANCELLED", "CONVERTIE"],
  },
  BON_COMMANDE: {
    label: "Bon de Commande",
    labelPlural: "Bons de Commande",
    prefix: "BC",
    icon: ShoppingCart,
    listRoute: "/bons-commande",
    newRoute: "/bons-commande/new",
    editRoute: (id) => `/bons-commande/${id}/edit`,
    contactType: "FOURNISSEUR",
    convertibleTo: [
      { type: "FACTURE", label: "Convertir en Facture" },
    ],
    statuses: ["DRAFT", "SENT", "CONFIRMED", "RECEIVED", "CANCELLED", "CONVERTIE"],
  },
  BON_LIVRAISON: {
    label: "Bon de Livraison",
    labelPlural: "Bons de Livraison",
    prefix: "BL",
    icon: Truck,
    listRoute: "/bons-livraison",
    newRoute: "/bons-livraison/new",
    editRoute: (id) => `/bons-livraison/${id}/edit`,
    contactType: "CLIENT",
    statuses: ["DRAFT", "SENT", "CONFIRMED", "CANCELLED", "CONVERTIE"],
  },
  AVOIR: {
    label: "Avoir",
    labelPlural: "Avoirs",
    prefix: "AV",
    icon: FileCheck,
    listRoute: "/avoirs",
    newRoute: "/avoirs/new",
    editRoute: (id) => `/avoirs/${id}/edit`,
    contactType: "CLIENT",
    statuses: ["DRAFT", "ISSUED", "APPLIED", "REFUNDED", "CANCELLED"],
  },
};

// ─── Helpers ────────────────────────────────────
export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] || status;
}

export function getStatusStyle(status: string): string {
  return STATUS_STYLES[status] || "border-slate-300 text-slate-600";
}

export function getDocMeta(type: DocumentType): DocTypeMeta {
  return DOC_TYPE_META[type] || DOC_TYPE_META.FACTURE;
}
