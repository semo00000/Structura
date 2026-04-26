"use client";

import * as React from "react";
import { Query, type Models } from "appwrite";
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  Banknote,
  Clock,
  FileText,
  RefreshCw,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

import { APPWRITE_CONFIG, databases } from "@/lib/appwrite";
import { useAuth } from "@/contexts/AuthContext";
import { formatMAD } from "@/lib/validations/document";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Types ───

type InvoiceDoc = {
  id: string;
  number: string;
  status: string;
  totalTTC: number;
  totalPaid: number;
  date: string;
  dueDate: string;
  contactId: string;
};

type ContactDoc = {
  id: string;
  name: string;
};

type DebtorInfo = {
  contactId: string;
  contactName: string;
  totalDebt: number;
  invoiceCount: number;
};

// ─── Helpers ───

function readStr(s: Record<string, unknown>, k: string): string {
  const v = s[k];
  return typeof v === "string" ? v : "";
}
function readNum(s: Record<string, unknown>, k: string): number {
  const v = s[k];
  if (typeof v === "number") return v;
  const p = Number(v);
  return Number.isFinite(p) ? p : 0;
}
function fmtMAD(n: number) {
  return `${formatMAD(n)} DH`;
}

function formatShortDate(d: string): string {
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("fr-MA", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

// ─── Skeleton loaders ───

function KPICardSkeleton() {
  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="size-9 rounded-lg" />
      </CardHeader>
      <CardContent>
        <Skeleton className="mb-2 h-7 w-32" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  );
}

function RowSkeleton() {
  return (
    <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
      <div className="flex items-center gap-3">
        <Skeleton className="size-7 rounded-full" />
        <div className="flex flex-col gap-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <Skeleton className="h-4 w-20" />
    </div>
  );
}

// ─── Main ───

export default function DashboardPage() {
  const { userId } = useAuth();
  const [invoices, setInvoices] = React.useState<InvoiceDoc[]>([]);
  const [contacts, setContacts] = React.useState<ContactDoc[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadDashboard = React.useCallback(async () => {
    const { databaseId, documentsCollectionId, contactsCollectionId } =
      APPWRITE_CONFIG;
    if (!databaseId || !documentsCollectionId || !contactsCollectionId || !userId) {
      setError("Configuration incomplète.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [docsResp, contactsResp] = await Promise.all([
        databases.listDocuments(databaseId, documentsCollectionId, [
          Query.equal("userId", userId),
          Query.equal("type", "FACTURE"),
          Query.orderDesc("$createdAt"),
          Query.limit(100),
        ]),
        databases.listDocuments(databaseId, contactsCollectionId, [
          Query.equal("userId", userId),
          Query.limit(100),
        ]),
      ]);

      setInvoices(
        docsResp.documents.map((d) => {
          const s = d as unknown as Record<string, unknown>;
          return {
            id: d.$id,
            number: readStr(s, "number") || `FAC-${d.$id.slice(0, 6)}`,
            status: readStr(s, "status") || "SENT",
            totalTTC: readNum(s, "totalTTC"),
            totalPaid: readNum(s, "totalPaid"),
            date: readStr(s, "date") || d.$createdAt,
            dueDate: readStr(s, "dueDate") || "",
            contactId: readStr(s, "contactId"),
          };
        })
      );

      setContacts(
        contactsResp.documents.map((d) => {
          const s = d as unknown as Record<string, unknown>;
          return {
            id: d.$id,
            name:
              readStr(s, "nameOrCompany") ||
              readStr(s, "name") ||
              readStr(s, "companyName") ||
              `Client #${d.$id.slice(0, 6)}`,
          };
        })
      );
    } catch {
      setError("Erreur de chargement depuis Appwrite.");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  React.useEffect(() => {
    const t = window.setTimeout(() => void loadDashboard(), 0);
    return () => window.clearTimeout(t);
  }, [loadDashboard]);

  // ─── Compute metrics ───

  const metrics = React.useMemo(() => {
    const totalRevenue = invoices.reduce((s, i) => s + i.totalTTC, 0);
    const totalPaid = invoices.reduce((s, i) => s + i.totalPaid, 0);
    const totalOutstanding = totalRevenue - totalPaid;

    const outstandingInvoices = invoices.filter(
      (i) => i.totalTTC - i.totalPaid > 0.005
    );

    const now = new Date();
    const overdueInvoices = outstandingInvoices.filter((i) => {
      if (!i.dueDate) return false;
      const due = new Date(i.dueDate);
      return !Number.isNaN(due.getTime()) && due < now;
    });

    const contactMap = new Map<string, string>();
    for (const c of contacts) contactMap.set(c.id, c.name);

    // Top debtors
    const debtByContact = new Map<
      string,
      { totalDebt: number; invoiceCount: number }
    >();
    for (const inv of outstandingInvoices) {
      const existing = debtByContact.get(inv.contactId) || {
        totalDebt: 0,
        invoiceCount: 0,
      };
      existing.totalDebt += inv.totalTTC - inv.totalPaid;
      existing.invoiceCount += 1;
      debtByContact.set(inv.contactId, existing);
    }

    const topDebtors: DebtorInfo[] = Array.from(debtByContact.entries())
      .map(([contactId, data]) => ({
        contactId,
        contactName: contactMap.get(contactId) || `Client #${contactId.slice(0, 6)}`,
        totalDebt: Number(data.totalDebt.toFixed(2)),
        invoiceCount: data.invoiceCount,
      }))
      .sort((a, b) => b.totalDebt - a.totalDebt)
      .slice(0, 5);

    return {
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalPaid: Number(totalPaid.toFixed(2)),
      totalOutstanding: Number(totalOutstanding.toFixed(2)),
      outstandingCount: outstandingInvoices.length,
      overdueCount: overdueInvoices.length,
      overdueAmount: Number(
        overdueInvoices
          .reduce((s, i) => s + (i.totalTTC - i.totalPaid), 0)
          .toFixed(2)
      ),
      totalInvoices: invoices.length,
      topDebtors,
      recentInvoices: invoices.slice(0, 5),
    };
  }, [invoices, contacts]);

  // ─── Render ───

  return (
    <div className="flex flex-col gap-5">
      {/* Header row */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight">
            Le Karniy Digital
          </h2>
          <p className="text-xs text-muted-foreground">
            Vue d&apos;ensemble de votre activité et des dettes en cours.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit gap-1.5 text-xs"
          onClick={loadDashboard}
          disabled={isLoading}
        >
          <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Rafraîchir
        </Button>
      </div>

      {/* Error */}
      {error && (
        <Card className="border-red-200">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="size-4" />
              <p className="text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <KPICardSkeleton />
            <KPICardSkeleton />
            <KPICardSkeleton />
            <KPICardSkeleton />
          </>
        ) : (
          <>
            {/* Total Outstanding — THE headline number */}
            <Card className="relative overflow-hidden dark:border-amber-900/40 bg-gradient-to-br from-amber-50/60 to-white dark:from-amber-950/40 dark:to-background border-amber-200/60">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-amber-800/70">
                  Dettes en cours
                </CardTitle>
                <div className="flex size-9 items-center justify-center rounded-lg bg-amber-100">
                  <Wallet className="size-4 text-amber-700" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold tabular-nums tracking-tight text-amber-900 md:text-2xl">
                  {fmtMAD(metrics.totalOutstanding)}
                </div>
                <p className="mt-0.5 text-[10px] text-amber-700/70 md:text-xs">
                  {metrics.outstandingCount} facture{metrics.outstandingCount > 1 ? "s" : ""} impayée{metrics.outstandingCount > 1 ? "s" : ""}
                </p>
              </CardContent>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-amber-400 to-amber-200" />
            </Card>

            {/* Revenue */}
            <Card className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Chiffre d&apos;affaires
                </CardTitle>
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                  <TrendingUp className="size-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold tabular-nums tracking-tight md:text-2xl">
                  {fmtMAD(metrics.totalRevenue)}
                </div>
                <p className="mt-0.5 text-[10px] text-muted-foreground md:text-xs">
                  {metrics.totalInvoices} facture{metrics.totalInvoices > 1 ? "s" : ""}
                </p>
              </CardContent>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-primary/40 to-primary/0" />
            </Card>

            {/* Cash Received */}
            <Card className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Encaissements
                </CardTitle>
                <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-100">
                  <Banknote className="size-4 text-emerald-700" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold tabular-nums tracking-tight text-emerald-700 md:text-2xl">
                  {fmtMAD(metrics.totalPaid)}
                </div>
                <p className="mt-0.5 text-[10px] text-muted-foreground md:text-xs">
                  Total reçu
                </p>
              </CardContent>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-emerald-400/40 to-emerald-200/0" />
            </Card>

            {/* Overdue */}
            <Card className={`relative overflow-hidden ${metrics.overdueCount > 0 ? "border-red-200/60 dark:border-red-900/40 bg-gradient-to-br from-red-50/60 to-white dark:from-red-950/40 dark:to-background" : ""}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  En retard
                </CardTitle>
                <div className={`flex size-9 items-center justify-center rounded-lg ${metrics.overdueCount > 0 ? "bg-red-100" : "bg-muted"}`}>
                  <Clock className={`size-4 ${metrics.overdueCount > 0 ? "text-red-600" : "text-muted-foreground"}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-xl font-bold tabular-nums tracking-tight md:text-2xl ${metrics.overdueCount > 0 ? "text-red-700" : ""}`}>
                  {metrics.overdueCount > 0 ? fmtMAD(metrics.overdueAmount) : "—"}
                </div>
                <p className="mt-0.5 text-[10px] text-muted-foreground md:text-xs">
                  {metrics.overdueCount > 0
                    ? `${metrics.overdueCount} facture${metrics.overdueCount > 1 ? "s" : ""} en retard`
                    : "Aucune facture en retard"}
                </p>
              </CardContent>
              {metrics.overdueCount > 0 && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-red-400 to-red-200" />
              )}
            </Card>
          </>
        )}
      </div>

      {/* Bottom section: Top Debtors + Recent Invoices */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top Debtors — THE money card */}
        <Card>
          <CardHeader className="border-b pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Users className="size-4 text-amber-600" />
                Top débiteurs
              </CardTitle>
              {!isLoading && (
                <Badge variant="secondary" className="text-[10px]">
                  {metrics.topDebtors.length} client{metrics.topDebtors.length > 1 ? "s" : ""}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="divide-y">
                <RowSkeleton />
                <RowSkeleton />
                <RowSkeleton />
              </div>
            ) : metrics.topDebtors.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-emerald-50">
                  <Banknote className="size-5 text-emerald-500" />
                </div>
                <p className="text-sm font-medium text-emerald-700">
                  Aucune dette en cours
                </p>
                <p className="text-xs text-muted-foreground">
                  Tous vos clients sont à jour. 🎉
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {metrics.topDebtors.map((d, i) => (
                  <div
                    key={d.contactId}
                    className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-7 items-center justify-center rounded-full bg-amber-100/80 text-xs font-bold text-amber-800">
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{d.contactName}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {d.invoiceCount} facture{d.invoiceCount > 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-sm font-semibold tabular-nums text-amber-800">
                      {fmtMAD(d.totalDebt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card>
          <CardHeader className="border-b pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm">
                <FileText className="size-4 text-primary" />
                Factures récentes
              </CardTitle>
              {!isLoading && (
                <Badge variant="secondary" className="text-[10px]">
                  {metrics.recentInvoices.length} dernières
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="divide-y">
                <RowSkeleton />
                <RowSkeleton />
                <RowSkeleton />
              </div>
            ) : metrics.recentInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-blue-50">
                  <FileText className="size-5 text-primary" />
                </div>
                <p className="text-sm font-medium">
                  Aucune facture
                </p>
                <p className="text-xs text-muted-foreground">
                  Créez votre première facture pour commencer.
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {metrics.recentInvoices.map((inv) => {
                  const remaining = Math.max(inv.totalTTC - inv.totalPaid, 0);
                  const isPaid = remaining < 0.01;
                  return (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={isPaid ? "default" : inv.totalPaid > 0 ? "secondary" : "outline"}
                          className="w-16 justify-center text-[10px]"
                        >
                          {isPaid ? "PAYÉE" : inv.totalPaid > 0 ? "PARTIEL" : "DUE"}
                        </Badge>
                        <div>
                          <p className="font-mono text-xs font-medium">{inv.number}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {formatShortDate(inv.date)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-sm font-semibold tabular-nums">
                          {fmtMAD(inv.totalTTC)}
                        </p>
                        {!isPaid && (
                          <p className="font-mono text-[10px] tabular-nums text-amber-700">
                            Reste: {fmtMAD(remaining)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
