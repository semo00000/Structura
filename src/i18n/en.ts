import { TranslationDictionary } from "./types";

export const en: TranslationDictionary = {
  nav: {
    dashboard: "Dashboard",
    invoices: "Invoices",
    quotes: "Quotes",
    deliveryNotes: "Delivery Notes",
    purchaseOrders: "Purchase Orders",
    creditNotes: "Credit Notes",
    clients: "Clients",
    suppliers: "Suppliers",
    products: "Products",
    inventory: "Inventory",
    statistics: "Statistics",
    payments: "Payments Tracking",
    settings: "Settings",
    subscription: "Subscription",
    login: "Login",
    logout: "Logout",
    register: "Register"
  },
  dashboard: {
    totalRevenue: "Total Revenue",
    invoicesCount: "invoice(s)",
    cashReceived: "Cash Received",
    totalReceived: "Total received",
    overdue: "Overdue",
    overdueInvoices: "overdue invoice(s)",
    noOverdue: "No overdue invoices",
    topDebtors: "Top Debtors",
    clientsCount: "client(s)",
    noDebt: "No outstanding debt",
    noDebtDesc: "All your clients are up to date. 🎉",
    recentInvoices: "Recent Invoices",
    latestCount: "latest",
    noInvoices: "No invoices",
    createFirstInvoice: "Create your first invoice to get started.",
    remaining: "Remaining:"
  },
  status: {
    paid: "PAID",
    partial: "PARTIAL",
    due: "DUE",
    draft: "Draft",
    sent: "Sent",
    cancelled: "Cancelled"
  },
  landing: {
    heroTitle: "Business management reinvented for Morocco",
    heroSubtitle: "Invoicing, quotes, inventory management, and payment tracking. A complete, lightweight, and premium platform to accelerate your business growth.",
    getStarted: "Get started for free",
    viewDemo: "View demo",
    featuresTitle: "Everything you need",
    featuresSubtitle: "Powerful tools designed to simplify your daily operations.",
    feature1Title: "Smart Invoicing",
    feature1Desc: "Create professional invoices in a few clicks, with automatic payment tracking.",
    feature2Title: "Inventory Management",
    feature2Desc: "Track your products in real-time and never run out of stock.",
    feature3Title: "Advanced Analytics",
    feature3Desc: "Visualize your performance with clear and precise dashboards.",
    moroccanCompliance: "100% Moroccan Compliance",
    moroccanComplianceDesc: "Automatically integrates ICE, RC, IF, Patente and manages all Moroccan VAT rates."
  },
  common: {
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    create: "Create",
    loading: "Loading...",
    success: "Success",
    error: "Error"
  }
};
