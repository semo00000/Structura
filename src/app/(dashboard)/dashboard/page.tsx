"use client";

import * as React from "react";
import { Query, type Models } from "appwrite";
import { AlertCircle, FileText, Files, RefreshCw, TrendingUp } from "lucide-react";

import { APPWRITE_CONFIG, account, databases } from "@/lib/appwrite";
import { formatMAD } from "@/lib/validations/document";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DashboardDocument = {
  id: string;
  type: string;
  number: string;
  status: string;
  totalTTC: number;
  date: string;
  contactId: string;
};

function toErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Erreur Appwrite inconnue.";
}

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

function mapDocument(document: Models.Document): DashboardDocument {
  const source = document as unknown as Record<string, unknown>;

  return {
    id: document.$id,
    type: readString(source, "type") || "",
    number: readString(source, "number") || `DOC-${document.$id.slice(0, 6)}`,
    status: readString(source, "status") || "DRAFT",
    totalTTC: readNumber(source, "totalTTC"),
    date: readString(source, "date") || document.$createdAt,
    contactId: readString(source, "contactId"),
  };
}

function formatMADWithDh(amount: number): string {
  return `${formatMAD(amount)} DH`;
}

function formatDocumentDate(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("fr-MA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function statusLabel(status: string): string {
  if (status === "PAID") return "Payee";
  if (status === "PENDING") return "En attente";
  if (status === "SENT") return "Envoyee";
  if (status === "CANCELLED") return "Annulee";
  return "Brouillon";
}

function statusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  if (status === "PAID") return "default";
  if (status === "PENDING" || status === "SENT") return "secondary";
  if (status === "CANCELLED") return "destructive";
  return "outline";
}

export default function DashboardPage() {
  const [documents, setDocuments] = React.useState<DashboardDocument[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadDashboard = React.useCallback(async () => {
    const { databaseId, documentsCollectionId } = APPWRITE_CONFIG;

    if (!databaseId || !documentsCollectionId) {
      setError("Configuration Appwrite incomplete. Verifiez .env.local.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const user = await account.get();

      const response = await databases.listDocuments(databaseId, documentsCollectionId, [
        Query.equal("userId", user.$id),
        Query.orderDesc("$createdAt"),
        Query.limit(100),
      ]);

      setDocuments(response.documents.map(mapDocument));
    } catch (loadError) {
      setError(`Impossible de charger le dashboard depuis Appwrite: ${toErrorMessage(loadError)}`);
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadDashboard();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadDashboard]);

  const metrics = React.useMemo(() => {
    const factures = documents.filter((document) => document.type === "FACTURE");
    const paidFactures = factures.filter((document) => document.status === "PAID");
    const pendingFactures = factures.filter(
      (document) => document.status === "SENT" || document.status === "PENDING"
    );
    const devis = documents.filter((document) => document.type === "DEVIS");

    const revenue = paidFactures.reduce((total, document) => total + document.totalTTC, 0);

    return {
      revenue,
      facturesEnCours: pendingFactures.length,
      totalDocuments: documents.length,
      totalDevis: devis.length,
    };
  }, [documents]);

  const kpiCards = React.useMemo(
    () => [
      {
        title: "Chiffre d'affaires",
        value: formatMADWithDh(metrics.revenue),
        icon: TrendingUp,
        description: "Total TTC des factures payees",
      },
      {
        title: "Factures en cours",
        value: String(metrics.facturesEnCours),
        icon: FileText,
        description: "Factures en attente de paiement",
      },
      {
        title: "Documents total",
        value: String(metrics.totalDocuments),
        icon: Files,
        description: "Tous les documents Appwrite",
      },
      {
        title: "Devis total",
        value: String(metrics.totalDevis),
        icon: FileText,
        description: "Devis crees",
      },
    ],
    [metrics]
  );

  const recentDocuments = documents.slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={loadDashboard}
          disabled={isLoading}
        >
          <RefreshCw className="size-3.5" />
          Rafraichir
        </Button>
      </div>

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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;

          return (
            <Card key={card.title} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="size-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight">{card.value}</div>
                <div className="mt-1 text-xs text-muted-foreground">{card.description}</div>
              </CardContent>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-primary/40 to-primary/0" />
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Documents recents</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {recentDocuments.length} dernier{recentDocuments.length > 1 ? "s" : ""}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Chargement des documents...
            </p>
          ) : recentDocuments.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Aucun document recent.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 font-medium">N° Document</th>
                    <th className="pb-3 font-medium">Client</th>
                    <th className="pb-3 font-medium">Montant TTC</th>
                    <th className="pb-3 font-medium">Statut</th>
                    <th className="pb-3 text-right font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentDocuments.map((document) => (
                    <tr
                      key={document.id}
                      className="border-b border-border/50 transition-colors last:border-0 hover:bg-muted/30"
                    >
                      <td className="py-3 font-mono text-xs font-semibold text-primary">
                        {document.number}
                      </td>
                      <td className="py-3">
                        {document.contactId
                          ? `Client #${document.contactId.slice(0, 6)}`
                          : "Client"}
                      </td>
                      <td className="py-3 font-medium">{formatMADWithDh(document.totalTTC)}</td>
                      <td className="py-3">
                        <Badge variant={statusVariant(document.status)} className="text-[11px]">
                          {statusLabel(document.status)}
                        </Badge>
                      </td>
                      <td className="py-3 text-right text-muted-foreground">
                        {formatDocumentDate(document.date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
