"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useFieldArray, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ID, Query } from "appwrite";
import { cn } from "@/lib/utils";
import { APPWRITE_CONFIG, databases } from "@/lib/appwrite";
import { generateDocumentPDF } from "@/lib/pdf-generator";
import { usePlan } from "@/contexts/PlanContext";
import { useAuth } from "@/contexts/AuthContext";

// UI
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ComboboxSearch, type ComboboxOption } from "./ComboboxSearch";

// Icons
import {
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  FileText,
  FilePlus,
  ShoppingCart,
  Truck,
  FileCheck,
  Calculator,
  User,
  CalendarDays,
  Package,
  AlertCircle,
  MessageCircle,
} from "lucide-react";

// Validation
import {
  documentSchema,
  type DocumentFormValues,
  EMPTY_LINE,
  TVA_OPTIONS,
  computeLineTotals,
  computeDocumentTotals,
  formatMAD,
} from "@/lib/validations/document";

// Data
import { Loader2 } from "lucide-react";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type DocumentType = "FACTURE" | "DEVIS" | "BON_COMMANDE" | "BON_LIVRAISON" | "AVOIR";

interface DocumentEditorProps {
  type: DocumentType;
  /** When editing an existing document */
  documentId?: string;
}

type CompanyProfile = {
  companyName: string;
  address?: string | null;
  city?: string | null;
  telephone?: string | null;
  email?: string | null;
  ice?: string | null;
  rc?: string | null;
  ifValue?: string | null;
  patente?: string | null;
  cnss?: string | null;
  logoUrl?: string | null;
};

type SuccessDocument = {
  id: string;
  type: DocumentType;
  number: string;
  date: Date;
  dueDate?: Date | null;
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  notes?: string;
  footer?: string;
  contactId: string;
  lines: Array<{
    description: string;
    quantity: number;
    unitPriceHT: number;
    tvaRate: number;
    totalHT: number;
    totalTTC: number;
  }>;
};

function getDocumentPrefix(type: DocumentType): string {
  switch (type) {
    case "FACTURE": return "FAC";
    case "BON_COMMANDE": return "BC";
    case "BON_LIVRAISON": return "BL";
    case "AVOIR": return "AV";
    default: return "DEV";
  }
}

function getDocumentLabel(type: DocumentType): string {
  switch (type) {
    case "FACTURE": return "Facture";
    case "BON_COMMANDE": return "Bon de Commande";
    case "BON_LIVRAISON": return "Bon de Livraison";
    case "AVOIR": return "Avoir";
    default: return "Devis";
  }
}

function getDocumentIcon(type: DocumentType) {
  switch (type) {
    case "FACTURE": return FilePlus;
    case "BON_COMMANDE": return ShoppingCart;
    case "BON_LIVRAISON": return Truck;
    case "AVOIR": return FileCheck;
    default: return FileText;
  }
}

function getDocumentListRoute(type: DocumentType): string {
  switch (type) {
    case "FACTURE": return "/factures";
    case "BON_COMMANDE": return "/bons-commande";
    case "BON_LIVRAISON": return "/bons-livraison";
    case "AVOIR": return "/avoirs";
    default: return "/devis";
  }
}

function getContactType(type: DocumentType): "CLIENT" | "FOURNISSEUR" {
  return type === "BON_COMMANDE" ? "FOURNISSEUR" : "CLIENT";
}

function getNewDocumentTitle(type: DocumentType, isEditing: boolean): string {
  if (isEditing) {
    switch (type) {
      case "FACTURE": return "Modifier Facture";
      case "BON_COMMANDE": return "Modifier Bon de Commande";
      case "BON_LIVRAISON": return "Modifier Bon de Livraison";
      case "AVOIR": return "Modifier Avoir";
      default: return "Modifier Devis";
    }
  }
  switch (type) {
    case "FACTURE": return "Nouvelle Facture";
    case "BON_COMMANDE": return "Nouveau Bon de Commande";
    case "BON_LIVRAISON": return "Nouveau Bon de Livraison";
    case "AVOIR": return "Nouvel Avoir";
    default: return "Nouveau Devis";
  }
}

function getDueDateLabel(type: DocumentType): string {
  switch (type) {
    case "FACTURE": return "Date d'échéance";
    case "BON_COMMANDE": return "Date de livraison prévue";
    case "BON_LIVRAISON": return "Date de livraison";
    case "AVOIR": return "Date limite de remboursement";
    default: return "Validité";
  }
}

function generateDocumentNumber(type: DocumentType): string {
  const prefix = getDocumentPrefix(type);
  const year = new Date().getFullYear();
  const sequence = String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0");
  return `${prefix}-${year}-${sequence}`;
}

function fallbackCompanyProfile(): CompanyProfile {
  return {
    companyName: "Configuer votre profil",
    address: "",
    city: "",
    telephone: "",
    email: "",
    ice: "",
    rc: "",
    ifValue: "",
    patente: "",
    cnss: "",
    logoUrl: "",
  };
}

function stringValue(source: Record<string, unknown>, key: string): string {
  const value = source[key];
  return typeof value === "string" ? value : "";
}

function parseCompanyProfile(source: Record<string, unknown>): CompanyProfile {
  return {
    companyName: stringValue(source, "companyName") || stringValue(source, "name") || "Configuer votre profil",
    address: stringValue(source, "address"),
    city: stringValue(source, "city"),
    telephone: stringValue(source, "telephone") || stringValue(source, "phone"),
    email: stringValue(source, "email"),
    ice: stringValue(source, "ice"),
    rc: stringValue(source, "rc"),
    ifValue: stringValue(source, "ifValue") || stringValue(source, "taxId"),
    patente: stringValue(source, "patente"),
    cnss: stringValue(source, "cnss"),
    logoUrl: stringValue(source, "logoUrl"),
  };
}

// ─────────────────────────────────────────────
// Real-time line total cell (subscribed via useWatch)
// ─────────────────────────────────────────────
function LineTotalCell({
  control,
  index,
}: {
  control: ReturnType<typeof useForm<DocumentFormValues>>["control"];
  index: number;
}) {
  const quantity = useWatch({ control, name: `lines.${index}.quantity` });
  const unitPriceHT = useWatch({ control, name: `lines.${index}.unitPriceHT` });
  const tvaRate = useWatch({ control, name: `lines.${index}.tvaRate` });

  const { totalHT } = computeLineTotals({
    quantity: quantity || 0,
    unitPriceHT: unitPriceHT || 0,
    tvaRate: tvaRate || 0,
  });

  return (
    <span className="font-mono text-sm font-bold tabular-nums text-[#111827] dark:text-white">
      {formatMAD(totalHT)}
    </span>
  );
}

// ─────────────────────────────────────────────
// Grand totals panel (subscribed via useWatch)
// ─────────────────────────────────────────────
function GrandTotals({
  control,
}: {
  control: ReturnType<typeof useForm<DocumentFormValues>>["control"];
}) {
  const lines = useWatch({ control, name: "lines" });
  const totals = computeDocumentTotals(
    (lines || []).map((l) => ({
      quantity: l.quantity || 0,
      unitPriceHT: l.unitPriceHT || 0,
      tvaRate: l.tvaRate || 0,
    }))
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Total HT</span>
        <span className="font-mono text-sm font-bold tabular-nums text-[#111827] dark:text-white">
          {formatMAD(totals.totalHT)} DH
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Total TVA</span>
        <span className="font-mono text-sm font-bold tabular-nums text-[#111827] dark:text-white">
          {formatMAD(totals.totalTVA)} DH
        </span>
      </div>
      <Separator className="bg-border" />
      <div className="flex items-center justify-between rounded-lg bg-[#F9FAFB] dark:bg-muted p-3 border border-border">
        <span className="text-sm font-black uppercase tracking-widest text-[#111827] dark:text-white">Total TTC</span>
        <span className="font-mono text-lg font-black tabular-nums text-[#4338CA] dark:text-blue-400">
          {formatMAD(totals.totalTTC)} DH
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// MAIN DOCUMENT EDITOR COMPONENT
// ═══════════════════════════════════════════════
export function DocumentEditor({ type, documentId }: DocumentEditorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userId } = useAuth();
  const { subscriptionTier, checkInvoiceLimit, refreshCount } = usePlan();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [companyProfile, setCompanyProfile] = React.useState<CompanyProfile>(
    fallbackCompanyProfile()
  );
  const [clients, setClients] = React.useState<any[]>([]);
  const [products, setProducts] = React.useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = React.useState(true);

  const isEditing = Boolean(documentId);
  const fromDocId = searchParams.get("from");
  const typeLabel = getDocumentLabel(type);
  const TypeIcon = getDocumentIcon(type);
  const contactType = getContactType(type);
  const isSupplierDocument = contactType === "FOURNISSEUR";
  const today = new Date().toISOString().split("T")[0];

  // ─── Form Setup ────────────────────────────
  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<DocumentFormValues>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      type,
      contactId: "",
      date: today,
      dueDate: "",
      notes: "",
      footer: "Merci pour votre confiance.",
      lines: [{ ...EMPTY_LINE }],
    },
    mode: "onSubmit",
  });

  // ─── Field Array ───────────────────────────
  const { fields, append, remove } = useFieldArray({
    control,
    name: "lines",
  });

  // ─── Client Options ────────────────────────
  const clientOptions: ComboboxOption[] = clients.map((c) => ({
      value: c.$id,
      label: c.nameOrCompany || c.name,
      sublabel: c.email || c.city || "",
      meta: c.ice ? `ICE: ${c.ice.slice(0, 6)}…` : undefined,
    }));

  // ─── Product Options ───────────────────────
  const productOptions: ComboboxOption[] = products.map((p) => ({
    value: p.$id,
    label: p.name,
    sublabel: p.reference || "",
    meta: `${formatMAD(parseFloat(p.sellingPriceHT || "0"))} DH/${p.unit || "u"}`,
  }));

  // ─── Auto-fill line from product ───────────
  function handleProductSelect(index: number, productId: string) {
    const product = products.find((p) => p.$id === productId);
    if (product) {
      setValue(`lines.${index}.productId`, product.$id);
      setValue(`lines.${index}.description`, product.name);
      setValue(`lines.${index}.unitPriceHT`, parseFloat(product.sellingPriceHT || "0"));
      setValue(`lines.${index}.tvaRate`, parseFloat(product.tvaRate || "0"));
      setValue(`lines.${index}.unit`, product.unit || "unité");
    } else {
      setValue(`lines.${index}.productId`, "");
    }
  }

  React.useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoadingData(true);
      const { databaseId, companyCollectionId, contactsCollectionId, productsCollectionId, documentsCollectionId } = APPWRITE_CONFIG;
      if (!databaseId || !companyCollectionId || !contactsCollectionId || !productsCollectionId) {
        setIsLoadingData(false);
        return;
      }

      try {
        if (!userId) {
          setIsLoadingData(false);
          return;
        }

        // Parallel fetch of contacts, products, and company profile
        const [profRes, contactsRes, prodsRes] = await Promise.all([
          databases.listDocuments(databaseId, companyCollectionId, [
            Query.equal("userId", userId),
            Query.limit(1),
          ]),
          databases.listDocuments(databaseId, contactsCollectionId, [
            Query.equal("userId", userId),
            Query.equal("type", contactType),
            Query.limit(100)
          ]),
          databases.listDocuments(databaseId, productsCollectionId, [
            Query.equal("userId", userId),
            Query.limit(100)
          ])
        ]);

        if (isMounted) {
          if (profRes.documents[0]) setCompanyProfile(parseCompanyProfile(profRes.documents[0] as unknown as Record<string, unknown>));
          setClients(contactsRes.documents);
          setProducts(prodsRes.documents);
        }

        // ─── Load existing document for edit or conversion ───
        const loadId = documentId || fromDocId;
        if (loadId && documentsCollectionId && isMounted) {
          try {
            const existingDoc = await databases.getDocument(databaseId, documentsCollectionId, loadId);
            const src = existingDoc as unknown as Record<string, unknown>;

            // Parse lines
            let parsedLines: DocumentFormValues["lines"] = [{ ...EMPTY_LINE }];
            const linesJson = typeof src.linesJson === "string" ? src.linesJson : "";
            if (linesJson) {
              try {
                const arr = JSON.parse(linesJson);
                if (Array.isArray(arr) && arr.length > 0) {
                  parsedLines = arr.map((l: any) => ({
                    productId: l.productId || "",
                    description: l.description || "",
                    quantity: Number(l.quantity) || 1,
                    unitPriceHT: Number(l.unitPriceHT) || 0,
                    tvaRate: Number(l.tvaRate) || 0,
                    unit: l.unit || "unité",
                  }));
                }
              } catch { /* ignore parse errors */ }
            }

            const dateVal = typeof src.date === "string" ? src.date.split("T")[0] : today;
            const dueDateVal = typeof src.dueDate === "string" && src.dueDate ? src.dueDate.split("T")[0] : "";

            reset({
              type,
              contactId: typeof src.contactId === "string" ? src.contactId : "",
              date: fromDocId ? today : dateVal,
              dueDate: fromDocId ? "" : dueDateVal,
              notes: typeof src.notes === "string" ? src.notes : "",
              footer: typeof src.footer === "string" ? src.footer : "Merci pour votre confiance.",
              lines: parsedLines,
            });
          } catch (err) {
            console.error("Failed to load document for editing:", err);
          }
        }
      } catch (err) {
        console.error("Error loading entities", err);
      } finally {
        if (isMounted) setIsLoadingData(false);
      }
    }

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [userId, contactType, documentId, fromDocId, reset, today, type]);

  // ─── Submit ────────────────────────────────
  const [successDocument, setSuccessDocument] = React.useState<SuccessDocument | null>(null);

  async function onSubmit(data: DocumentFormValues) {
    // Pillar 4: Invoice limit check for FACTURE type (only for new, not edits)
    if (type === "FACTURE" && !isEditing && !checkInvoiceLimit()) {
      return; // blocked — upgrade modal shown
    }

    const { databaseId, documentsCollectionId } = APPWRITE_CONFIG;

    if (!databaseId || !documentsCollectionId) {
      setSubmitError("Configuration Appwrite incomplète. Vérifiez .env.local.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    if (!userId) return;

    try {
      const totals = computeDocumentTotals(data.lines);
      const linesWithTotals = data.lines.map((line) => ({
        description: line.description,
        quantity: line.quantity,
        unitPriceHT: line.unitPriceHT,
        tvaRate: line.tvaRate,
        ...computeLineTotals(line),
      }));

      const payload: Record<string, string | number> = {
        type: data.type,
        contactId: data.contactId,
        date: data.date,
        notes: data.notes || "",
        footer: data.footer || "",
        totalHT: totals.totalHT,
        totalTVA: totals.totalTVA,
        totalTTC: totals.totalTTC,
      };

      if (data.dueDate) {
        payload.dueDate = data.dueDate;
      }

      const payloadWithLinesJson = {
        ...payload,
        linesJson: JSON.stringify(linesWithTotals),
      };

      let resultDocId = "";

      if (isEditing && documentId) {
        // ─── UPDATE existing document ───
        try {
          await databases.updateDocument(databaseId, documentsCollectionId, documentId, payloadWithLinesJson);
        } catch {
          await databases.updateDocument(databaseId, documentsCollectionId, documentId, payload);
        }
        resultDocId = documentId;

        // For edits, navigate back to the list
        router.push(getDocumentListRoute(type));
        return;
      } else {
        // ─── CREATE new document ───
        const number = generateDocumentNumber(type);
        const createPayload = {
          ...payloadWithLinesJson,
          number,
          userId,
          status: "DRAFT",
          totalPaid: 0,
        };

        try {
          const createdDocument = await databases.createDocument(
            databaseId,
            documentsCollectionId,
            ID.unique(),
            createPayload
          );
          resultDocId = createdDocument.$id;
        } catch {
          const fallbackPayload = { ...payload, number, userId, status: "DRAFT", totalPaid: 0 };
          const createdDocument = await databases.createDocument(
            databaseId,
            documentsCollectionId,
            ID.unique(),
            fallbackPayload
          );
          resultDocId = createdDocument.$id;
        }

        setSuccessDocument({
          id: resultDocId,
          type,
          number,
          date: new Date(data.date),
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          totalHT: totals.totalHT,
          totalTVA: totals.totalTVA,
          totalTTC: totals.totalTTC,
          notes: data.notes,
          footer: data.footer,
          contactId: data.contactId,
          lines: linesWithTotals,
        } as any);
      }
    } catch {
      setSubmitError("Erreur Appwrite. Vérifiez vos permissions de collection.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDownloadPDF() {
    if (!successDocument) return;

    const client = clients.find((c) => c.$id === successDocument.contactId);
    const mappedClient = client ? {
      name: client.nameOrCompany || client.name,
      companyName: client.category === "COMPANY" ? client.nameOrCompany : "",
      address: client.address,
      city: client.city,
      ice: client.ice
    } : { name: "Client Inconnu" };

    await generateDocumentPDF(successDocument, companyProfile, mappedClient, { subscriptionTier });
  }

  // ═══════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════
  if (successDocument) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-20">
        <div className="flex size-20 items-center justify-center rounded-full bg-green-500/10">
          <FileText className="size-10 text-green-600" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">{typeLabel} enregistré avec succès !</h2>
          <p className="mt-2 text-muted-foreground">Le document {successDocument.number} a été créé et sauvegardé.</p>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <Button variant="outline" className="border-border" onClick={() => router.push(getDocumentListRoute(type))}>
            Retour à la liste
          </Button>
          <Button onClick={handleDownloadPDF} className="gap-2 bg-[#4338CA] text-white hover:bg-[#3730A3]">
            Télécharger PDF
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {isLoadingData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Récupération de vos données...</p>
          </div>
        </div>
      )}
      {/* ─── Page Header ──────────────────── */}
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Retour
        </Button>
        <Separator orientation="vertical" className="h-6 bg-border" />
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-md bg-[#4338CA]/10">
            <TypeIcon className="size-5 text-[#4338CA]" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">
              {getNewDocumentTitle(type, isEditing)}
            </h1>
            <p className="text-xs text-muted-foreground">
              Brouillon · {typeLabel} #{getDocumentPrefix(type)}-{new Date().getFullYear()}-XXXX
            </p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs border-border text-foreground">
            {isEditing ? "MODIFICATION" : "BROUILLON"}
          </Badge>
        </div>
      </div>

      {/* ─── Top Section: Client + Dates ──── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Client Selection Card */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <User className="size-4" />
              {isSupplierDocument ? "Informations Fournisseur" : "Informations Client"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contactId" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {isSupplierDocument ? "Fournisseur" : "Client"} <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="contactId"
                control={control}
                render={({ field }) => (
                  <ComboboxSearch
                    id="contactId"
                    options={clientOptions}
                    value={field.value}
                    onSelect={field.onChange}
                    placeholder={isSupplierDocument ? "Rechercher un fournisseur..." : "Rechercher un client..."}
                    searchPlaceholder="Nom, entreprise, ICE..."
                    emptyMessage={isSupplierDocument ? "Aucun fournisseur trouvé." : "Aucun client trouvé."}
                  />
                )}
              />
              {errors.contactId && (
                <p className="flex items-center gap-1 text-xs text-destructive">
                  <AlertCircle className="size-3" />
                  {errors.contactId.message}
                </p>
              )}
            </div>

            {/* Client preview (when selected) */}
            <ClientPreview control={control} clients={clients} />
          </CardContent>
        </Card>

        {/* Dates Card */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CalendarDays className="size-4" />
              Dates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Date d&apos;émission <span className="text-destructive">*</span>
              </Label>
              <Input
                id="date"
                type="date"
                {...register("date")}
                className="font-mono text-sm"
              />
              {errors.date && (
                <p className="text-xs text-destructive">{errors.date.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {getDueDateLabel(type)}
              </Label>
              <Input
                id="dueDate"
                type="date"
                {...register("dueDate")}
                className="font-mono text-sm"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Line Items Table ─────────────── */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Package className="size-4" />
              Articles & Prestations
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ ...EMPTY_LINE })}
              className="gap-1.5 text-xs"
            >
              <Plus className="size-3.5" />
              Ajouter une ligne
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {errors.lines && typeof errors.lines.message === "string" && (
            <div className="mb-4 flex items-center gap-2 rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2">
              <AlertCircle className="size-4 text-destructive" />
              <p className="text-sm text-destructive">{errors.lines.message}</p>
            </div>
          )}

          {/* Table Header */}
          <div className="hidden border-b-2 border-border bg-muted/50 px-3 py-3 lg:grid lg:grid-cols-[1.5fr_2fr_0.6fr_0.6fr_1.2fr_0.8fr_1fr_auto] lg:gap-3 items-center">
            <span className="text-[11px] font-bold uppercase tracking-widest text-foreground">
              Article
            </span>
            <span className="text-[11px] font-bold uppercase tracking-widest text-foreground">
              Description
            </span>
            <span className="text-[11px] font-bold uppercase tracking-widest text-foreground">
              Qté
            </span>
            <span className="text-[11px] font-bold uppercase tracking-widest text-foreground">
              Unité
            </span>
            <span className="text-[11px] font-bold uppercase tracking-widest text-foreground">
              P.U. HT
            </span>
            <span className="text-[11px] font-bold uppercase tracking-widest text-foreground">
              TVA
            </span>
            <span className="text-right text-[11px] font-bold uppercase tracking-widest text-foreground">
              Total HT
            </span>
            <span className="w-8" />
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-border border-b border-border">
            {fields.map((field, index) => (
              <LineItemRow
                key={field.id}
                index={index}
                control={control}
                register={register}
                errors={errors}
                productOptions={productOptions}
                onProductSelect={handleProductSelect}
                onRemove={() => remove(index)}
                canRemove={fields.length > 1}
              />
            ))}
          </div>

          {/* Add another line (bottom) */}
          <button
            type="button"
            onClick={() => append({ ...EMPTY_LINE })}
            className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-3 text-xs font-semibold uppercase tracking-wider text-foreground transition-colors hover:border-[#4338CA] hover:bg-[#4338CA]/5 hover:text-[#4338CA]"
          >
            <Plus className="size-4" />
            Ajouter une ligne
          </button>
        </CardContent>
      </Card>

      {/* ─── Bottom: Notes + Totals ───────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Notes */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Notes & Conditions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-xs text-muted-foreground">
                Notes internes
              </Label>
              <Textarea
                id="notes"
                {...register("notes")}
                rows={2}
                placeholder="Notes visibles uniquement par vous..."
                className="resize-none text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="footer" className="text-xs text-muted-foreground">
                Pied de page (conditions)
              </Label>
              <Textarea
                id="footer"
                {...register("footer")}
                rows={2}
                placeholder="Conditions de paiement, mentions légales…"
                className="resize-none text-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Totals Summary */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Calculator className="size-4" />
              Récapitulatif
            </CardTitle>
          </CardHeader>
          <CardContent>
            <GrandTotals control={control} />
          </CardContent>
        </Card>
      </div>

      {/* ─── Submit Error ─────────────────── */}
      {submitError && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
          <AlertCircle className="size-4 text-destructive" />
          <p className="text-sm text-destructive">{submitError}</p>
        </div>
      )}

      {/* ─── Action Bar ──────────────────── */}
      <div className="sticky bottom-0 z-10 -mx-6 -mb-6 border-t border-border bg-background/80 px-6 py-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Les totaux sont calculés automatiquement en temps réel.
          </p>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              className="border-border"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="gap-2 bg-[#4338CA] px-6 text-white hover:bg-[#3730A3]"
            >
              <Save className="size-4" />
              {isSubmitting
                ? "Enregistrement..."
                : isEditing ? `Sauvegarder ${typeLabel}` : `Enregistrer ${typeLabel}`}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

// ═══════════════════════════════════════════════
// LINE ITEM ROW (isolated for performance)
// ═══════════════════════════════════════════════
function LineItemRow({
  index,
  control,
  register,
  errors,
  productOptions,
  onProductSelect,
  onRemove,
  canRemove,
}: {
  index: number;
  control: ReturnType<typeof useForm<DocumentFormValues>>["control"];
  register: ReturnType<typeof useForm<DocumentFormValues>>["register"];
  errors: ReturnType<typeof useForm<DocumentFormValues>>["formState"]["errors"];
  productOptions: ComboboxOption[];
  onProductSelect: (index: number, productId: string) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const lineErrors = errors.lines?.[index];

  return (
    <div className="grid grid-cols-1 gap-3 px-3 py-3 transition-colors hover:bg-muted/20 lg:grid-cols-[1.5fr_2fr_0.6fr_0.6fr_1.2fr_0.8fr_1fr_auto] lg:items-center lg:gap-3">
      {/* Article Picker */}
      <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase tracking-widest text-foreground lg:hidden">
          Article
        </label>
        <Controller
          name={`lines.${index}.productId`}
          control={control}
          render={({ field }) => (
            <ComboboxSearch
              options={productOptions}
              value={field.value || ""}
              onSelect={(val) => {
                field.onChange(val);
                onProductSelect(index, val);
              }}
              placeholder="Choisir..."
              searchPlaceholder="Réf, nom..."
              emptyMessage="Aucun article."
              className="h-9 text-xs border-border"
            />
          )}
        />
      </div>

      {/* Description */}
      <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase tracking-widest text-foreground lg:hidden">
          Description
        </label>
        <Input
          {...register(`lines.${index}.description`)}
          placeholder="Description"
          className={cn(
            "h-9 text-sm border-border",
            lineErrors?.description && "border-destructive"
          )}
        />
      </div>

      {/* Quantity */}
      <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase tracking-widest text-foreground lg:hidden">
          Qté
        </label>
        <Input
          type="number"
          min={1}
          step={1}
          {...register(`lines.${index}.quantity`, { valueAsNumber: true })}
          className={cn(
            "h-9 font-mono text-sm tabular-nums border-border",
            lineErrors?.quantity && "border-destructive"
          )}
        />
      </div>

      {/* Unit */}
      <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase tracking-widest text-foreground lg:hidden">
          Unité
        </label>
        <Input
          {...register(`lines.${index}.unit`)}
          placeholder="unité"
          className="h-9 text-xs text-muted-foreground border-border"
        />
      </div>

      {/* Unit Price HT */}
      <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase tracking-widest text-foreground lg:hidden">
          Prix Unit. HT
        </label>
        <div className="relative">
          <Input
            type="number"
            min={0}
            step={0.01}
            {...register(`lines.${index}.unitPriceHT`, { valueAsNumber: true })}
            className={cn(
              "h-9 pr-8 font-mono text-sm tabular-nums border-border",
              lineErrors?.unitPriceHT && "border-destructive"
            )}
          />
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[10px] font-bold text-foreground">
            DH
          </span>
        </div>
      </div>

      {/* TVA Rate */}
      <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase tracking-widest text-foreground lg:hidden">
          TVA
        </label>
        <Controller
          name={`lines.${index}.tvaRate`}
          control={control}
          render={({ field }) => (
            <select
              value={field.value}
              onChange={(e) => field.onChange(parseFloat(e.target.value))}
              className="flex h-9 w-full items-center rounded-md border border-border bg-transparent px-2 font-mono text-sm tabular-nums transition-colors focus-visible:border-[#4338CA] focus-visible:ring-1 focus-visible:ring-[#4338CA] focus-visible:outline-none"
            >
              {TVA_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-background text-foreground">
                  {opt.label}
                </option>
              ))}
            </select>
          )}
        />
      </div>

      {/* Line Total HT */}
      <div className="flex items-center justify-end space-y-1">
        <label className="mr-2 text-[10px] font-bold uppercase tracking-widest text-foreground lg:hidden">
          Total HT
        </label>
        <LineTotalCell control={control} index={index} />
      </div>

      {/* Delete */}
      <div className="flex items-center justify-center">
        <button
          type="button"
          onClick={onRemove}
          disabled={!canRemove}
          className={cn(
            "flex size-7 items-center justify-center rounded-md text-muted-foreground/50 transition-colors",
            canRemove
              ? "hover:bg-destructive/10 hover:text-destructive"
              : "cursor-not-allowed opacity-30"
          )}
          aria-label="Supprimer la ligne"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// CLIENT PREVIEW (shows details when a client is selected)
// ═══════════════════════════════════════════════
function ClientPreview({
  control,
  clients
}: {
  control: ReturnType<typeof useForm<DocumentFormValues>>["control"];
  clients: any[];
}) {
  const contactId = useWatch({ control, name: "contactId" });
  const client = clients.find((c) => c.$id === contactId);

  if (!client) return null;

  return (
    <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
        <div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Entreprise / Nom
          </span>
          <p className="font-medium">{client.nameOrCompany || client.name || "—"}</p>
        </div>
        <div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Email
          </span>
          <p className="font-medium">{client.email || "—"}</p>
        </div>
        <div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Ville
          </span>
          <p className="text-muted-foreground">{client.city || "—"}</p>
        </div>
        <div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            ICE
          </span>
          <p className="font-mono text-xs text-muted-foreground">
            {client.ice || "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
