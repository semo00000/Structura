import { DocumentEditor } from "@/components/documents/DocumentEditor";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nouveau Devis",
  description: "Créer un nouveau devis pour un client.",
};

export default function NewDevisPage() {
  return <DocumentEditor type="DEVIS" />;
}
