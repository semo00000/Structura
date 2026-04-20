"use client";

import * as React from "react";
import Link from "next/link";
import { Query, type Models } from "appwrite";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { APPWRITE_CONFIG, account, databases } from "@/lib/appwrite";
import { DownloadPDFButton } from "@/components/documents/DownloadPDFButton";
import { formatMAD } from "@/lib/validations/document";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageTransition } from "@/components/ui/page-transition";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { ShoppingCart, Plus, Search, Filter, RefreshCw, AlertCircle } from "lucide-react";

type BonCommandeListItem = {
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
  contact: {
    name: string;
    companyName?: string;
    city?: string;
    ice?: string;
  };
};

function readString(source: Record<string, unknown>, key: string): string {
  const value = source[key];
  return typeof value === "string" ? value : "";
}

function readNumber(source: Record<string, unknown>, key: string): number {
  const value = source[key];
  if (typeof value === "number") {
    return value;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMADWithDh(amount: number): string {
  return `${formatMAD(amount)} DH`;
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "border-slate-300 text-slate-600",
  SENT: "border-blue-300 text-blue-700 bg-blue-50",
  CONFIRMED: "border-emerald-300 text-emerald-700 bg-emerald-50",
  RECEIVED: "border-green-400 text-green-800 bg-green-50",
  CANCELLED: "border-red-300 text-red-600 bg-red-50",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  SENT: "Envoyé",
  CONFIRMED: "Confirmé",
  RECEIVED: "Reçu",
  CANCELLED: "Annulé",
};

function mapBonCommandeDocument(document: Models.Document, contacts: any[]): BonCommandeListItem {
  const source = document as unknown as Record<string, unknown>;
  const contactId = readString(source, "contactId");
  const contact = contacts.find((entry) => entry.$id === contactId);

  return {
    id: document.$id,
    number: readString(source, "number") || `BC-${document.$id.slice(0, 6)}`,
    date: readString(source, "date") || document.$createdAt,
    status: readString(source, "status") || "DRAFT",
    totalTTC: readNumber(source, "totalTTC"),
    totalHT: readNumber(source, "totalHT"),
    totalTVA: readNumber(source, "totalTVA"),
    dueDate: readString(source, "dueDate") || null,
    notes: readString(source, "notes"),
    footer: readString(source, "footer"),
    linesJson: readString(source, "linesJson"),
    contact: {
      name: contact?.nameOrCompany || contact?.name || "Fournisseur Inconnu",
      companyName: contact?.category === "COMPANY" ? contact.nameOrCompany : "",
      city: contact?.city || "",
      ice: contact?.ice || "",
    },
  };
}

export default function BonsCommandePage() {
  const [documents, setDocuments] = React.useState<BonCommandeListItem[]>([]);
  const [search, setSearch] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadBonsCommande = React.useCallback(async () => {
    const { databaseId, documentsCollectionId } = APPWRITE_CONFIG;

    if (!databaseId || !documentsCollectionId) {
      setError("Configuration Appwrite incomplète. Vérifiez .env.local.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const user = await account.get();

      const [docsResp, contactsResp] = await Promise.all([
        databases.listDocuments(databaseId, documentsCollectionId, [
          Query.equal("userId", user.$id),
          Query.equal("type", "BON_COMMANDE"),
          Query.orderDesc("$createdAt"),
          Query.limit(100),
        ]),
        databases.listDocuments(databaseId, "contacts", [
          Query.equal("userId", user.$id),
          Query.equal("type", "FOURNISSEUR"),
          Query.limit(100),
        ])
      ]);

      setDocuments(docsResp.documents.map(doc => mapBonCommandeDocument(doc, contactsResp.documents)));
    } catch {
      setError("Impossible de charger les bons de commande depuis Appwrite.");
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadBonsCommande();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadBonsCommande]);

  const filteredDocuments = React.useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) {
      return documents;
    }

    return documents.filter((doc) => {
      const supplierLabel = (doc.contact.companyName || doc.contact.name).toLowerCase();
      return doc.number.toLowerCase().includes(keyword) || supplierLabel.includes(keyword);
    });
  }, [documents, search]);

  return (
    <PageTransition className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <ShoppingCart className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Bons de Commande</h1>
            <p className="text-xs text-muted-foreground">
              Commandes fournisseurs synchronisées avec Appwrite
            </p>
          </div>
        </div>
        <Button className="gap-2" nativeButton={false} render={<Link href="/bons-commande/new" />}>
          <Plus className="size-4" />
          Nouveau Bon de Commande
        </Button>
      </div>

      <Card className="border-slate-200">
        <CardContent className="py-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher par numéro, fournisseur..."
                className="h-9 w-full rounded-md border border-input bg-transparent pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/50 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
              />
            </div>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" type="button">
              <Filter className="size-3.5" />
              Filtres
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={loadBonsCommande}
              disabled={isLoading}
            >
              <RefreshCw className="size-3.5" />
              Rafraîchir
            </Button>
          </div>
        </CardContent>
      </Card>

      {error ? (
        <Card className="border-red-200">
          <CardContent className="py-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="size-4" />
              <p className="text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {isLoading ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">N° Document</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Fournisseur</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 text-right font-medium">Total TTC</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <TableSkeleton columns={6} rows={5} />
              </tbody>
            </table>
          </div>
        </Card>
      ) : filteredDocuments.length === 0 ? (
        <Card>
          <CardContent>
            <div className="flex min-h-[320px] items-center justify-center rounded-lg border border-dashed border-border">
              <div className="text-center">
                <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/5">
                  <ShoppingCart className="size-8 text-primary/30" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">
                  Aucun bon de commande
                </h3>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Créez votre premier bon de commande pour passer des commandes auprès de vos fournisseurs.
                </p>
                <Button className="mt-4 gap-2" size="sm" nativeButton={false} render={<Link href="/bons-commande/new" />}>
                  <Plus className="size-4" />
                  Créer un bon de commande
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">N° Document</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Fournisseur</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 text-right font-medium">Total TTC</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">{doc.number}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {format(new Date(doc.date), "dd MMM yyyy", { locale: fr })}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {doc.contact.companyName || doc.contact.name}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={`text-[10px] uppercase ${STATUS_STYLES[doc.status] || ""}`}
                      >
                        {STATUS_LABELS[doc.status] || doc.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums">
                      {formatMADWithDh(doc.totalTTC)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DownloadPDFButton document={doc} contact={doc.contact} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </PageTransition>
  );
}
