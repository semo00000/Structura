import { DocumentEditor } from "@/components/documents/DocumentEditor";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nouveau Bon de Commande",
  description: "Créer un nouveau bon de commande pour un fournisseur.",
};

export default function NewBonCommandePage() {
  return <DocumentEditor type="BON_COMMANDE" />;
}
