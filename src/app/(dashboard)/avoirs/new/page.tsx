import { DocumentEditor } from "@/components/documents/DocumentEditor";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nouvel Avoir",
  description: "Émettre un avoir (note de crédit) pour un client.",
};

export default function NewAvoirPage() {
  return <DocumentEditor type="AVOIR" />;
}
