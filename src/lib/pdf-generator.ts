import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type CompanyInfo = {
  companyName: string;
  address?: string | null;
  city?: string | null;
  telephone?: string | null;
  email?: string | null;
  ice?: string | null;
  rc?: string | null;
  ifValue?: string | null;
  patente?: string | null;
  cnss?: string | null;
  logoUrl?: string | null;
};

type ContactInfo = {
  name: string;
  companyName?: string | null;
  address?: string | null;
  city?: string | null;
  ice?: string | null;
};

type DocumentData = {
  type: string;
  number: string;
  date: Date;
  dueDate?: Date | null;
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  notes?: string | null;
  footer?: string | null;
  lines: Array<{
    description: string;
    quantity: number;
    unitPriceHT: number;
    tvaRate: number;
    totalHT: number;
    totalTTC: number;
  }>;
};

// Helper to convert Image URL to Base64 for jsPDF
async function getBase64ImageFromUrl(imageUrl: string): Promise<{ dataUrl: string, ext: string } | null> {
  try {
    const res = await fetch(imageUrl);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        let ext = "PNG";
        if (dataUrl.includes("image/jpeg") || dataUrl.includes("image/jpg")) ext = "JPEG";
        resolve({ dataUrl, ext });
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error("Failed to fetch image for PDF:", err);
    return null;
  }
}

// ─── Color Palette ──────────────────────────────
const COLORS = {
  primary: "#0F172A",      // Deep Slate (Better than pure black)
  secondary: "#334155",    // Cool Gray
  accent: "#2563EB",       // Premium Blue (LinkedIn/Stripe vibe)
  accentSoft: "#EFF6FF",   // Very Light Blue
  textDark: "#1E293B",     // High contrast text
  textMuted: "#64748B",    // Muted slate
  textLight: "#94A3B8",    // Faint slate
  border: "#E2E8F0",       // Soft borders
  bgSubtle: "#F8FAFC",     // Very subtle background
  white: "#FFFFFF",
};

// ─── Document Type Labels ───────────────────────
function getDocTypeTitle(type: string): string {
  switch (type) {
    case "FACTURE": return "FACTURE COMMERCIALE";
    case "DEVIS": return "OFFRE COMMERCIALE";
    case "BON_COMMANDE": return "BON DE COMMANDE";
    case "BON_LIVRAISON": return "BON DE LIVRAISON";
    case "AVOIR": return "AVOIR FISCAL";
    default: return type;
  }
}

function getBillToLabel(type: string): string {
  switch (type) {
    case "BON_COMMANDE": return "FOURNISSEUR";
    default: return "FACTURER À";
  }
}

export async function generateDocumentPDF(
  document: DocumentData,
  company: CompanyInfo,
  contact: ContactInfo,
  options?: { planTier?: string }
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const mL = 20;  // margin left
  const mR = 20;  // margin right
  const usableW = pageWidth - mL - mR;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount) + " DH";
  };

  // ═══════════════════════════════════════════
  // 1. TOP BAR — Accent stripe
  // ═══════════════════════════════════════════
  doc.setFillColor(COLORS.accent);
  doc.rect(0, 0, pageWidth, 4, "F");

  // ═══════════════════════════════════════════
  // 2. HEADER — Logo + Company + Doc Type
  // ═══════════════════════════════════════════
  let logoEndX = mL;

  if (company.logoUrl) {
    const imgData = await getBase64ImageFromUrl(company.logoUrl);
    if (imgData) {
      const img = new Image();
      img.src = imgData.dataUrl;
      await new Promise((resolve) => { img.onload = resolve; img.onerror = resolve; });
      const maxH = 18;
      const ratio = img.width / img.height;
      const w = maxH * ratio;
      doc.addImage(imgData.dataUrl, imgData.ext, mL, 12, w, maxH);
      logoEndX = mL + w + 6;
    }
  }

  // Company name + details (left)
  const companyY = 16;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(COLORS.primary);
  doc.text((company.companyName || "Entreprise").toUpperCase(), logoEndX, companyY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(COLORS.textMuted);
  let cyPos = companyY + 5;
  if (company.address) { doc.text(company.address, logoEndX, cyPos); cyPos += 4; }
  if (company.city) { doc.text(company.city, logoEndX, cyPos); cyPos += 4; }
  const contactLine = [company.email, company.telephone].filter(Boolean).join("  ·  ");
  if (contactLine) { doc.text(contactLine, logoEndX, cyPos); cyPos += 4; }

  // Document type (right side)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(COLORS.primary);
  doc.text(getDocTypeTitle(document.type), pageWidth - mR, 18, { align: "right" });

  // Doc metadata below type
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(COLORS.textMuted);
  doc.text(`N° ${document.number}`, pageWidth - mR, 25, { align: "right" });
  doc.text(
    `Date : ${format(new Date(document.date), "dd MMMM yyyy", { locale: fr })}`,
    pageWidth - mR, 30, { align: "right" }
  );
  if (document.dueDate) {
    doc.text(
      `Échéance : ${format(new Date(document.dueDate), "dd MMMM yyyy", { locale: fr })}`,
      pageWidth - mR, 35, { align: "right" }
    );
  }

  // ═══════════════════════════════════════════
  // 3. DIVIDER
  // ═══════════════════════════════════════════
  const dividerY = Math.max(cyPos + 4, 42);
  doc.setDrawColor(COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(mL, dividerY, pageWidth - mR, dividerY);

  // ═══════════════════════════════════════════
  // 4. BILL TO — Client/Supplier box
  // ═══════════════════════════════════════════
  const billY = dividerY + 10;

  // Destinataire Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(COLORS.textLight);
  doc.text(getBillToLabel(document.type), mL, billY);

  // Client Details
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(COLORS.primary);
  doc.text(contact.companyName || contact.name, mL, billY + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(COLORS.textMuted);
  let clientDetailY = billY + 11;
  if (contact.address) { doc.text(contact.address, mL, clientDetailY); clientDetailY += 4.5; }
  if (contact.city) { doc.text(contact.city, mL, clientDetailY); clientDetailY += 4.5; }
  if (contact.ice) { 
    doc.setFont("helvetica", "bold");
    doc.setTextColor(COLORS.secondary);
    doc.text(`ICE : ${contact.ice}`, mL, clientDetailY); 
  }

  const tableStartY = billY + 35;

  // ═══════════════════════════════════════════
  // 5. LINE ITEMS TABLE
  // ═══════════════════════════════════════════
  const tableColumns = ["#", "Désignation", "Qté", "Prix U. HT", "TVA", "Total HT"];
  const tableRows = document.lines.map((line, i) => [
    String(i + 1),
    line.description,
    line.quantity.toString(),
    formatCurrency(line.unitPriceHT),
    `${(line.tvaRate * 100).toFixed(0)}%`,
    formatCurrency(line.totalHT),
  ]);

  autoTable(doc, {
    startY: tableStartY,
    head: [tableColumns],
    body: tableRows,
    theme: "striped",
    headStyles: {
      fillColor: COLORS.bgSubtle,
      textColor: COLORS.primary,
      fontStyle: "bold",
      fontSize: 8.5,
      cellPadding: { top: 5, bottom: 5, left: 5, right: 5 },
    },
    styles: {
      font: "helvetica",
      fontSize: 9,
      textColor: COLORS.textDark,
      cellPadding: { top: 6, bottom: 6, left: 5, right: 5 },
      lineColor: COLORS.border,
      lineWidth: 0.1,
      overflow: "linebreak",
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center", textColor: COLORS.textLight, fontSize: 8 },
      1: { cellWidth: "auto" },
      2: { cellWidth: 16, halign: "center" },
      3: { cellWidth: 36, halign: "right" },
      4: { cellWidth: 18, halign: "center" },
      5: { cellWidth: 36, halign: "right", fontStyle: "bold" },
    },
    alternateRowStyles: {
      fillColor: COLORS.white,
    },
    didDrawPage: () => {
      // Re-draw accent bar on new pages
      doc.setFillColor(COLORS.accent);
      doc.rect(0, 0, pageWidth, 4, "F");
    },
  });

  // @ts-expect-error - jspdf-autotable specific property addition
  const finalY = doc.lastAutoTable.finalY || tableStartY + 50;

  // ═══════════════════════════════════════════
  // 6. TOTALS PANEL — Right-aligned summary
  // ═══════════════════════════════════════════
  const totalsW = 75;
  const totalsX = pageWidth - mR - totalsW;
  const totalsY = finalY + 8;

  // Rounded box
  doc.setDrawColor(COLORS.border);
  doc.setFillColor(COLORS.bgSubtle);
  doc.roundedRect(totalsX, totalsY, totalsW, 38, 3, 3, "FD");

  // HT
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(COLORS.textMuted);
  doc.text("Sous-total HT", totalsX + 5, totalsY + 8);
  doc.setTextColor(COLORS.textDark);
  doc.text(formatCurrency(document.totalHT), totalsX + totalsW - 5, totalsY + 8, { align: "right" });

  // TVA
  doc.setTextColor(COLORS.textMuted);
  doc.text("TVA", totalsX + 5, totalsY + 15);
  doc.setTextColor(COLORS.textDark);
  doc.text(formatCurrency(document.totalTVA), totalsX + totalsW - 5, totalsY + 15, { align: "right" });

  // Divider line
  doc.setDrawColor(COLORS.border);
  doc.line(totalsX + 5, totalsY + 21, totalsX + totalsW - 5, totalsY + 21);

  // TTC
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(COLORS.accent);
  doc.text("Total TTC", totalsX + 5, totalsY + 30);
  doc.text(formatCurrency(document.totalTTC), totalsX + totalsW - 5, totalsY + 30, { align: "right" });

  // ═══════════════════════════════════════════
  // 7. NOTES — Left side, below table
  // ═══════════════════════════════════════════
  if (document.notes) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(COLORS.primary);
    doc.text("Notes", mL, totalsY + 5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(COLORS.textMuted);
    const splitNotes = doc.splitTextToSize(document.notes, usableW * 0.5 - 5);
    doc.text(splitNotes, mL, totalsY + 10);
  }

  // ═══════════════════════════════════════════
  // 8. FOOTER — Legal info + accent bar bottom
  // ═══════════════════════════════════════════
  const footerY = pageHeight - 20;

  // Legal line
  doc.setDrawColor(COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(mL, footerY - 4, pageWidth - mR, footerY - 4);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(COLORS.textLight);

  const legalItems: string[] = [];
  if (company.ice) legalItems.push(`ICE: ${company.ice}`);
  if (company.rc) legalItems.push(`RC: ${company.rc}`);
  if (company.ifValue) legalItems.push(`IF: ${company.ifValue}`);
  if (company.patente) legalItems.push(`Patente: ${company.patente}`);
  if (company.cnss) legalItems.push(`CNSS: ${company.cnss}`);

  if (legalItems.length > 0) {
    doc.text(legalItems.join("  ·  "), pageWidth / 2, footerY, { align: "center" });
  }

  // Custom footer text
  if (document.footer) {
    doc.setFontSize(7);
    doc.setTextColor(COLORS.textLight);
    const splitFooter = doc.splitTextToSize(document.footer, usableW);
    doc.text(splitFooter, pageWidth / 2, footerY + 4, { align: "center" });
  }

  // Structura Watermark for Core users
  if (options?.planTier === "Core") {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(COLORS.textLight);
    doc.text("Généré par Structura Core — ERP Commercial", pageWidth / 2, pageHeight - 6, { align: "center" });
  }

  // Bottom accent bar
  doc.setFillColor(COLORS.accent);
  doc.rect(0, pageHeight - 2, pageWidth, 2, "F");

  // ─── Download ─────────────────────────────
  doc.save(`${document.type}_${document.number}.pdf`);
}
