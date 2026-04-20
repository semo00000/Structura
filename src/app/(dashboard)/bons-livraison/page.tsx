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
import { Truck, Plus, Search, Filter, RefreshCw, AlertCircle } from "lucide-react";

type BonLivraisonListItem = {
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
  PREPARED: "border-amber-300 text-amber-700 bg-amber-50",
  SHIPPED: "border-blue-300 text-blue-700 bg-blue-50",
  DELIVERED: "border-green-400 text-green-800 bg-green-50",
  CANCELLED: "border-red-300 text-red-600 bg-red-50",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  PREPARED: "Préparé",
  SHIPPED: "Expédié",
  DELIVERED: "Livré",
  CANCELLED: "Annulé",
};

function mapBonLivraisonDocument(document: Models.Document, contacts: any[]): BonLivraisonListItem {
  const source = document as unknown as Record<string, unknown>;
  const contactId = readString(source, "contactId");
  const contact = contacts.find((entry) => entry.$id === contactId);

  return {
    id: document.$id,
    number: readString(source, "number") || `BL-${document.$id.slice(0, 6)}`,
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
      name: contact?.nameOrCompany || contact?.name || "Client Inconnu",
      companyName: contact?.category === "COMPANY" ? contact.nameOrCompany : "",
      city: contact?.city || "",
      ice: contact?.ice || "",
    },
  };
}

export default function BonsLivraisonPage() {
  const [documents, setDocuments] = React.useState<BonLivraisonListItem[]>([]);
  const [search, setSearch] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadBonsLivraison = React.useCallback(async () => {
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
          Query.equal("type", "BON_LIVRAISON"),
          Query.orderDesc("$createdAt"),
          Query.limit(100),
        ]),
        databases.listDocuments(databaseId, "contacts", [
          Query.equal("userId", user.$id),
          Query.equal("type", "CLIENT"),
          Query.limit(100),
        ])
      ]);

      setDocuments(docsResp.documents.map(doc => mapBonLivraisonDocument(doc, contactsResp.documents)));
    } catch {
      setError("Impossible de charger les bons de livraison depuis Appwrite.");
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadBonsLivraison();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadBonsLivraison]);

  const filteredDocuments = React.useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) {
      return documents;
    }

    return documents.filter((doc) => {
      const clientLabel = (doc.contact.companyName || doc.contact.name).toLowerCase();
      return doc.number.toLowerCase().includes(keyword) || clientLabel.includes(keyword);
    });
  }, [documents, search]);

  return (
    <PageTransition className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <Truck className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Bons de Livraison</h1>
            <p className="text-xs text-muted-foreground">
              Suivez les expéditions et livraisons de vos commandes clients
            </p>
          </div>
        </div>
        <Button className="gap-2" nativeButton={false} render={<Link href="/bons-livraison/new" />}>
          <Plus className="size-4" />
          Nouveau Bon de Livraison
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
                placeholder="Rechercher par numéro, client..."
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
              onClick={loadBonsLivraison}
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
                  <th className="px-4 py-3 font-medium">Client</th>
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
                  <Truck className="size-8 text-primary/30" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">
                  Aucun bon de livraison
                </h3>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Créez un bon de livraison pour accompagner les expéditions de marchandises à vos clients.
                </p>
                <Button className="mt-4 gap-2" size="sm" nativeButton={false} render={<Link href="/bons-livraison/new" />}>
                  <Plus className="size-4" />
                  Créer un bon de livraison
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
                  <th className="px-4 py-3 font-medium">Client</th>
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
