"use client";

import * as React from "react";
import Link from "next/link";
import { Query, type Models } from "appwrite";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { APPWRITE_CONFIG, databases } from "@/lib/appwrite";
import { useAuth } from "@/contexts/AuthContext";
import { DocumentActionsMenu } from "@/components/documents/DocumentActionsMenu";
import { getStatusLabel, getStatusStyle } from "@/lib/document-helpers";
import { formatMAD } from "@/lib/validations/document";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageTransition } from "@/components/ui/page-transition";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { FileCheck, Plus, Search, RefreshCw, AlertCircle } from "lucide-react";

type AvoirListItem = {
  id: string; number: string; date: string; status: string;
  totalTTC: number; totalHT: number; totalTVA: number;
  dueDate?: string | null; notes?: string; footer?: string;
  linesJson?: string; contactId?: string;
  contact: { name: string; companyName?: string; city?: string; ice?: string };
};

function readStr(s: Record<string, unknown>, k: string) { const v = s[k]; return typeof v === "string" ? v : ""; }
function readNum(s: Record<string, unknown>, k: string) { const v = s[k]; return typeof v === "number" ? v : Number.isFinite(Number(v)) ? Number(v) : 0; }

function mapDoc(d: Models.Document, contacts: any[]): AvoirListItem {
  const s = d as unknown as Record<string, unknown>;
  const cid = readStr(s, "contactId");
  const c = contacts.find(e => e.$id === cid);
  return { id: d.$id, number: readStr(s, "number") || `AV-${d.$id.slice(0,6)}`, date: readStr(s, "date") || d.$createdAt, status: readStr(s, "status") || "DRAFT", totalTTC: readNum(s, "totalTTC"), totalHT: readNum(s, "totalHT"), totalTVA: readNum(s, "totalTVA"), dueDate: readStr(s, "dueDate") || null, notes: readStr(s, "notes"), footer: readStr(s, "footer"), linesJson: readStr(s, "linesJson"), contactId: cid, contact: { name: c?.nameOrCompany || c?.name || "Client Inconnu", companyName: c?.category === "COMPANY" ? c.nameOrCompany : "", city: c?.city || "", ice: c?.ice || "" } };
}

export default function AvoirsPage() {
  const { userId } = useAuth();
  const [docs, setDocs] = React.useState<AvoirListItem[]>([]);
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!userId) return;
    const { databaseId, documentsCollectionId } = APPWRITE_CONFIG;
    if (!databaseId || !documentsCollectionId) { setError("Config manquante"); setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const [dr, cr] = await Promise.all([
        databases.listDocuments(databaseId, documentsCollectionId, [Query.equal("userId", userId), Query.equal("type", "AVOIR"), Query.orderDesc("$createdAt"), Query.limit(100)]),
        databases.listDocuments(databaseId, "contacts", [Query.equal("userId", userId), Query.limit(100)])
      ]);
      setDocs(dr.documents.map(d => mapDoc(d, cr.documents)));
    } catch { setError("Impossible de charger les avoirs."); setDocs([]); }
    finally { setLoading(false); }
  }, [userId]);

  React.useEffect(() => { const t = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(t); }, [load]);

  const onStatus = (id: string, s: string) => setDocs(p => p.map(d => d.id === id ? { ...d, status: s } : d));
  const onDel = (id: string) => setDocs(p => p.filter(d => d.id !== id));

  const filtered = React.useMemo(() => {
    const kw = search.trim().toLowerCase();
    if (!kw) return docs;
    return docs.filter(d => { const l = (d.contact.companyName || d.contact.name).toLowerCase(); return d.number.toLowerCase().includes(kw) || l.includes(kw); });
  }, [docs, search]);

  const fmt = (n: number) => `${formatMAD(n)} DH`;

  return (
    <PageTransition className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10"><FileCheck className="size-5 text-primary" /></div>
          <div><h1 className="text-lg font-semibold tracking-tight">Avoirs</h1><p className="text-xs text-muted-foreground">{docs.length} avoir{docs.length !== 1 ? "s" : ""}</p></div>
        </div>
        <Button className="gap-2" nativeButton={false} render={<Link href="/avoirs/new" />}><Plus className="size-4" /><span className="hidden sm:inline">Nouvel Avoir</span><span className="sm:hidden">Nouveau</span></Button>
      </div>

      <Card className="border-slate-200"><CardContent className="py-3"><div className="flex items-center gap-3"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" /><input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="h-9 w-full rounded-md border border-input bg-transparent pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/50 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30" /></div><Button type="button" variant="outline" size="sm" className="gap-1.5 text-xs" onClick={load} disabled={loading}><RefreshCw className="size-3.5" /></Button></div></CardContent></Card>

      {error && <Card className="border-red-200"><CardContent className="py-6"><div className="flex items-center gap-2 text-red-700"><AlertCircle className="size-4" /><p className="text-sm">{error}</p></div></CardContent></Card>}

      {loading ? (
        <Card><div className="overflow-x-auto"><table className="w-full whitespace-nowrap text-left text-sm"><thead className="bg-muted/50 text-muted-foreground"><tr><th className="px-4 py-3 font-medium">N°</th><th className="px-4 py-3 font-medium">Date</th><th className="px-4 py-3 font-medium">Client</th><th className="px-4 py-3 font-medium">Statut</th><th className="px-4 py-3 text-right font-medium">TTC</th><th className="px-4 py-3 text-right font-medium">Actions</th></tr></thead><tbody className="divide-y divide-border"><TableSkeleton columns={6} rows={5} /></tbody></table></div></Card>
      ) : filtered.length === 0 ? (
        <Card><CardContent><div className="flex min-h-[320px] items-center justify-center rounded-lg border border-dashed border-border"><div className="text-center"><div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/5"><FileCheck className="size-8 text-primary/30" /></div><h3 className="text-sm font-semibold">Aucun avoir</h3><p className="mt-1 max-w-sm text-sm text-muted-foreground">Émettez un avoir pour annuler ou corriger une facture.</p><Button className="mt-4 gap-2" size="sm" nativeButton={false} render={<Link href="/avoirs/new" />}><Plus className="size-4" />Créer un avoir</Button></div></div></CardContent></Card>
      ) : (
        <>
          <div className="flex flex-col gap-3 md:hidden">
            {filtered.map(d => (
              <Card key={d.id}><CardContent className="py-3"><div className="flex items-start justify-between"><div className="flex-1 space-y-1"><div className="flex items-center gap-2"><span className="font-mono text-sm font-semibold">{d.number}</span><Badge variant="outline" className={`text-[10px] uppercase ${getStatusStyle(d.status)}`}>{getStatusLabel(d.status)}</Badge></div><p className="text-sm">{d.contact.companyName || d.contact.name}</p><p className="text-xs text-muted-foreground">{format(new Date(d.date), "dd MMM yyyy", { locale: fr })}</p></div><div className="flex items-center gap-2"><span className="font-mono text-sm font-bold tabular-nums">{fmt(d.totalTTC)}</span><DocumentActionsMenu document={d} type="AVOIR" onStatusChange={onStatus} onDelete={onDel} /></div></div></CardContent></Card>
            ))}
          </div>
          <Card className="hidden md:block"><div className="overflow-x-auto"><table className="w-full whitespace-nowrap text-left text-sm"><thead className="bg-muted/50 text-muted-foreground"><tr><th className="px-4 py-3 font-medium">N° Avoir</th><th className="px-4 py-3 font-medium">Date</th><th className="px-4 py-3 font-medium">Client</th><th className="px-4 py-3 font-medium">Statut</th><th className="px-4 py-3 text-right font-medium">Total TTC</th><th className="px-4 py-3 text-right font-medium">Actions</th></tr></thead><tbody className="divide-y divide-border">{filtered.map(d => (<tr key={d.id} className="transition-colors hover:bg-muted/30"><td className="px-4 py-3 font-mono font-medium">{d.number}</td><td className="px-4 py-3 text-muted-foreground">{format(new Date(d.date), "dd MMM yyyy", { locale: fr })}</td><td className="px-4 py-3">{d.contact.companyName || d.contact.name}</td><td className="px-4 py-3"><Badge variant="outline" className={`text-[10px] uppercase ${getStatusStyle(d.status)}`}>{getStatusLabel(d.status)}</Badge></td><td className="px-4 py-3 text-right font-mono font-semibold tabular-nums">{fmt(d.totalTTC)}</td><td className="px-4 py-3 text-right"><DocumentActionsMenu document={d} type="AVOIR" onStatusChange={onStatus} onDelete={onDel} /></td></tr>))}</tbody></table></div></Card>
        </>
      )}
    </PageTransition>
  );
}
