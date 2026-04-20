import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { CompanyProvider } from "@/contexts/CompanyContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/hooks/use-toast";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Structura — Gestion Commerciale",
    template: "%s | Structura",
  },
  description:
    "Plateforme de facturation, devis, gestion de stock et suivi des paiements pour les entreprises marocaines.",
  keywords: [
    "facturation",
    "Maroc",
    "devis",
    "facture",
    "gestion commerciale",
    "TVA",
    "stock",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full bg-background text-foreground">
        <ToastProvider>
          <AuthProvider>
            <CompanyProvider>
              <TooltipProvider>
                {children}
                <Toaster />
              </TooltipProvider>
            </CompanyProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
