"use client";

import { useParams } from "next/navigation";
import { DocumentEditor } from "@/components/documents/DocumentEditor";

export default function EditAvoirPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  return <DocumentEditor type="AVOIR" documentId={id} />;
}
