"use client";

import * as React from "react";
import { Query } from "appwrite";
import { APPWRITE_CONFIG, account, databases } from "@/lib/appwrite";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageTransition } from "@/components/ui/page-transition";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { usePlan } from "@/contexts/PlanContext";
import {
  Package,
  Search,
  RefreshCw,
  AlertTriangle,
  TrendingDown,
  BarChart3,
  ArrowUpDown,
  Boxes,
  Crown,
  Lock,
} from "lucide-react";

type StockItem = {
  id: string;
  name: string;
  reference: string;
  unit: string;
  stock: number;
  sellingPriceHT: number;
  tvaRate: number;
  type: string;
};

type SortKey = "name" | "reference" | "stock" | "stockValue";
type SortDir = "asc" | "desc";

function formatMAD(amount: number): string {
  return new Intl.NumberFormat("fr-MA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function StockBadge({ quantity }: { quantity: number }) {
  if (quantity === 0) {
    return (
      <Badge variant="destructive" className="text-[10px]">
        Rupture
      </Badge>
    );
  }
  if (quantity <= 5) {
    return (
      <Badge className="border-red-200 bg-red-50 text-[10px] text-red-700">
        Critique ({quantity})
      </Badge>
    );
  }
  if (quantity <= 10) {
    return (
      <Badge className="border-amber-200 bg-amber-50 text-[10px] text-amber-700">
        Faible ({quantity})
      </Badge>
    );
  }
  return (
    <Badge className="border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700">
      En stock ({quantity})
    </Badge>
  );
}

export default function StockPage() {
  const { limits, setShowUpgradeModal } = usePlan();

  // Pillar 4: Route-level paywall for Stock
  if (!limits.stockEnabled) {
    return (
      <PageTransition>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Card className="max-w-md border-amber-200/50 bg-gradient-to-br from-amber-50/50 to-white">
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-amber-100">
                <Lock className="size-7 text-amber-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Gestion de Stock</h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                La gestion de stock est réservée aux plans <strong>Pro</strong> et <strong>Business</strong>.
                Passez à un plan supérieur pour gérer vos inventaires, suivre les niveaux de stock et recevoir
                des alertes de rupture.
              </p>
              <Button
                onClick={() => setShowUpgradeModal(true)}
                className="mt-2 gap-2 bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] text-white shadow-lg shadow-blue-500/25 hover:shadow-xl"
              >
                <Crown className="size-4" />
                Passer au Plan Pro
              </Button>
            </CardContent>
          </Card>
        </div>
      </PageTransition>
    );
  }

  return <StockContent />;
}

function StockContent() {
  const [items, setItems] = React.useState<StockItem[]>([]);
  const [search, setSearch] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [sortKey, setSortKey] = React.useState<SortKey>("stock");
  const [sortDir, setSortDir] = React.useState<SortDir>("asc");

  const loadStock = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const user = await account.get();
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.productsCollectionId,
        [
          Query.equal("userId", user.$id),
          Query.limit(200),
        ]
      );

      const mapped: StockItem[] = response.documents
        .filter((doc: any) => doc.type !== "SERVICE")
        .map((doc: any) => ({
          id: doc.$id,
          name: doc.name || "",
          reference: doc.reference || "",
          unit: doc.unit || "unité",
          stock: Number(doc.stock) || 0,
          sellingPriceHT: Number(doc.sellingPriceHT) || 0,
          tvaRate: Number(doc.tvaRate) || 0,
          type: doc.type || "PRODUCT",
        }));

      setItems(mapped);
    } catch {
      setError("Impossible de charger les données de stock depuis Appwrite.");
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadStock();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadStock]);

  // ─── Computed values ───────────────────────
  const totalProducts = items.length;
  const outOfStock = items.filter((i) => i.stock === 0).length;
  const lowStock = items.filter((i) => i.stock > 0 && i.stock <= 10).length;
  const totalStockValue = items.reduce(
    (sum, i) => sum + i.stock * i.sellingPriceHT,
    0
  );
  const totalUnits = items.reduce((sum, i) => sum + i.stock, 0);

  // ─── Filter & Sort ────────────────────────
  const filtered = React.useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return items;
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(keyword) ||
        i.reference.toLowerCase().includes(keyword)
    );
  }, [items, search]);

  const sorted = React.useMemo(() => {
    return [...filtered].sort((a, b) => {
      let diff = 0;
      switch (sortKey) {
        case "stock":
          diff = a.stock - b.stock;
          break;
        case "stockValue":
          diff =
            a.stock * a.sellingPriceHT - b.stock * b.sellingPriceHT;
          break;
        case "name":
          diff = a.name.localeCompare(b.name);
          break;
        case "reference":
          diff = a.reference.localeCompare(b.reference);
          break;
      }
      return sortDir === "asc" ? diff : -diff;
    });
  }, [filtered, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  // ─── Render ────────────────────────────────
  return (
    <PageTransition className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <Package className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              Gestion du Stock
            </h1>
            <p className="text-xs text-muted-foreground">
              Suivi en temps réel des niveaux de stock par produit
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={loadStock}
          disabled={isLoading}
        >
          <RefreshCw className="size-3.5" />
          Rafraîchir
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500/10">
                <Boxes className="size-4 text-blue-600" />
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Références
                </p>
                <p className="text-xl font-bold tabular-nums">
                  {isLoading ? "—" : totalProducts}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10">
                <BarChart3 className="size-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Valeur Stock
                </p>
                <p className="text-xl font-bold tabular-nums">
                  {isLoading ? "—" : `${formatMAD(totalStockValue)}`}
                  <span className="ml-0.5 text-xs font-normal text-muted-foreground">
                    DH
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10">
                <TrendingDown className="size-4 text-amber-600" />
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Stock faible
                </p>
                <p className="text-xl font-bold tabular-nums text-amber-600">
                  {isLoading ? "—" : lowStock}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-red-500/10">
                <AlertTriangle className="size-4 text-red-600" />
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Ruptures
                </p>
                <p className="text-xl font-bold tabular-nums text-red-600">
                  {isLoading ? "—" : outOfStock}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert Banner */}
      {!isLoading && outOfStock > 0 && (
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="size-4" />
              <p className="text-sm font-medium">
                {outOfStock} produit{outOfStock > 1 ? "s" : ""} en rupture de
                stock — passez une commande fournisseur pour réapprovisionner.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <Card className="border-slate-200">
        <CardContent className="py-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par nom ou référence..."
                className="h-9 w-full rounded-md border border-input bg-transparent pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/50 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
              />
            </div>
            <div className="text-xs text-muted-foreground tabular-nums">
              {totalUnits} unités en stock
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Card className="border-red-200">
          <CardContent className="py-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="size-4" />
              <p className="text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stock Table */}
      {isLoading ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Réf.</th>
                  <th className="px-4 py-3 font-medium">Désignation</th>
                  <th className="px-4 py-3 font-medium">Unité</th>
                  <th className="px-4 py-3 text-right font-medium">Quantité</th>
                  <th className="px-4 py-3 text-right font-medium">Prix Unit. HT</th>
                  <th className="px-4 py-3 text-right font-medium">Valeur Stock</th>
                  <th className="px-4 py-3 text-center font-medium">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <TableSkeleton columns={7} rows={5} />
              </tbody>
            </table>
          </div>
        </Card>
      ) : sorted.length === 0 ? (
        <Card>
          <CardContent>
            <div className="flex min-h-[280px] items-center justify-center rounded-lg border border-dashed border-border">
              <div className="text-center">
                <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/5">
                  <Package className="size-8 text-primary/30" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">
                  Aucun produit en stock
                </h3>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Ajoutez des produits depuis la page Produits & Services pour suivre votre inventaire.
                </p>
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
                  <th className="px-4 py-3 font-medium">
                    <button
                      onClick={() => toggleSort("reference")}
                      className="inline-flex items-center gap-1"
                    >
                      Réf.
                      <ArrowUpDown className="size-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 font-medium">
                    <button
                      onClick={() => toggleSort("name")}
                      className="inline-flex items-center gap-1"
                    >
                      Désignation
                      <ArrowUpDown className="size-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 font-medium">Unité</th>
                  <th className="px-4 py-3 text-right font-medium">
                    <button
                      onClick={() => toggleSort("stock")}
                      className="inline-flex items-center gap-1"
                    >
                      Quantité
                      <ArrowUpDown className="size-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    Prix Unit. HT
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    <button
                      onClick={() => toggleSort("stockValue")}
                      className="inline-flex items-center gap-1"
                    >
                      Valeur Stock
                      <ArrowUpDown className="size-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sorted.map((item) => {
                  const stockValue = item.stock * item.sellingPriceHT;
                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors hover:bg-muted/30 ${
                        item.stock === 0
                          ? "bg-red-50/40"
                          : item.stock <= 5
                          ? "bg-amber-50/30"
                          : ""
                      }`}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {item.reference || "—"}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {item.name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {item.unit}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums">
                        {item.stock}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm tabular-nums text-muted-foreground">
                        {formatMAD(item.sellingPriceHT)} DH
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums">
                        {formatMAD(stockValue)} DH
                      </td>
                      <td className="px-4 py-3">
                        <StockBadge quantity={item.stock} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t-2 border-border bg-muted/30">
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-3 text-sm font-semibold text-foreground"
                  >
                    Total
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold tabular-nums">
                    {totalUnits}
                  </td>
                  <td className="px-4 py-3" />
                  <td className="px-4 py-3 text-right font-mono font-bold tabular-nums text-primary">
                    {formatMAD(totalStockValue)} DH
                  </td>
                  <td className="px-4 py-3" />
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}
    </PageTransition>
  );
}
