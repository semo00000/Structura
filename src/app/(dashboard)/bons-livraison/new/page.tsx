import { DocumentEditor } from "@/components/documents/DocumentEditor";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nouveau Bon de Livraison",
  description: "Créer un nouveau bon de livraison pour un client.",
};

export default function NewBonLivraisonPage() {
  return <DocumentEditor type="BON_LIVRAISON" />;
}
