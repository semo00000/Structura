"use client";

import { useParams } from "next/navigation";
import { DocumentEditor } from "@/components/documents/DocumentEditor";

export default function EditBonCommandePage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  return <DocumentEditor type="BON_COMMANDE" documentId={id} />;
}
