"use client";

import { useParams } from "next/navigation";
import { DocumentEditor } from "@/components/documents/DocumentEditor";

export default function EditFacturePage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  return <DocumentEditor type="FACTURE" documentId={id} />;
}
