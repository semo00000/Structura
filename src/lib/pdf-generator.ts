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

export async function generateDocumentPDF(
  document: DocumentData,
  company: CompanyInfo,
  contact: ContactInfo,
  options?: { planTier?: string }
) {
  const doc = new jsPDF();
  const themeColor = "#2563EB"; // Trust Blue
  
  // Helpers
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 15;
  const marginRight = 15;
  const usableWidth = pageWidth - marginLeft - marginRight;
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-MA", {
      style: "currency",
      currency: "MAD",
    }).format(amount);
  };

  let headerOffset = 0;

  // 1. HEADER (Company Logo & Details)
  if (company.logoUrl) {
    const imgData = await getBase64ImageFromUrl(company.logoUrl);
    if (imgData) {
      // Assuming a standard max height of 20 and proportional width
      // Since we don't have natural dimensions trivially without DOM Image, 
      // we can do a fixed rectangular fit or create an Image obj
      const img = new Image();
      img.src = imgData.dataUrl;
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
      const maxH = 20;
      const ratio = img.width / img.height;
      const w = maxH * ratio;
      doc.addImage(imgData.dataUrl, imgData.ext, marginLeft, 15, w, maxH);
      headerOffset = maxH + 5;
    }
  }

  const titleY = 25 + headerOffset;
  const detailsY = titleY + 7;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(themeColor);
  doc.text((company.companyName || "Entreprise").toUpperCase(), marginLeft, titleY);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor("#64748B"); // slate-500
  let yPos = detailsY;
  if (company.address) { doc.text(company.address, marginLeft, yPos); yPos += 5; }
  if (company.city) { doc.text(company.city, marginLeft, yPos); yPos += 5; }
  if (company.email || company.telephone) {
    const contactLine = [company.email, company.telephone].filter(Boolean).join("  |  ");
    doc.text(contactLine, marginLeft, yPos); 
    yPos += 5;
  }

  // 2. DOCUMENT TYPE & NUMBER
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor("#0F172A"); // slate-900
  const docTypeTitle = document.type === "FACTURE" ? "FACTURE" : document.type === "DEVIS" ? "DEVIS" : document.type;
  doc.text(docTypeTitle, pageWidth - marginRight, 25, { align: "right" });
  
  doc.setFontSize(12);
  doc.setTextColor("#64748B");
  doc.text(`N° : ${document.number}`, pageWidth - marginRight, 32, { align: "right" });
  doc.text(`Date : ${format(new Date(document.date), "dd MMM yyyy", { locale: fr })}`, pageWidth - marginRight, 38, { align: "right" });
  if (document.dueDate) {
    doc.text(`Échéance : ${format(new Date(document.dueDate), "dd MMM yyyy", { locale: fr })}`, pageWidth - marginRight, 44, { align: "right" });
  }

  // 3. BILL TO (Client info)
  let billToYOffset = Math.max(yPos + 10, 50);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(themeColor);
  doc.text("FACTURER À :", marginLeft, billToYOffset);
  
  doc.setFont("helvetica", "bold");
  doc.setTextColor("#0F172A");
  doc.text(contact.companyName || contact.name, marginLeft, billToYOffset + 7);
  
  doc.setFont("helvetica", "normal");
  doc.setTextColor("#64748B");
  let clientY = billToYOffset + 12;
  if (contact.address) { doc.text(contact.address, marginLeft, clientY); clientY += 5; }
  if (contact.city) { doc.text(contact.city, marginLeft, clientY); clientY += 5; }
  if (contact.ice) { doc.text(`ICE: ${contact.ice}`, marginLeft, clientY); clientY += 5; }

  const tableStartY = Math.max(clientY + 10, billToYOffset + 30);

  // 4. ITEMS TABLE (AutoTable)
  const tableColumn = ["Désignation", "Qté", "Prix U. HT", "TVA", "Total HT"];
  const tableRows = document.lines.map(line => [
    line.description,
    line.quantity.toString(),
    formatCurrency(line.unitPriceHT),
    `${(line.tvaRate * 100).toFixed(0)}%`,
    formatCurrency(line.totalHT)
  ]);

  autoTable(doc, {
    startY: tableStartY,
    head: [tableColumn],
    body: tableRows,
    theme: "plain",
    headStyles: {
      fillColor: themeColor,
      textColor: "#FFFFFF",
      fontStyle: "bold",
    },
    styles: {
      font: "helvetica",
      fontSize: 9,
      textColor: "#334155", // slate-700
      cellPadding: 6,
      overflow: 'linebreak', // Ensures extremely long descriptions wrap perfectly without breaking layout
    },
    columnStyles: {
      0: { cellWidth: "auto" }, // Description wraps
      1: { cellWidth: 15, halign: "center" }, // Qty
      2: { cellWidth: 35, halign: "right" }, // Prix
      3: { cellWidth: 15, halign: "center" }, // TVA
      4: { cellWidth: 35, halign: "right" }  // Total
    },
    alternateRowStyles: {
      fillColor: "#F8FAFC", // slate-50
    }
  });

  // @ts-expect-error - jspdf-autotable specific property addition
  const finalY = doc.lastAutoTable.finalY || tableStartY + 50;

  // 5. TOTALS PANEL (Bottom Right)
  const totalsBoxWidth = 80;
  const totalsBoxX = pageWidth - marginRight - totalsBoxWidth;
  
  doc.setDrawColor("#E2E8F0"); // slate-200
  doc.setFillColor("#F8FAFC"); // slate-50
  doc.roundedRect(totalsBoxX, finalY + 10, totalsBoxWidth, 35, 2, 2, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor("#64748B");
  doc.text("Total HT", totalsBoxX + 5, finalY + 18);
  doc.text(formatCurrency(document.totalHT), totalsBoxX + totalsBoxWidth - 5, finalY + 18, { align: "right" });
  
  doc.text("Total TVA", totalsBoxX + 5, finalY + 26);
  doc.text(formatCurrency(document.totalTVA), totalsBoxX + totalsBoxWidth - 5, finalY + 26, { align: "right" });

  doc.setDrawColor("#CBD5E1"); // slate-300
  doc.line(totalsBoxX + 5, finalY + 31, totalsBoxX + totalsBoxWidth - 5, finalY + 31);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(themeColor);
  doc.text("Total TTC", totalsBoxX + 5, finalY + 40);
  doc.text(formatCurrency(document.totalTTC), totalsBoxX + totalsBoxWidth - 5, finalY + 40, { align: "right" });

  // 6. NOTES (Bottom Left)
  if (document.notes) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor("#0F172A");
    doc.text("Notes :", marginLeft, finalY + 15);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor("#64748B");
    const splitNotes = doc.splitTextToSize(document.notes, pageWidth - marginLeft - totalsBoxWidth - 20);
    doc.text(splitNotes, marginLeft, finalY + 22);
  }

  // 7. MOROCCAN LEGAL FOOTER
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerY = pageHeight - 15;
  
  doc.setDrawColor("#E2E8F0");
  doc.line(marginLeft, footerY - 5, pageWidth - marginRight, footerY - 5);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor("#94A3B8"); // slate-400
  
  const legalItems = [];
  if (company.ice) legalItems.push(`ICE: ${company.ice}`);
  if (company.rc) legalItems.push(`RC: ${company.rc}`);
  if (company.ifValue) legalItems.push(`IF: ${company.ifValue}`);
  if (company.patente) legalItems.push(`Patente: ${company.patente}`);
  if (company.cnss) legalItems.push(`CNSS: ${company.cnss}`);
  
  const footerString = legalItems.join("  •  ");
  doc.text(footerString, pageWidth / 2, footerY, { align: "center" });

  // 8. CUSTOM FOOTER (From DocumentSettings or Document)
  if (document.footer) {
    const splitFooter = doc.splitTextToSize(document.footer, usableWidth);
    doc.text(splitFooter, pageWidth / 2, footerY + 5, { align: "center" });
  }

  // 9. STARTER PLAN WATERMARK
  if (!options?.planTier || options.planTier === "Starter") {
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(40);
      doc.setTextColor(200, 200, 200); // light grey
      doc.text(
        "Généré par Structura",
        pageWidth / 2,
        pageHeight / 2,
        { align: "center", angle: 35 }
      );
    }
  }

  // Download Action
  doc.save(`${document.type}_${document.number}.pdf`);
}
