"use client";

import { useParams } from "next/navigation";
import { DocumentEditor } from "@/components/documents/DocumentEditor";

export default function EditBonLivraisonPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  return <DocumentEditor type="BON_LIVRAISON" documentId={id} />;
}
