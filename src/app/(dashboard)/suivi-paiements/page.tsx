"use client";

import * as React from "react";
import { Query, type Models } from "appwrite";
import {
  AlertCircle,
  ArrowRight,
  Banknote,
  CheckCircle2,
  CreditCard,
  Loader2,
  RefreshCw,
  Users,
} from "lucide-react";

import { APPWRITE_CONFIG, databases } from "@/lib/appwrite";
import { formatMAD } from "@/lib/validations/document";
import { useAuth } from "@/contexts/AuthContext";
import {
  applyFIFOPayment,
  getContactDebtSummary,
  type PaymentAllocation,
  type PaymentMethod,
} from "@/lib/fifo-reconciliation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ─── Types ───────────────────────────────────

type ContactItem = {
  id: string;
  name: string;
  type: string;
};

type InvoiceItem = {
  id: string;
  number: string;
  status: string;
  totalTTC: number;
  totalPaid: number;
  date: string;
  contactId: string;
};

const paymentMethods: PaymentMethod[] = ["ESPECES", "VIREMENT", "CHEQUE", "CARTE"];

function fmtMAD(v: number) {
  return `${formatMAD(v)} DH`;
}

function readStr(s: Record<string, unknown>, k: string) {
  const v = s[k];
  return typeof v === "string" ? v : "";
}
function readNum(s: Record<string, unknown>, k: string) {
  const v = s[k];
  if (typeof v === "number") return v;
  const p = Number(v);
  return Number.isFinite(p) ? p : 0;
}

// ─── Component ───────────────────────────────

export default function SuiviPaiementsPage() {
  const { userId } = useAuth();

  // Data
  const [contacts, setContacts] = React.useState<ContactItem[]>([]);
  const [invoices, setInvoices] = React.useState<InvoiceItem[]>([]);
  const [debtSummary, setDebtSummary] = React.useState<{
    totalDebt: number;
    totalPaid: number;
    totalRemaining: number;
    outstandingCount: number;
  } | null>(null);

  // Form
  const [selectedContactId, setSelectedContactId] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [paymentDate, setPaymentDate] = React.useState(
    new Date().toISOString().split("T")[0]
  );
  const [method, setMethod] = React.useState<PaymentMethod>("ESPECES");
  const [reference, setReference] = React.useState("");
  const [notes, setNotes] = React.useState("");

  // State
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successResult, setSuccessResult] = React.useState<{
    message: string;
    allocations: PaymentAllocation[];
    surplus: number;
  } | null>(null);

  // ─── Load contacts ─────────────────────────

  const loadContacts = React.useCallback(async () => {
    if (!userId) return;
    const { databaseId, contactsCollectionId } = APPWRITE_CONFIG;
    if (!databaseId || !contactsCollectionId) return;

    setIsLoading(true);
    try {
      const resp = await databases.listDocuments(databaseId, contactsCollectionId, [
        Query.equal("userId", userId),
        Query.equal("type", "CLIENT"),
        Query.limit(100),
      ]);
      setContacts(
        resp.documents.map((d) => ({
          id: d.$id,
          name: (d as unknown as Record<string, unknown>).nameOrCompany as string || "Client",
          type: "CLIENT",
        }))
      );
    } catch {
      setError("Impossible de charger les clients.");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  React.useEffect(() => {
    void loadContacts();
  }, [loadContacts]);

  // ─── Load invoices + debt when contact changes ─

  const loadContactData = React.useCallback(
    async (contactId: string) => {
      if (!userId || !contactId) {
        setInvoices([]);
        setDebtSummary(null);
        return;
      }

      const { databaseId, documentsCollectionId } = APPWRITE_CONFIG;
      if (!databaseId || !documentsCollectionId) return;

      try {
        const [docsResp, summary] = await Promise.all([
          databases.listDocuments(databaseId, documentsCollectionId, [
            Query.equal("userId", userId),
            Query.equal("contactId", contactId),
            Query.equal("type", "FACTURE"),
            Query.orderAsc("$createdAt"),
            Query.limit(100),
          ]),
          getContactDebtSummary(userId, contactId),
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
              contactId: readStr(s, "contactId"),
            };
          })
        );
        setDebtSummary(summary);
      } catch {
        setError("Impossible de charger les factures du client.");
      }
    },
    [userId]
  );

  React.useEffect(() => {
    if (selectedContactId) {
      void loadContactData(selectedContactId);
    } else {
      setInvoices([]);
      setDebtSummary(null);
    }
  }, [selectedContactId, loadContactData]);

  // ─── FIFO Payment Submit ───────────────────

  async function handleFIFOPayment(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessResult(null);

    if (!userId || !selectedContactId) {
      setError("Sélectionnez un client.");
      return;
    }

    const paymentAmount = Number(amount);
    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      setError("Le montant doit être supérieur à 0.");
      return;
    }

    setIsSaving(true);
    try {
      const result = await applyFIFOPayment({
        userId,
        contactId: selectedContactId,
        amount: paymentAmount,
        method,
        paymentDate,
        reference,
        notes,
      });

      if (!result.success) {
        setError(result.error || "Échec du paiement.");
        return;
      }

      const invoiceCount = result.allocations.length;
      setSuccessResult({
        message: `✅ ${fmtMAD(result.totalApplied)} appliqué sur ${invoiceCount} facture${invoiceCount > 1 ? "s" : ""} (FIFO).${result.surplus > 0 ? ` Surplus: ${fmtMAD(result.surplus)}` : ""}`,
        allocations: result.allocations,
        surplus: result.surplus,
      });

      // Reset form & reload data
      setAmount("");
      setReference("");
      setNotes("");
      void loadContactData(selectedContactId);
    } catch {
      setError("Erreur réseau lors du paiement.");
    } finally {
      setIsSaving(false);
    }
  }

  // ─── Contact name helper ───────────────────

  const selectedContact = contacts.find((c) => c.id === selectedContactId);

  // ─── Render ────────────────────────────────

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
          <Banknote className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-semibold tracking-tight">
            Paiements FIFO — Le Karniy Digital
          </h1>
          <p className="text-xs text-muted-foreground">
            Sélectionnez un client, entrez le montant, les factures les plus anciennes sont soldées en premier.
          </p>
        </div>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="size-4 text-primary" />
            Enregistrer un paiement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-5">
          <form onSubmit={handleFIFOPayment} className="grid gap-4 lg:grid-cols-2">
            {/* Client selector */}
            <div className="space-y-1.5 lg:col-span-2">
              <Label htmlFor="contact">Client (Boulangerie)</Label>
              <Select
                value={selectedContactId}
                onValueChange={(val) => {
                  setSelectedContactId(val);
                  setSuccessResult(null);
                  setError(null);
                }}
                disabled={isLoading}
              >
                <SelectTrigger id="contact" className="w-full">
                  <SelectValue placeholder="— Sélectionner un client —" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Debt summary card */}
            {debtSummary && selectedContactId && (
              <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 lg:col-span-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-amber-800">
                      Dette totale — {selectedContact?.name}
                    </p>
                    <p className="mt-1 text-2xl font-bold tabular-nums text-amber-900">
                      {fmtMAD(debtSummary.totalRemaining)}
                    </p>
                  </div>
                  <div className="text-right text-xs text-amber-700">
                    <p>{debtSummary.outstandingCount} facture{debtSummary.outstandingCount > 1 ? "s" : ""} impayée{debtSummary.outstandingCount > 1 ? "s" : ""}</p>
                    <p>Total facturé: {fmtMAD(debtSummary.totalDebt)}</p>
                    <p>Déjà payé: {fmtMAD(debtSummary.totalPaid)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Amount */}
            <div className="space-y-1.5">
              <Label htmlFor="amount">Montant reçu (MAD)</Label>
              <Input
                id="amount"
                type="number"
                min={0}
                step={0.01}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="font-mono tabular-nums"
                placeholder="0.00"
              />
            </div>

            {/* Date */}
            <div className="space-y-1.5">
              <Label htmlFor="paymentDate">Date</Label>
              <Input
                id="paymentDate"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="font-mono"
              />
            </div>

            {/* Method */}
            <div className="space-y-1.5">
              <Label htmlFor="method">Méthode</Label>
              <Select
                value={method}
                onValueChange={(val) => setMethod(val as PaymentMethod)}
              >
                <SelectTrigger id="method" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reference */}
            <div className="space-y-1.5">
              <Label htmlFor="reference">Référence</Label>
              <Input
                id="reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Chèque #12345"
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5 lg:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes internes sur ce paiement"
              />
            </div>

            {/* Submit */}
            <div className="flex items-center justify-end gap-3 lg:col-span-2">
              <Button
                type="submit"
                disabled={isSaving || isLoading || !selectedContactId || !amount}
                className="gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Traitement FIFO...
                  </>
                ) : (
                  <>
                    <Banknote className="size-4" />
                    Appliquer le paiement (FIFO)
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="size-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Success + Allocation Breakdown */}
          {successResult && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                <CheckCircle2 className="size-4 shrink-0" />
                {successResult.message}
              </div>

              {/* Allocation detail */}
              <div className="rounded-lg border">
                <div className="border-b bg-muted/30 px-4 py-2">
                  <p className="text-xs font-semibold text-muted-foreground">
                    Détail de la répartition FIFO
                  </p>
                </div>
                <div className="divide-y">
                  {successResult.allocations.map((alloc) => (
                    <div
                      key={alloc.invoiceId}
                      className="flex items-center justify-between px-4 py-2.5 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <ArrowRight className="size-3 text-primary" />
                        <span className="font-mono text-xs font-medium">
                          {alloc.invoiceNumber}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-muted-foreground">
                          {fmtMAD(alloc.invoiceTotalBefore)} → {fmtMAD(alloc.invoiceTotalAfter)}
                        </span>
                        <span className="font-mono text-xs font-semibold text-emerald-700">
                          +{fmtMAD(alloc.allocatedAmount)}
                        </span>
                        <Badge
                          variant={alloc.newStatus === "PAID" ? "default" : "secondary"}
                          className="text-[10px]"
                        >
                          {alloc.newStatus === "PAID" ? "SOLDÉE" : "PARTIEL"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice breakdown table */}
      {selectedContactId && invoices.length > 0 && (
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">
                Factures — {selectedContact?.name}
              </CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void loadContactData(selectedContactId)}
                className="gap-1.5 text-xs"
              >
                <RefreshCw className="size-3" />
                Rafraîchir
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full whitespace-nowrap text-left text-sm">
                <thead className="border-b bg-muted/30 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">N°</th>
                    <th className="px-4 py-2.5 font-medium">Statut</th>
                    <th className="px-4 py-2.5 text-right font-medium">Total TTC</th>
                    <th className="px-4 py-2.5 text-right font-medium">Payé</th>
                    <th className="px-4 py-2.5 text-right font-medium">Reste</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {invoices.map((inv) => {
                    const remaining = Math.max(inv.totalTTC - inv.totalPaid, 0);
                    const isPaid = remaining < 0.01;
                    return (
                      <tr
                        key={inv.id}
                        className={isPaid ? "bg-emerald-50/30" : "hover:bg-muted/20"}
                      >
                        <td className="px-4 py-2.5 font-medium">{inv.number}</td>
                        <td className="px-4 py-2.5">
                          <Badge
                            variant={
                              isPaid
                                ? "default"
                                : inv.totalPaid > 0
                                  ? "secondary"
                                  : "outline"
                            }
                            className="text-[10px] uppercase"
                          >
                            {isPaid ? "PAYÉE" : inv.totalPaid > 0 ? "PARTIEL" : "IMPAYÉE"}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                          {fmtMAD(inv.totalTTC)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono tabular-nums text-emerald-700">
                          {fmtMAD(inv.totalPaid)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono tabular-nums text-amber-700">
                          {fmtMAD(remaining)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
