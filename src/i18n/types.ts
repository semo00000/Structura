export type Language = "fr" | "en" | "ar";

export interface TranslationDictionary {
  // Navigation
  nav: {
    dashboard: string;
    invoices: string;
    quotes: string;
    deliveryNotes: string;
    purchaseOrders: string;
    creditNotes: string;
    clients: string;
    suppliers: string;
    products: string;
    inventory: string;
    statistics: string;
    payments: string;
    settings: string;
    subscription: string;
    login: string;
    logout: string;
    register: string;
  };

  // Dashboard Home
  dashboard: {
    totalRevenue: string;
    invoicesCount: string;
    cashReceived: string;
    totalReceived: string;
    overdue: string;
    overdueInvoices: string;
    noOverdue: string;
    topDebtors: string;
    clientsCount: string;
    noDebt: string;
    noDebtDesc: string;
    recentInvoices: string;
    latestCount: string;
    noInvoices: string;
    createFirstInvoice: string;
    remaining: string;
  };

  // Statuses
  status: {
    paid: string;
    partial: string;
    due: string;
    draft: string;
    sent: string;
    cancelled: string;
  };

  // Landing Page
  landing: {
    heroTitle: string;
    heroSubtitle: string;
    getStarted: string;
    viewDemo: string;
    featuresTitle: string;
    featuresSubtitle: string;
    feature1Title: string;
    feature1Desc: string;
    feature2Title: string;
    feature2Desc: string;
    feature3Title: string;
    feature3Desc: string;
    moroccanCompliance: string;
    moroccanComplianceDesc: string;
  };

  // Common
  common: {
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    create: string;
    loading: string;
    success: string;
    error: string;
  };
}
