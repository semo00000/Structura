"use client";

import * as React from "react";
import { Query, type Models } from "appwrite";
import {
  BarChart3,
  TrendingUp,
  AlertCircle,
  FileText,
  Users,
  RefreshCw,
} from "lucide-react";

import { APPWRITE_CONFIG, account, databases } from "@/lib/appwrite";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatistiquesChart } from "./StatistiquesChart";

type InvoiceStatus = "DRAFT" | "SENT" | "PENDING" | "PAID" | "CANCELLED";

type InvoiceStat = {
  id: string;
  date: string;
  totalTTC: number;
  status: InvoiceStatus;
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

function normalizeStatus(value: string): InvoiceStatus {
  if (value === "PAID") return "PAID";
  if (value === "PENDING") return "PENDING";
  if (value === "SENT") return "SENT";
  if (value === "CANCELLED") return "CANCELLED";
  return "DRAFT";
}

function mapInvoice(document: Models.Document): InvoiceStat {
  const source = document as unknown as Record<string, unknown>;

  return {
    id: document.$id,
    date: readString(source, "date") || document.$createdAt,
    totalTTC: readNumber(source, "totalTTC"),
    status: normalizeStatus(readString(source, "status")),
    contactId: readString(source, "contactId"),
  };
}

const monthNames = [
  "Jan",
  "Fev",
  "Mar",
  "Avr",
  "Mai",
  "Juin",
  "Juil",
  "Aout",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function StatistiquesPage() {
  const [invoices, setInvoices] = React.useState<InvoiceStat[]>([]);
  const [contacts, setContacts] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const currentYear = new Date().getFullYear();

  const loadStats = React.useCallback(async () => {
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
      const { contactsCollectionId } = APPWRITE_CONFIG;
      if (!contactsCollectionId) return;

      const [response, contactsResponse] = await Promise.all([
        databases.listDocuments(databaseId, documentsCollectionId, [
          Query.equal("userId", user.$id),
          Query.equal("type", "FACTURE"),
          Query.orderDesc("$createdAt"),
          Query.limit(100),
        ]),
        databases.listDocuments(databaseId, contactsCollectionId, [
          Query.equal("userId", user.$id),
          Query.limit(100),
        ])
      ]);

      setInvoices(response.documents.map(mapInvoice));
      setContacts(contactsResponse.documents);
    } catch (loadError) {
      const appwriteMessage = toErrorMessage(loadError);

      if (appwriteMessage.toLowerCase().includes("userid")) {
        setError(
          "Impossible de charger les statistiques: ajoutez l'attribut/index userId sur la collection documents dans Appwrite."
        );
      } else {
        setError(`Impossible de charger les statistiques depuis Appwrite: ${appwriteMessage}`);
      }

      setInvoices([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadStats();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadStats]);

  const stats = React.useMemo(() => {
    const yearlyInvoices = invoices.filter((invoice) => {
      const year = new Date(invoice.date).getFullYear();
      return Number.isFinite(year) && year === currentYear;
    });

    const paidInvoices = yearlyInvoices.filter((invoice) => invoice.status === "PAID");
    const pendingInvoices = yearlyInvoices.filter(
      (invoice) => invoice.status === "SENT" || invoice.status === "PENDING"
    );

    const revenue = paidInvoices.reduce((total, invoice) => total + invoice.totalTTC, 0);
    const pendingAmount = pendingInvoices.reduce(
      (total, invoice) => total + invoice.totalTTC,
      0
    );

    const monthlyData = Array.from({ length: 12 }, (_, index) => ({
      name: monthNames[index],
      total: 0,
    }));

    paidInvoices.forEach((invoice) => {
      const month = new Date(invoice.date).getMonth();
      if (month >= 0 && month < 12) {
        monthlyData[month].total += invoice.totalTTC;
      }
    });

    const topClientsMap = new Map<string, { totalRevenue: number; documentCount: number }>();

    paidInvoices.forEach((invoice) => {
      const key = invoice.contactId || "unknown";
      const existing = topClientsMap.get(key) || { totalRevenue: 0, documentCount: 0 };

      topClientsMap.set(key, {
        totalRevenue: existing.totalRevenue + invoice.totalTTC,
        documentCount: existing.documentCount + 1,
      });
    });

    const topClients = Array.from(topClientsMap.entries())
      .map(([contactId, value]) => {
        const contact = contacts.find((entry) => entry.$id === contactId);

        return {
          id: contactId,
          name: contact?.nameOrCompany || contact?.name || "Client Inconnu",
          totalRevenue: value.totalRevenue,
          documentCount: value.documentCount,
        };
      })
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5);

    return {
      totalFacturesCount: yearlyInvoices.length,
      revenue,
      pendingAmount,
      monthlyData,
      topClients,
    };
  }, [currentYear, invoices]);

  return (
    <div className="flex flex-col gap-6">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <BarChart3 className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Statistiques</h1>
            <p className="text-xs text-muted-foreground">
              Vue d&apos;ensemble de vos performances ({currentYear})
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={loadStats}
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

      {isLoading ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Chargement des statistiques depuis Appwrite...
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Chiffre d&apos;Affaires</CardTitle>
                <TrendingUp className="size-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="font-mono text-2xl font-bold text-primary">
                  {stats.revenue.toLocaleString("fr-MA", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  DH
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Sur les factures payees en {currentYear}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">En Attente</CardTitle>
                <AlertCircle className="size-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="font-mono text-2xl font-bold text-orange-600">
                  {stats.pendingAmount.toLocaleString("fr-MA", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  DH
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Factures envoyees ou en attente
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Factures Emises</CardTitle>
                <FileText className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="font-mono text-2xl font-bold">
                  {stats.totalFacturesCount}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Volume total de factures generees
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-7">
            <Card className="md:col-span-4 lg:col-span-5">
              <CardHeader>
                <CardTitle>Evolution du Revenu</CardTitle>
                <CardDescription>
                  Croissance mensuelle du chiffre d&apos;affaires encaisse
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <StatistiquesChart data={stats.monthlyData} />
              </CardContent>
            </Card>

            <Card className="flex flex-col md:col-span-3 lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="size-4" />
                  Meilleurs Clients
                </CardTitle>
                <CardDescription>Top 5 de vos clients en {currentYear}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                {stats.topClients.length === 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-sm text-muted-foreground">Pas de donnees client</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {stats.topClients.map((client) => (
                      <div key={client.id} className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">{client.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {client.documentCount} facture
                            {client.documentCount > 1 ? "s" : ""}
                          </p>
                        </div>
                        <div className="font-mono text-sm font-medium">
                          {client.totalRevenue.toLocaleString("fr-MA", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
