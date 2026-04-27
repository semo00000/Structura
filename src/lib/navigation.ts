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
  translationKey: string;
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
      { title: "Tableau de bord", translationKey: "dashboard", href: "/dashboard", icon: LayoutDashboard },
      { title: "Statistiques", translationKey: "statistics", href: "/statistiques", icon: BarChart3 },
      { title: "Suivi Paiements", translationKey: "payments", href: "/suivi-paiements", icon: CreditCard },
    ],
  },
  {
    label: "Ventes",
    items: [
      { title: "Devis", translationKey: "quotes", href: "/devis", icon: FileText },
      { title: "Factures", translationKey: "invoices", href: "/factures", icon: FilePlus },
      { title: "Avoirs", translationKey: "creditNotes", href: "/avoirs", icon: FileCheck },
      { title: "Bons de livraison", translationKey: "deliveryNotes", href: "/bons-livraison", icon: Truck },
    ],
  },
  {
    label: "Achats",
    items: [
      { title: "Bons de commande", translationKey: "purchaseOrders", href: "/bons-commande", icon: ShoppingCart },
    ],
  },
  {
    label: "Gestion",
    items: [
      { title: "Clients", translationKey: "clients", href: "/clients", icon: Users },
      { title: "Fournisseurs", translationKey: "suppliers", href: "/fournisseurs", icon: Building2 },
      { title: "Produits & Services", translationKey: "products", href: "/produits", icon: Box },
      { title: "Stock", translationKey: "inventory", href: "/stock", icon: Package, requiresPlan: "Pro" },
    ],
  },
  {
    label: "Abonnement",
    items: [
      { title: "Mon Abonnement", translationKey: "subscription", href: "/abonnement", icon: Crown },
    ],
  },
  {
    label: "Configuration",
    items: [
      { title: "Paramètres", translationKey: "settings", href: "/parametres", icon: Settings },
    ],
  },
];

