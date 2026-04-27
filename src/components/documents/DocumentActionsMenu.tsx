"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ID } from "appwrite";

import { APPWRITE_CONFIG, databases } from "@/lib/appwrite";
import { useAuth } from "@/contexts/AuthContext";
import {
  type DocumentType,
  DOC_TYPE_META,
  getStatusLabel,
  STATUS_LABELS,
} from "@/lib/document-helpers";
import { convertDocument } from "@/lib/document-conversion";
import { usePlan } from "@/contexts/PlanContext";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  Pencil,
  Copy,
  ArrowRightLeft,
  Download,
  Trash2,
  CircleDot,
  MessageCircle,
  Lock,
} from "lucide-react";

// ─── Types ──────────────────────────────────────
type DocumentItem = {
  id: string;
  number: string;
  date: string;
  status: string;
  totalTTC: number;
  totalHT: number;
  totalTVA: number;
  dueDate?: string | null;
  notes?: string;
  footer?: string;
  linesJson?: string;
  contactId?: string;
  contact: {
    name: string;
    companyName?: string;
    city?: string;
    ice?: string;
  };
};

interface DocumentActionsMenuProps {
  document: DocumentItem;
  type: DocumentType;
  onStatusChange?: (docId: string, newStatus: string) => void;
  onDelete?: (docId: string) => void;
  onDownloadPDF?: () => void;
}

// ─── Component ──────────────────────────────────
export function DocumentActionsMenu({
  document: doc,
  type,
  onStatusChange,
  onDelete,
  onDownloadPDF,
}: DocumentActionsMenuProps) {
  const router = useRouter();
  const { userId } = useAuth();
  const { limits, setShowUpgradeModal } = usePlan();
  const meta = DOC_TYPE_META[type];
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  // ─── Edit ─────────────────────────────────
  function handleEdit() {
    router.push(meta.editRoute(doc.id));
  }

  // ─── Duplicate ────────────────────────────
  async function handleDuplicate() {
    const { databaseId, documentsCollectionId } = APPWRITE_CONFIG;
    if (!databaseId || !documentsCollectionId || !userId) return;

    try {
      const prefix = meta.prefix;
      const year = new Date().getFullYear();
      const seq = String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0");
      const newNumber = `${prefix}-${year}-${seq}`;

      const payload: Record<string, unknown> = {
        type,
        number: newNumber,
        userId,
        status: "DRAFT",
        contactId: doc.contactId || "",
        date: new Date().toISOString().split("T")[0],
        notes: doc.notes || "",
        footer: doc.footer || "",
        totalHT: doc.totalHT,
        totalTVA: doc.totalTVA,
        totalTTC: doc.totalTTC,
        totalPaid: 0,
      };

      if (doc.linesJson) {
        payload.linesJson = doc.linesJson;
      }

      await databases.createDocument(databaseId, documentsCollectionId, ID.unique(), payload);
      router.refresh();
      window.location.reload();
    } catch (err) {
      console.error("Duplicate failed:", err);
    }
  }

  // ─── Convert ──────────────────────────────
  const [isConverting, setIsConverting] = React.useState(false);

  async function handleConvert(targetType: DocumentType) {
    if (!userId || isConverting) return;
    setIsConverting(true);

    try {
      const result = await convertDocument(doc.id, targetType, userId);

      if (result.success && result.newDocId) {
        const targetMeta = DOC_TYPE_META[targetType];
        // Navigate to the edit page of the newly created document
        router.push(targetMeta.editRoute(result.newDocId));
      } else {
        console.error("Conversion failed:", result.error);
        alert(result.error || "Erreur lors de la conversion.");
      }
    } catch (err) {
      console.error("Conversion error:", err);
      alert("Erreur inattendue lors de la conversion.");
    } finally {
      setIsConverting(false);
    }
  }

  // ─── Status Change ────────────────────────
  async function handleStatusChange(newStatus: string) {
    const { databaseId, documentsCollectionId } = APPWRITE_CONFIG;
    if (!databaseId || !documentsCollectionId) return;

    try {
      await databases.updateDocument(databaseId, documentsCollectionId, doc.id, {
        status: newStatus,
      });
      onStatusChange?.(doc.id, newStatus);
    } catch (err) {
      console.error("Status update failed:", err);
    }
  }

  // ─── Delete ───────────────────────────────
  async function handleDelete() {
    const { databaseId, documentsCollectionId } = APPWRITE_CONFIG;
    if (!databaseId || !documentsCollectionId) return;

    setIsDeleting(true);
    try {
      await databases.deleteDocument(databaseId, documentsCollectionId, doc.id);
      onDelete?.(doc.id);
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  return (
    <div className="flex items-center justify-end">
      {/* Sole entry point: 3-dots menu */}

      {/* More Actions Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger 
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground size-8 p-0"
        >
          <MoreHorizontal className="size-4 text-muted-foreground" />
          <span className="sr-only">Actions</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={4}>
          <DropdownMenuGroup>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={handleEdit}>
              <Pencil className="mr-2 size-4" />
              Modifier
            </DropdownMenuItem>

            <DropdownMenuItem onClick={handleDuplicate}>
              <Copy className="mr-2 size-4" />
              Dupliquer
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem 
              onClick={() => {
                if (!onDownloadPDF) return;
                onDownloadPDF();
              }}
            >
              <Download className="mr-2 size-4" />
              Télécharger PDF
            </DropdownMenuItem>

            {meta.convertibleTo && meta.convertibleTo.length > 0 && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger disabled={!limits.supplyChainConversion}>
                  <ArrowRightLeft className="mr-2 size-4" />
                  Convertir {!limits.supplyChainConversion && <Lock className="ml-auto size-3" />}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {meta.convertibleTo.map((conv) => (
                    <DropdownMenuItem
                      key={conv.type}
                      onClick={() => handleConvert(conv.type)}
                      disabled={isConverting || doc.status === "CONVERTIE"}
                    >
                      {conv.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <CircleDot className="mr-2 size-4" />
                Changer statut
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {meta.statuses.map((s) => (
                  <DropdownMenuItem
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    disabled={doc.status === s}
                  >
                    {doc.status === s ? "✓ " : ""}
                    {getStatusLabel(s)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator />
            {!showDeleteConfirm ? (
              <DropdownMenuItem
                variant="destructive"
                onClick={(e) => {
                  e.preventDefault();
                  setShowDeleteConfirm(true);
                }}
              >
                <Trash2 className="mr-2 size-4" />
                Supprimer
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="mr-2 size-4" />
                {isDeleting ? "Suppression..." : "Confirmer la suppression"}
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
