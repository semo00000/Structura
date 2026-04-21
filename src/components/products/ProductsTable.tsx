"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Package,
} from "lucide-react";
import { ID, Query } from "appwrite";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ProductModal } from "./ProductModal";
import type { ProductFormValues } from "@/lib/validations/product";
import { APPWRITE_CONFIG, databases } from "@/lib/appwrite";
import { useAuth } from "@/contexts/AuthContext";
import { PageTransition } from "@/components/ui/page-transition";
import { TableSkeleton } from "@/components/ui/table-skeleton";

type SortKey = "name" | "reference" | "sellingPriceHT" | "stock";
type SortDir = "asc" | "desc";

interface ProductDocument extends Omit<ProductFormValues, 'stockQuantity' | 'costPrice'> {
  $id: string;
  $createdAt: string;
  userId: string;
  stock: number;
}

const PAGE_SIZE = 10;

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
  if (quantity <= 10) {
    return (
      <Badge className="bg-amber-500/15 text-[10px] text-amber-700 dark:text-amber-400">
        Faible ({quantity})
      </Badge>
    );
  }
  return (
    <Badge className="bg-emerald-500/15 text-[10px] text-emerald-700 dark:text-emerald-400">
      En stock ({quantity})
    </Badge>
  );
}

export function ProductsTable() {
  const { userId } = useAuth();
  const [products, setProducts] = useState<ProductDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductDocument | null>(null);

  // Fetch products
  const fetchProducts = async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.productsCollectionId,
        [
          Query.equal("userId", userId),
          Query.limit(100),
        ]
      );
      
      const mapped = response.documents.map(doc => ({
        $id: doc.$id,
        $createdAt: doc.$createdAt,
        userId: doc.userId,
        name: doc.name || "",
        reference: doc.reference || "",
        sellingPriceHT: doc.sellingPriceHT || 0,
        tvaRate: doc.tvaRate || 0,
        unit: doc.unit || "",
        stock: doc.stock || 0,
        type: (doc.type as "PRODUCT" | "SERVICE") || "PRODUCT"
      }));
      setProducts(mapped);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Search
  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.reference?.toLowerCase().includes(q) ?? false)
    );
  }, [products, search]);

  // Sort
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortKey === "sellingPriceHT" || sortKey === "stock") {
        const diff = (a[sortKey] ?? 0) - (b[sortKey] ?? 0);
        return sortDir === "asc" ? diff : -diff;
      }
      const aVal = String(a[sortKey] ?? "").toLowerCase();
      const bVal = String(b[sortKey] ?? "").toLowerCase();
      return sortDir === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    });
  }, [filtered, sortKey, sortDir]);

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  async function handleSave(data: ProductFormValues) {
    if (!userId) return;
    try {
      const payload = {
        userId: userId,
        name: data.name,
        reference: data.reference || "",
        sellingPriceHT: data.sellingPriceHT || 0,
        tvaRate: data.tvaRate || 0.20,
        unit: data.unit || "",
        stock: data.stockQuantity || 0,
        type: data.type || "PRODUCT",
      };

      if (editingProduct) {
        await databases.updateDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.productsCollectionId,
          editingProduct.$id,
          payload
        );
      } else {
        await databases.createDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.productsCollectionId,
          ID.unique(),
          payload
        );
      }
      
      setModalOpen(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      console.error("Error saving product", error);
    }
  }

  function handleEdit(product: ProductDocument) {
    setEditingProduct(product);
    setModalOpen(true);
  }

  function handleNew() {
    setEditingProduct(null);
    setModalOpen(true);
  }

  // Stats
  const totalProducts = products.length;
  const lowStock = products.filter((p) => p.stock <= 10).length;

  return (
    <PageTransition className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Produits / Stocks
          </h2>
          <p className="text-sm text-muted-foreground">
            {isLoading ? (
              <span className="flex items-center gap-1.5"><Loader2 className="h-3 w-3 animate-spin"/> Chargement...</span>
            ) : (
              <>
                {totalProducts} produit{totalProducts !== 1 ? "s" : ""}
                {lowStock > 0 && (
                  <span className="ml-1 text-amber-600">
                    · {lowStock} en stock faible
                  </span>
                )}
              </>
            )}
          </p>
        </div>
        <Button onClick={handleNew} className="gap-1.5" disabled={isLoading}>
          <Plus className="size-4" />
          Ajouter
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom ou référence..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          className="pl-9"
          disabled={isLoading}
        />
      </div>

      {/* Table */}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button
                  onClick={() => toggleSort("reference")}
                  className="inline-flex items-center gap-1 font-medium"
                >
                  Réf.
                  <ArrowUpDown className="size-3" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => toggleSort("name")}
                  className="inline-flex items-center gap-1 font-medium"
                >
                  Désignation
                  <ArrowUpDown className="size-3" />
                </button>
              </TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">
                <button
                  onClick={() => toggleSort("sellingPriceHT")}
                  className="inline-flex items-center gap-1 font-medium"
                >
                  Prix vente HT
                  <ArrowUpDown className="size-3" />
                </button>
              </TableHead>
              <TableHead className="text-right">TVA</TableHead>
              <TableHead className="text-right">
                <button
                  onClick={() => toggleSort("stock")}
                  className="inline-flex items-center gap-1 font-medium"
                >
                  Stock
                  <ArrowUpDown className="size-3" />
                </button>
              </TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton columns={7} rows={5} />
            ) : paginated.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-12 text-center text-muted-foreground"
                >
                  Aucun produit trouvé.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((product) => (
                <TableRow
                  key={product.$id}
                  className="cursor-pointer transition-colors hover:bg-accent/50"
                  onClick={() => handleEdit(product)}
                >
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {product.reference || "—"}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{product.name}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Package className="size-3" />
                      Produit
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatMAD(product.sellingPriceHT)} DH
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {(product.tvaRate * 100).toFixed(0)}%
                  </TableCell>
                  <TableCell className="text-right">
                    {product.stock} {product.unit}
                  </TableCell>
                  <TableCell>
                    <StockBadge
                      quantity={product.stock}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {page + 1} sur {totalPages}
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              disabled={page === 0 || isLoading}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              disabled={page >= totalPages - 1 || isLoading}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Modal */}
      <Dialog
        open={modalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setModalOpen(false);
            setEditingProduct(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Modifier le produit" : "Ajouter un produit"}
            </DialogTitle>
            <DialogDescription>
              {editingProduct
                ? "Modifiez les informations du produit ci-dessous."
                : "Remplissez les informations du nouveau produit."}
            </DialogDescription>
          </DialogHeader>
          <ProductModal
            defaultValues={editingProduct ? { 
              ...editingProduct, 
              stockQuantity: editingProduct.stock 
            } : undefined}
            onSave={handleSave}
            onCancel={() => {
              setModalOpen(false);
              setEditingProduct(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
