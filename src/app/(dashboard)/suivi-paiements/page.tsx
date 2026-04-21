"use client";

import * as React from "react";
import { Query, type Models } from "appwrite";
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Loader2,
  RefreshCw,
} from "lucide-react";

import { APPWRITE_CONFIG, databases } from "@/lib/appwrite";
import { formatMAD } from "@/lib/validations/document";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

type InvoiceStatus = "DRAFT" | "SENT" | "PENDING" | "PAID" | "CANCELLED";

type InvoiceItem = {
  id: string;
  number: string;
  status: InvoiceStatus;
  totalTTC: number;
  totalPaid: number;
  date: string;
  dueDate?: string | null;
  contactLabel: string;
};

const paymentMethods = ["VIREMENT", "CHEQUE", "ESPECES", "CARTE"] as const;

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

function formatMADWithDh(value: number): string {
  return `${formatMAD(value)} DH`;
}

function normalizeStatus(value: string): InvoiceStatus {
  if (value === "PAID") return "PAID";
  if (value === "PENDING") return "PENDING";
  if (value === "SENT") return "SENT";
  if (value === "CANCELLED") return "CANCELLED";
  return "DRAFT";
}

function computeStatus(totalPaid: number, totalTTC: number): InvoiceStatus {
  if (totalPaid >= totalTTC && totalTTC > 0) {
    return "PAID";
  }

  if (totalPaid > 0) {
    return "PENDING";
  }

  return "SENT";
}

function mapInvoice(document: Models.Document, contacts: any[]): InvoiceItem {
  const source = document as unknown as Record<string, unknown>;
  const contactId = readString(source, "contactId");
  const contact = contacts.find((entry) => entry.$id === contactId);

  return {
    id: document.$id,
    number: readString(source, "number") || `FAC-${document.$id.slice(0, 6)}`,
    status: normalizeStatus(readString(source, "status")),
    totalTTC: readNumber(source, "totalTTC"),
    totalPaid: readNumber(source, "totalPaid"),
    date: readString(source, "date") || document.$createdAt,
    dueDate: readString(source, "dueDate") || null,
    contactLabel: contact?.nameOrCompany || contact?.name || "Client Inconnu",
  };
}

export default function SuiviPaiementsPage() {
  const [invoices, setInvoices] = React.useState<InvoiceItem[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [paymentDate, setPaymentDate] = React.useState(
    new Date().toISOString().split("T")[0]
  );
  const [method, setMethod] = React.useState<(typeof paymentMethods)[number]>(
    "VIREMENT"
  );
  const [reference, setReference] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const { userId } = useAuth();

  const loadInvoices = React.useCallback(async () => {
    if (!userId) return;

    const { databaseId, documentsCollectionId } = APPWRITE_CONFIG;

    if (!databaseId || !documentsCollectionId) {
      setError("Configuration Appwrite incomplète. Vérifiez .env.local.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { contactsCollectionId } = APPWRITE_CONFIG;
      if (!contactsCollectionId) return;

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
        ])
      ]);

      setInvoices(docsResp.documents.map(d => mapInvoice(d, contactsResp.documents)));
    } catch {
      setError("Impossible de charger les factures depuis Appwrite.");
      setInvoices([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  React.useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadInvoices();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadInvoices]);

  const selectedInvoice = React.useMemo(
    () => invoices.find((invoice) => invoice.id === selectedInvoiceId),
    [invoices, selectedInvoiceId]
  );

  const remainingAmount = selectedInvoice
    ? Math.max(selectedInvoice.totalTTC - selectedInvoice.totalPaid, 0)
    : 0;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const { databaseId, documentsCollectionId } = APPWRITE_CONFIG;
    if (!databaseId || !documentsCollectionId) {
      setError("Configuration Appwrite incomplète. Vérifiez .env.local.");
      return;
    }

    if (!selectedInvoice) {
      setError("Sélectionnez une facture à mettre à jour.");
      return;
    }

    const paymentAmount = Number(amount);
    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      setError("Le montant du paiement doit être supérieur à 0.");
      return;
    }

    setIsSaving(true);
    try {
      const newTotalPaid = Number((selectedInvoice.totalPaid + paymentAmount).toFixed(2));
      const newStatus = computeStatus(newTotalPaid, selectedInvoice.totalTTC);

      await databases.updateDocument(databaseId, documentsCollectionId, selectedInvoice.id, {
        totalPaid: newTotalPaid,
        status: newStatus,
      });

      setInvoices((current) =>
        current.map((invoice) =>
          invoice.id === selectedInvoice.id
            ? {
                ...invoice,
                totalPaid: newTotalPaid,
                status: newStatus,
              }
            : invoice
        )
      );

      setSuccess(
        `Paiement enregistré (${formatMADWithDh(paymentAmount)} via ${method}). Statut mis à jour: ${newStatus}.`
      );
      setAmount("");
      setReference("");
      setNotes("");
      setPaymentDate(new Date().toISOString().split("T")[0]);
    } catch {
      setError("Échec de mise à jour de la facture dans Appwrite.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <CreditCard className="size-5 text-[#2563EB]" />
            Suivi des Paiements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-5">
          <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-1.5 lg:col-span-2">
              <Label htmlFor="invoice">Facture</Label>
              <select
                id="invoice"
                value={selectedInvoiceId}
                onChange={(event) => setSelectedInvoiceId(event.target.value)}
                className="flex h-9 w-full items-center rounded-md border border-input bg-transparent px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
              >
                <option value="">Sélectionner une facture</option>
                {invoices.map((invoice) => (
                  <option key={invoice.id} value={invoice.id}>
                    {invoice.number} - {invoice.contactLabel}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="amount">Montant (MAD)</Label>
              <Input
                id="amount"
                type="number"
                min={0}
                step={0.01}
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="font-mono tabular-nums"
                placeholder="0.00"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="paymentDate">Date de paiement</Label>
              <Input
                id="paymentDate"
                type="date"
                value={paymentDate}
                onChange={(event) => setPaymentDate(event.target.value)}
                className="font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="method">Méthode</Label>
              <select
                id="method"
                value={method}
                onChange={(event) =>
                  setMethod(event.target.value as (typeof paymentMethods)[number])
                }
                className="flex h-9 w-full items-center rounded-md border border-input bg-transparent px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
              >
                {paymentMethods.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reference">Référence</Label>
              <Input
                id="reference"
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                placeholder="Virement #12345"
              />
            </div>

            <div className="space-y-1.5 lg:col-span-2">
              <Label htmlFor="notes">Notes internes</Label>
              <Textarea
                id="notes"
                rows={2}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Informations complémentaires sur ce paiement"
              />
            </div>

            <div className="flex items-center justify-between gap-3 lg:col-span-2">
              <p className="text-xs text-muted-foreground">
                {selectedInvoice
                  ? `Reste à payer: ${formatMADWithDh(remainingAmount)}`
                  : "Sélectionnez une facture pour voir le solde restant."}
              </p>
              <Button
                type="submit"
                disabled={isSaving || isLoading || !selectedInvoiceId}
                className="gap-2 bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  "Enregistrer le paiement"
                )}
              </Button>
            </div>
          </form>

          {error ? (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="size-4" />
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              <CheckCircle2 className="size-4" />
              {success}
            </div>
          ) : null}

          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            <h3 className="text-sm font-semibold">État des factures</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={loadInvoices}
              disabled={isLoading}
              className="gap-1.5 text-xs"
            >
              <RefreshCw className="size-3.5" />
              Rafraîchir
            </Button>
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">
              Chargement des factures depuis Appwrite...
            </p>
          ) : invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune facture disponible dans la collection documents.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full whitespace-nowrap text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">N°</th>
                    <th className="px-4 py-2.5 font-medium">Client</th>
                    <th className="px-4 py-2.5 font-medium">Statut</th>
                    <th className="px-4 py-2.5 text-right font-medium">Total TTC</th>
                    <th className="px-4 py-2.5 text-right font-medium">Payé</th>
                    <th className="px-4 py-2.5 text-right font-medium">Reste</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {invoices.map((invoice) => {
                    const remaining = Math.max(invoice.totalTTC - invoice.totalPaid, 0);

                    return (
                      <tr key={invoice.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-2.5 font-medium text-slate-900">{invoice.number}</td>
                        <td className="px-4 py-2.5 text-slate-700">{invoice.contactLabel}</td>
                        <td className="px-4 py-2.5">
                          <Badge variant="outline" className="text-[10px] uppercase">
                            {invoice.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono tabular-nums text-slate-900">
                          {formatMADWithDh(invoice.totalTTC)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono tabular-nums text-emerald-700">
                          {formatMADWithDh(invoice.totalPaid)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono tabular-nums text-amber-700">
                          {formatMADWithDh(remaining)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
