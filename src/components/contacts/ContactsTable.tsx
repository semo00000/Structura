"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Search, ArrowUpDown, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { ID, Query } from "appwrite";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

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
import { ContactModal } from "./ContactModal";
import type { ContactFormValues } from "@/lib/validations/contact";
import { APPWRITE_CONFIG, databases } from "@/lib/appwrite";
import { useAuth } from "@/contexts/AuthContext";

type SortKey = "nameOrCompany" | "city" | "$createdAt";
type SortDir = "asc" | "desc";

interface ContactDocument extends ContactFormValues {
  $id: string;
  $createdAt: string;
  userId: string;
  nameOrCompany: string;
}

interface ContactsTableProps {
  filterType: "CLIENT" | "FOURNISSEUR";
  title: string;
}

const PAGE_SIZE = 10;

export function ContactsTable({ filterType, title }: ContactsTableProps) {
  const { userId } = useAuth();
  const [contacts, setContacts] = useState<ContactDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("nameOrCompany");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactDocument | null>(null);

  // Fetch contacts
  const fetchContacts = async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      if (!APPWRITE_CONFIG.contactsCollectionId) return;
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.contactsCollectionId,
        [
          Query.equal("userId", userId),
          Query.equal("type", filterType),
          Query.limit(100),
        ]
      );
      
      const mapped = response.documents.map(doc => ({
        $id: doc.$id,
        $createdAt: doc.$createdAt,
        userId: doc.userId,
        type: doc.type as "CLIENT" | "FOURNISSEUR",
        category: doc.category as "COMPANY" | "INDIVIDUAL",
        name: doc.name || "",
        companyName: doc.companyName || "",
        nameOrCompany: doc.nameOrCompany || "",
        email: doc.email || "",
        telephone: doc.telephone || "",
        phone: doc.telephone || "", // Mapping back due to schema vs form difference
        address: doc.address || "",
        city: doc.city || "",
        ice: doc.ice || ""
      }));
      setContacts(mapped);
    } catch (error) {
      console.error("Error fetching contacts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [filterType]);

  // Filter + search
  const filtered = useMemo(() => {
    let result = contacts;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          (c.name?.toLowerCase().includes(q) ?? false) ||
          (c.companyName?.toLowerCase().includes(q) ?? false) ||
          (c.email?.toLowerCase().includes(q) ?? false) ||
          (c.city?.toLowerCase().includes(q) ?? false)
      );
    }
    return result;
  }, [contacts, search]);

  // Sort
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aVal = String(a[sortKey] || "").toLowerCase();
      const bVal = String(b[sortKey] || "").toLowerCase();
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

  async function handleSave(data: ContactFormValues) {
    if (!userId) return;
    try {
      const payload = {
        userId: userId,
        type: data.type,
        category: data.category,
        nameOrCompany: data.companyName ? data.companyName : data.name,
        email: data.email || "",
        telephone: data.phone || "",
        address: data.address || "",
        ice: data.ice || ""
      };

      if (!APPWRITE_CONFIG.contactsCollectionId) return;

      if (editingContact) {
        await databases.updateDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.contactsCollectionId,
          editingContact.$id,
          payload
        );
      } else {
        await databases.createDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.contactsCollectionId,
          ID.unique(),
          payload
        );
      }
      
      setModalOpen(false);
      setEditingContact(null);
      fetchContacts();
    } catch (error) {
      console.error("Error saving contact", error);
    }
  }

  function handleEdit(contact: ContactDocument) {
    setEditingContact(contact);
    setModalOpen(true);
  }

  function handleNew() {
    setEditingContact(null);
    setModalOpen(true);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <p className="text-sm text-muted-foreground">
            {isLoading ? (
              <span className="flex items-center gap-1.5"><Loader2 className="h-3 w-3 animate-spin"/> Chargement...</span>
            ) : (
              <>{filtered.length} {filterType === "CLIENT" ? "client" : "fournisseur"}{filtered.length !== 1 ? "s" : ""} enregistré{filtered.length !== 1 ? "s" : ""}</>
            )}
          </p>
        </div>
        <Button onClick={handleNew} className="gap-1.5" disabled={isLoading}>
          <Plus className="size-4" />
          Nouveau {filterType === "CLIENT" ? "client" : "fournisseur"}
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom, entreprise, email..."
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
                  onClick={() => toggleSort("nameOrCompany")}
                  className="inline-flex items-center gap-1 font-medium"
                >
                  Entité
                  <ArrowUpDown className="size-3" />
                </button>
              </TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Adresse</TableHead>
              <TableHead className="text-right">ICE</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><div className="h-4 w-32 animate-pulse rounded bg-muted"></div></TableCell>
                  <TableCell><div className="h-4 w-16 animate-pulse rounded bg-muted"></div></TableCell>
                  <TableCell><div className="h-4 w-24 animate-pulse rounded bg-muted"></div></TableCell>
                  <TableCell><div className="h-4 w-24 animate-pulse rounded bg-muted"></div></TableCell>
                  <TableCell><div className="h-4 w-40 animate-pulse rounded bg-muted"></div></TableCell>
                  <TableCell className="text-right"><div className="h-4 w-24 ml-auto animate-pulse rounded bg-muted"></div></TableCell>
                </TableRow>
              ))
            ) : paginated.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-12 text-center text-muted-foreground"
                >
                  Aucun {filterType === "CLIENT" ? "client" : "fournisseur"} trouvé.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((contact) => (
                <TableRow
                  key={contact.$id}
                  className="cursor-pointer transition-colors hover:bg-accent/50"
                  onClick={() => handleEdit(contact)}
                >
                  <TableCell className="font-medium text-foreground">
                    {contact.nameOrCompany}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        contact.category === "COMPANY"
                          ? "default"
                          : "secondary"
                      }
                      className="text-[10px]"
                    >
                      {contact.category === "COMPANY"
                        ? "Entreprise"
                        : "Particulier"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {contact.email || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {contact.phone || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {contact.address || "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-muted-foreground">
                    {contact.ice || "—"}
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
            setEditingContact(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingContact
                ? "Modifier le contact"
                : `Nouveau ${filterType === "CLIENT" ? "client" : "fournisseur"}`}
            </DialogTitle>
            <DialogDescription>
              {editingContact
                ? "Modifiez les informations du contact ci-dessous."
                : "Remplissez les informations du nouveau contact."}
            </DialogDescription>
          </DialogHeader>
          <ContactModal
            defaultValues={
              editingContact ?? { type: filterType, category: "COMPANY" }
            }
            onSave={handleSave}
            onCancel={() => {
              setModalOpen(false);
              setEditingContact(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
