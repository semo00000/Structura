"use client";

import * as React from "react";
import { Query, type Models } from "appwrite";
import { AlertCircle, Building2, Mail, Phone, UserPlus, Users } from "lucide-react";

import { ContactFormModal } from "@/components/contacts/ContactFormModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/ui/page-transition";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { APPWRITE_CONFIG, databases } from "@/lib/appwrite";

type ContactItem = {
  id: string;
  nameOrCompany: string;
  email: string;
  telephone: string;
  address: string;
  ice: string;
  category: "B2B" | "B2C";
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

function mapContact(document: Models.Document): ContactItem {
  const source = document as unknown as Record<string, unknown>;
  const category = readString(source, "category") === "B2C" ? "B2C" : "B2B";

  return {
    id: document.$id,
    nameOrCompany: readString(source, "nameOrCompany") || "Contact sans nom",
    email: readString(source, "email"),
    telephone: readString(source, "telephone"),
    address: readString(source, "address"),
    ice: readString(source, "ice"),
    category,
  };
}

export default function ClientsPage() {
  const { userId } = useAuth();
  const [contacts, setContacts] = React.useState<ContactItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const loadClients = React.useCallback(async () => {
    const { databaseId, contactsCollectionId } = APPWRITE_CONFIG;

    if (!databaseId || !contactsCollectionId || !userId) {
      setError("Configuration ou session invalide.");
      setContacts([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await databases.listDocuments(databaseId, contactsCollectionId, [
        Query.equal("userId", userId),
        Query.equal("type", "client"),
        Query.orderDesc("$createdAt"),
        Query.limit(100),
      ]);

      setContacts(response.documents.map(mapContact));
    } catch (loadError) {
      setError(`Impossible de charger les clients: ${toErrorMessage(loadError)}`);
      setContacts([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  React.useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadClients();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadClients]);

  const handleModalOpenChange = React.useCallback(
    (open: boolean) => {
      setIsModalOpen(open);

      if (!open) {
        void loadClients();
      }
    },
    [loadClients]
  );

  return (
    <PageTransition className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Clients</h1>
          <p className="text-sm text-muted-foreground">Gestion des clients synchronisee avec Appwrite.</p>
        </div>
        <Button
          type="button"
          className="gap-2 bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
          onClick={() => setIsModalOpen(true)}
        >
          <UserPlus className="size-4" />
          Nouveau client
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
        <div className="grid gap-3 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-12" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="mt-2 h-4 w-40" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : contacts.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-primary/10">
              <Users className="size-6 text-primary" />
            </div>
            <CardTitle>Aucun client trouve</CardTitle>
            <CardDescription>
              Commencez par ajouter votre premier client pour gerer vos devis et factures.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-8">
            <Button
              type="button"
              className="gap-2 bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
              onClick={() => setIsModalOpen(true)}
            >
              <UserPlus className="size-4" />
              Nouveau client
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {contacts.map((contact) => (
            <Card key={contact.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{contact.nameOrCompany}</CardTitle>
                  <Badge variant="secondary" className="text-[10px]">
                    {contact.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="size-3.5" />
                  <span>{contact.email || "-"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="size-3.5" />
                  <span>{contact.telephone || "-"}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Building2 className="mt-0.5 size-3.5" />
                  <span>{contact.address || "-"}</span>
                </div>
                <p className="font-mono text-xs">ICE: {contact.ice || "-"}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ContactFormModal
        open={isModalOpen}
        onOpenChange={handleModalOpenChange}
        contactType="client"
      />
    </PageTransition>
  );
}
