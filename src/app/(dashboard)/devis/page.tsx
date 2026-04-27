"use client";

import * as React from "react";
import Link from "next/link";
import { Query, type Models } from "appwrite";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { APPWRITE_CONFIG, databases } from "@/lib/appwrite";
import { useAuth } from "@/contexts/AuthContext";
import { DocumentActionsMenu } from "@/components/documents/DocumentActionsMenu";
import { generateDocumentPDF } from "@/lib/pdf-generator";
import { getStatusLabel, getStatusStyle } from "@/lib/document-helpers";
import { formatMAD } from "@/lib/validations/document";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageTransition } from "@/components/ui/page-transition";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { FileText, Plus, Search, RefreshCw, AlertCircle } from "lucide-react";

type DevisListItem = {
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

function readString(source: Record<string, unknown>, key: string): string {
  const value = source[key];
  return typeof value === "string" ? value : "";
}

function readNumber(source: Record<string, unknown>, key: string): number {
  const value = source[key];
  if (typeof value === "number") return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function mapDevisDocument(document: Models.Document, contacts: any[]): DevisListItem {
  const source = document as unknown as Record<string, unknown>;
  const contactId = readString(source, "contactId");
  const contact = contacts.find((entry) => entry.$id === contactId);

  return {
    id: document.$id,
    number: readString(source, "number") || `DEV-${document.$id.slice(0, 6)}`,
    date: readString(source, "date") || document.$createdAt,
    status: readString(source, "status") || "DRAFT",
    totalTTC: readNumber(source, "totalTTC"),
    totalHT: readNumber(source, "totalHT"),
    totalTVA: readNumber(source, "totalTVA"),
    dueDate: readString(source, "dueDate") || null,
    notes: readString(source, "notes"),
    footer: readString(source, "footer"),
    linesJson: readString(source, "linesJson"),
    contactId,
    contact: {
      name: contact?.nameOrCompany || contact?.name || "Client Inconnu",
      companyName: contact?.category === "COMPANY" ? contact.nameOrCompany : "",
      city: contact?.city || "",
      ice: contact?.ice || "",
    },
  };
}

export default function DevisPage() {
  const { userId } = useAuth();
  const [documents, setDocuments] = React.useState<DevisListItem[]>([]);
  const [companyProfile, setCompanyProfile] = React.useState<any>(null);
  const [search, setSearch] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadDevis = React.useCallback(async () => {
    const { databaseId, documentsCollectionId, companyCollectionId } = APPWRITE_CONFIG;
    if (!databaseId || !documentsCollectionId || !userId) {
      setError("Configuration Appwrite incomplète ou session invalide.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [docsResp, contactsResp, companyResp] = await Promise.all([
        databases.listDocuments(databaseId, documentsCollectionId, [
          Query.equal("userId", userId),
          Query.equal("type", "DEVIS"),
          Query.orderDesc("$createdAt"),
          Query.limit(100),
        ]),
        databases.listDocuments(databaseId, "contacts", [
          Query.equal("userId", userId),
          Query.limit(100),
        ]),
        databases.listDocuments(databaseId, companyCollectionId, [
          Query.equal("userId", userId),
          Query.limit(1),
        ])
      ]);
      setDocuments(docsResp.documents.map(doc => mapDevisDocument(doc, contactsResp.documents)));
      if (companyResp.documents.length > 0) {
        const src = companyResp.documents[0] as unknown as Record<string, unknown>;
        setCompanyProfile({
          companyName: readString(src, "companyName") || readString(src, "name") || "",
          address: readString(src, "address"),
          city: readString(src, "city"),
          telephone: readString(src, "telephone"),
          email: readString(src, "email"),
          ice: readString(src, "ice"),
          rc: readString(src, "rc"),
          ifValue: readString(src, "ifValue"),
          patente: readString(src, "patente"),
          cnss: readString(src, "cnss"),
          logoUrl: readString(src, "logoUrl"),
        });
      }
    } catch {
      setError("Impossible de charger les devis depuis Appwrite.");
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  React.useEffect(() => {
    const tid = window.setTimeout(() => void loadDevis(), 0);
    return () => window.clearTimeout(tid);
  }, [loadDevis]);

  function handleStatusChange(docId: string, newStatus: string) {
    setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: newStatus } : d));
  }
  function handleDelete(docId: string) {
    setDocuments(prev => prev.filter(d => d.id !== docId));
  }

  async function handleDownloadPDF(doc: DevisListItem) {
    if (!companyProfile) { alert("Profil entreprise manquant."); return; }
    let lines: any[] = [];
    if (doc.linesJson) { try { lines = JSON.parse(doc.linesJson); } catch {} }
    await generateDocumentPDF(
      { type: "DEVIS", number: doc.number, date: new Date(doc.date), dueDate: doc.dueDate ? new Date(doc.dueDate) : null, totalHT: doc.totalHT, totalTVA: doc.totalTVA, totalTTC: doc.totalTTC, notes: doc.notes, footer: doc.footer, lines } as any,
      companyProfile,
      { name: doc.contact.name, companyName: doc.contact.companyName, city: doc.contact.city, ice: doc.contact.ice },
      { subscriptionTier: "PRO" }
    );
  }

  const filteredDocuments = React.useMemo(() => {
    const kw = search.trim().toLowerCase();
    if (!kw) return documents;
    return documents.filter((doc) => {
      const label = (doc.contact.companyName || doc.contact.name).toLowerCase();
      return doc.number.toLowerCase().includes(kw) || label.includes(kw);
    });
  }, [documents, search]);

  return (
    <PageTransition className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <FileText className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Devis</h1>
            <p className="text-xs text-muted-foreground">{documents.length} devis</p>
          </div>
        </div>
        <Button className="gap-2" nativeButton={false} render={<Link href="/devis/new" />}>
          <Plus className="size-4" />
          <span className="hidden sm:inline">Nouveau Devis</span>
          <span className="sm:hidden">Nouveau</span>
        </Button>
      </div>

      <Card className="border-slate-200">
        <CardContent className="py-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher par numéro, client..." className="h-9 w-full rounded-md border border-input bg-transparent pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/50 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30" />
            </div>
            <Button type="button" variant="outline" size="sm" className="gap-1.5 text-xs" onClick={loadDevis} disabled={isLoading}>
              <RefreshCw className="size-3.5" /><span className="hidden sm:inline">Rafraîchir</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200"><CardContent className="py-6"><div className="flex items-center gap-2 text-red-700"><AlertCircle className="size-4" /><p className="text-sm">{error}</p></div></CardContent></Card>
      )}

      {isLoading ? (
        <Card><div className="overflow-x-auto"><table className="w-full whitespace-nowrap text-left text-sm"><thead className="bg-muted/50 text-muted-foreground"><tr><th className="px-4 py-3 font-medium">N° Devis</th><th className="px-4 py-3 font-medium">Date</th><th className="px-4 py-3 font-medium">Client</th><th className="px-4 py-3 font-medium">Statut</th><th className="px-4 py-3 text-right font-medium">Total TTC</th><th className="px-4 py-3 text-right font-medium">Actions</th></tr></thead><tbody className="divide-y divide-border"><TableSkeleton columns={6} rows={5} /></tbody></table></div></Card>
      ) : filteredDocuments.length === 0 ? (
        <Card><CardContent><div className="flex min-h-[320px] items-center justify-center rounded-lg border border-dashed border-border"><div className="text-center"><div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/5"><FileText className="size-8 text-primary/30" /></div><h3 className="text-sm font-semibold text-foreground">Aucun devis</h3><p className="mt-1 max-w-sm text-sm text-muted-foreground">Créez votre premier devis pour proposer vos services et produits à vos clients.</p><Button className="mt-4 gap-2" size="sm" nativeButton={false} render={<Link href="/devis/new" />}><Plus className="size-4" />Créer un devis</Button></div></div></CardContent></Card>
      ) : (
        <>
          {/* Mobile Cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {filteredDocuments.map((doc) => (
              <Card key={doc.id} className="transition-colors hover:bg-muted/20">
                <CardContent className="py-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold">{doc.number}</span>
                        <Badge variant="outline" className={`text-[10px] uppercase ${getStatusStyle(doc.status)}`}>{getStatusLabel(doc.status)}</Badge>
                      </div>
                      <p className="text-sm text-foreground">{doc.contact.companyName || doc.contact.name}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(doc.date), "dd MMM yyyy", { locale: fr })}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold tabular-nums">{`${formatMAD(doc.totalTTC)} DH`}</span>
                      <DocumentActionsMenu document={doc} type="DEVIS" onStatusChange={handleStatusChange} onDelete={handleDelete} onDownloadPDF={() => handleDownloadPDF(doc)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop Table */}
          <Card className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full whitespace-nowrap text-left text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">N° Devis</th>
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
                      <td className="px-4 py-3 font-mono font-medium text-foreground">{doc.number}</td>
                      <td className="px-4 py-3 text-muted-foreground">{format(new Date(doc.date), "dd MMM yyyy", { locale: fr })}</td>
                      <td className="px-4 py-3 text-foreground">{doc.contact.companyName || doc.contact.name}</td>
                      <td className="px-4 py-3"><Badge variant="outline" className={`text-[10px] uppercase ${getStatusStyle(doc.status)}`}>{getStatusLabel(doc.status)}</Badge></td>
                      <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums">{`${formatMAD(doc.totalTTC)} DH`}</td>
                      <td className="px-4 py-3 text-right"><DocumentActionsMenu document={doc} type="DEVIS" onStatusChange={handleStatusChange} onDelete={handleDelete} onDownloadPDF={() => handleDownloadPDF(doc)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </PageTransition>
  );
}
