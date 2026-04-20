import { DocumentEditor } from "@/components/documents/DocumentEditor";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nouvelle Facture",
  description: "Créer une nouvelle facture pour un client.",
};

export default function NewFacturePage() {
  return <DocumentEditor type="FACTURE" />;
}
