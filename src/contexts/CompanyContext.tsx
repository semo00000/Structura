"use client";

import React, { createContext, useContext, useReducer, type ReactNode } from "react";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export interface CompanySettings {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  // Moroccan Legal
  ice: string;
  rc: string;
  taxId: string;
  patente: string;
  cnss: string;
  subscriptionTier: "Core" | "Pro" | "Enterprise";
  // Financial & PRD
  vatPct: number;
  slogan: string;
  bank: string;
  rib: string;
  // Branding
  logoUrl: string;
  primaryColor: string;
  defaultFooter: string;
  // Document Settings
  documentSettings: {
    showReference: boolean;
    showTvaColumn: boolean;
    showDiscount: boolean;
    showUnitPrice: boolean;
    primaryColor: string;
    footerText: string;
    paperSize: "A4" | "Letter";
  };
}

interface CompanyState {
  company: CompanySettings;
  isLoaded: boolean;
}

type CompanyAction =
  | { type: "SET_COMPANY"; payload: CompanySettings }
  | { type: "UPDATE_GENERAL"; payload: Partial<CompanySettings> }
  | { type: "UPDATE_LEGAL"; payload: Partial<Pick<CompanySettings, "ice" | "rc" | "taxId" | "patente" | "cnss">> }
  | { type: "UPDATE_FINANCIAL"; payload: Partial<Pick<CompanySettings, "vatPct" | "slogan" | "bank" | "rib">> }
  | { type: "UPDATE_BRANDING"; payload: Partial<Pick<CompanySettings, "logoUrl" | "primaryColor" | "defaultFooter">> }
  | { type: "UPDATE_DOCUMENT_SETTINGS"; payload: Partial<CompanySettings["documentSettings"]> }
  | { type: "SET_SUBSCRIPTION_TIER"; payload: CompanySettings["subscriptionTier"] };

// ─────────────────────────────────────────────
// Default State (Demo / Single Tenant)
// ─────────────────────────────────────────────
const defaultCompany: CompanySettings = {
  id: "demo-company-001",
  name: "Structura SARL",
  address: "123 Boulevard Mohammed V",
  city: "Casablanca",
  phone: "+212 522 123 456",
  email: "contact@structura.ma",
  ice: "001234567000089",
  rc: "RC-CASA-456789",
  taxId: "12345678",
  patente: "PAT-2026-00123",
  cnss: "9876543",
  subscriptionTier: "Pro",
  vatPct: 20,
  slogan: "Votre partenaire de confiance",
  bank: "Attijariwafa Bank",
  rib: "007 780 0000000000000000 11",
  logoUrl: "",
  primaryColor: "#2563EB",
  defaultFooter: "Merci pour votre confiance. Conditions de paiement : 30 jours net.",
  documentSettings: {
    showReference: true,
    showTvaColumn: true,
    showDiscount: false,
    showUnitPrice: true,
    primaryColor: "#2563EB",
    footerText: "Merci pour votre confiance.",
    paperSize: "A4",
  },
};

const initialState: CompanyState = {
  company: defaultCompany,
  isLoaded: true,
};

// ─────────────────────────────────────────────
// Reducer
// ─────────────────────────────────────────────
function companyReducer(state: CompanyState, action: CompanyAction): CompanyState {
  switch (action.type) {
    case "SET_COMPANY":
      return { company: action.payload, isLoaded: true };

    case "UPDATE_GENERAL":
      return {
        ...state,
        company: { ...state.company, ...action.payload },
      };

    case "UPDATE_LEGAL":
      return {
        ...state,
        company: { ...state.company, ...action.payload },
      };

    case "UPDATE_FINANCIAL":
      return {
        ...state,
        company: { ...state.company, ...action.payload },
      };

    case "UPDATE_BRANDING":
      return {
        ...state,
        company: { ...state.company, ...action.payload },
      };

    case "UPDATE_DOCUMENT_SETTINGS":
      return {
        ...state,
        company: {
          ...state.company,
          documentSettings: {
            ...state.company.documentSettings,
            ...action.payload,
          },
        },
      };
    case "SET_SUBSCRIPTION_TIER":
      return {
        ...state,
        company: { ...state.company, subscriptionTier: action.payload },
      };

    default:
      return state;
  }
}

// ─────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────
interface CompanyContextType {
  state: CompanyState;
  dispatch: React.Dispatch<CompanyAction>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(companyReducer, initialState);

  return (
    <CompanyContext.Provider value={{ state, dispatch }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error("useCompany must be used within a CompanyProvider");
  }
  return context;
}

export function useCompanySettings() {
  const { state } = useCompany();
  return state.company;
}
