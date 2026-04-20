import {
  LayoutDashboard,
  BarChart3,
  CreditCard,
  FileText,
  FilePlus,
  FileCheck,
  Truck,
  ShoppingCart,
  Package,
  Users,
  Building2,
  Box,
  Settings,
  Crown,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Minimum plan tier required to access this item. If omitted, available to all. */
  requiresPlan?: "Pro" | "Business";
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const navigation: NavGroup[] = [
  {
    label: "Général",
    items: [
      { title: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
      { title: "Statistiques", href: "/statistiques", icon: BarChart3 },
      { title: "Suivi Paiements", href: "/suivi-paiements", icon: CreditCard },
    ],
  },
  {
    label: "Ventes",
    items: [
      { title: "Devis", href: "/devis", icon: FileText },
      { title: "Factures", href: "/factures", icon: FilePlus },
      { title: "Avoirs", href: "/avoirs", icon: FileCheck },
      { title: "Bons de livraison", href: "/bons-livraison", icon: Truck },
    ],
  },
  {
    label: "Achats",
    items: [
      { title: "Bons de commande", href: "/bons-commande", icon: ShoppingCart },
    ],
  },
  {
    label: "Gestion",
    items: [
      { title: "Clients", href: "/clients", icon: Users },
      { title: "Fournisseurs", href: "/fournisseurs", icon: Building2 },
      { title: "Produits & Services", href: "/produits", icon: Box },
      { title: "Stock", href: "/stock", icon: Package, requiresPlan: "Pro" },
    ],
  },
  {
    label: "Abonnement",
    items: [
      { title: "Mon Abonnement", href: "/abonnement", icon: Crown },
    ],
  },
  {
    label: "Configuration",
    items: [
      { title: "Paramètres", href: "/parametres", icon: Settings },
    ],
  },
];

