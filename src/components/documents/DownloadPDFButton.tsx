"use client";

import * as React from "react";
import { Query } from "appwrite";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APPWRITE_CONFIG, databases } from "@/lib/appwrite";
import { generateDocumentPDF } from "@/lib/pdf-generator";
import { usePlan } from "@/contexts/PlanContext";

type CompanyProfile = {
  name: string;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  ice?: string | null;
  rc?: string | null;
  taxId?: string | null;
  patente?: string | null;
  cnss?: string | null;
};

function fallbackCompanyProfile(): CompanyProfile {
  return {
    name: "Configuer votre profil",
    address: "",
    city: "",
    phone: "",
    email: "",
    ice: "",
    rc: "",
    taxId: "",
    patente: "",
    cnss: "",
  };
}

function readString(source: Record<string, unknown>, key: string): string {
  const value = source[key];
  return typeof value === "string" ? value : "";
}

function parseCompanyProfile(source: Record<string, unknown>): CompanyProfile {
  return {
    name: readString(source, "companyName") || readString(source, "name") || "Configuer votre profil",
    address: readString(source, "address"),
    city: readString(source, "city"),
    phone: readString(source, "telephone") || readString(source, "phone"),
    email: readString(source, "email"),
    ice: readString(source, "ice"),
    rc: readString(source, "rc"),
    taxId: readString(source, "taxId") || readString(source, "ifValue"),
    patente: readString(source, "patente"),
    cnss: readString(source, "cnss"),
  };
}

type PdfLine = {
  description: string;
  quantity: number;
  unitPriceHT: number;
  tvaRate: number;
  totalHT: number;
  totalTTC: number;
};

function toNumber(value: unknown): number {
  return typeof value === "number" ? value : Number(value || 0);
}

function parseLinesFromDocument(document: Record<string, unknown>): PdfLine[] {
  const linesValue = document.lines;

  if (Array.isArray(linesValue)) {
    return linesValue
      .map((line) => {
        if (typeof line !== "object" || line === null) {
          return null;
        }

        const typedLine = line as Record<string, unknown>;
        return {
          description:
            typeof typedLine.description === "string"
              ? typedLine.description
              : "Ligne",
          quantity: toNumber(typedLine.quantity),
          unitPriceHT: toNumber(typedLine.unitPriceHT),
          tvaRate: toNumber(typedLine.tvaRate),
          totalHT: toNumber(typedLine.totalHT),
          totalTTC: toNumber(typedLine.totalTTC),
        };
      })
      .filter((line): line is PdfLine => line !== null);
  }

  const linesJson = document.linesJson;
  if (typeof linesJson === "string") {
    try {
      const parsed = JSON.parse(linesJson);
      if (Array.isArray(parsed)) {
        return parsed
          .map((line) => {
            if (typeof line !== "object" || line === null) {
              return null;
            }

            const typedLine = line as Record<string, unknown>;
            return {
              description:
                typeof typedLine.description === "string"
                  ? typedLine.description
                  : "Ligne",
              quantity: toNumber(typedLine.quantity),
              unitPriceHT: toNumber(typedLine.unitPriceHT),
              tvaRate: toNumber(typedLine.tvaRate),
              totalHT: toNumber(typedLine.totalHT),
              totalTTC: toNumber(typedLine.totalTTC),
            };
          })
          .filter((line): line is PdfLine => line !== null);
      }
    } catch {
      return [];
    }
  }

  return [];
}

type DownloadPdfContact = {
  name: string;
  companyName?: string;
  address?: string;
  city?: string;
  ice?: string;
};

export function DownloadPDFButton({
  document,
  contact,
}: {
  document: Record<string, unknown>;
  contact?: DownloadPdfContact | null;
}) {
  const { planTier } = usePlan();
  const [company, setCompany] = React.useState<CompanyProfile>(
    fallbackCompanyProfile()
  );

  React.useEffect(() => {
    let isMounted = true;

    async function loadCompany() {
      const { databaseId, companyCollectionId } = APPWRITE_CONFIG;
      if (!databaseId || !companyCollectionId) {
        return;
      }

      try {
        const response = await databases.listDocuments(databaseId, companyCollectionId, [
          Query.limit(1),
        ]);

        const companyDocument = response.documents[0];
        if (!isMounted || !companyDocument) {
          return;
        }

        setCompany(parseCompanyProfile(companyDocument as unknown as Record<string, unknown>));
      } catch {
        if (isMounted) {
          setCompany(fallbackCompanyProfile());
        }
      }
    }

    loadCompany();

    return () => {
      isMounted = false;
    };
  }, []);

  const documentRecord = document;
  const lines = parseLinesFromDocument(documentRecord);

  const normalizedDocument = {
    type: typeof documentRecord.type === "string" ? documentRecord.type : "FACTURE",
    number:
      typeof documentRecord.number === "string" ? documentRecord.number : "DOC-SANS-NUM",
    date:
      typeof documentRecord.date === "string"
        ? new Date(documentRecord.date)
        : new Date(),
    dueDate:
      typeof documentRecord.dueDate === "string" && documentRecord.dueDate
        ? new Date(documentRecord.dueDate)
        : null,
    totalHT: toNumber(documentRecord.totalHT),
    totalTVA: toNumber(documentRecord.totalTVA),
    totalTTC: toNumber(documentRecord.totalTTC),
    notes: typeof documentRecord.notes === "string" ? documentRecord.notes : "",
    footer: typeof documentRecord.footer === "string" ? documentRecord.footer : "",
    lines,
  };

  // Map local CompanyProfile (name) → CompanyInfo (companyName)
  const mappedCompany = {
    companyName: company.name,
    address: company.address,
    city: company.city,
    telephone: company.phone,
    email: company.email,
    ice: company.ice,
    rc: company.rc,
    ifValue: company.taxId,
    patente: company.patente,
    cnss: company.cnss,
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-2 text-xs"
      onClick={() =>
        generateDocumentPDF(normalizedDocument, mappedCompany, contact || { name: "Client Inconnu" }, { planTier })
      }
    >
      <Download className="size-3.5" />
      PDF
    </Button>
  );
}
