"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { Query } from "appwrite";
import { databases, APPWRITE_CONFIG } from "@/lib/appwrite";
import { useAuth } from "@/contexts/AuthContext";

// ─── Types ──────────────────────────────────
export type PlanTier = "Starter" | "Pro" | "Business";

interface PlanLimits {
  maxInvoicesPerMonth: number;
  stockEnabled: boolean;
  watermark: boolean;
}

const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  Starter: { maxInvoicesPerMonth: 50, stockEnabled: false, watermark: true },
  Pro:     { maxInvoicesPerMonth: Infinity, stockEnabled: true, watermark: false },
  Business:{ maxInvoicesPerMonth: Infinity, stockEnabled: true, watermark: false },
};

interface PlanContextType {
  planTier: PlanTier;
  limits: PlanLimits;
  invoiceCountThisMonth: number;
  canCreateInvoice: boolean;
  isLoading: boolean;
  showUpgradeModal: boolean;
  setShowUpgradeModal: (v: boolean) => void;
  /** Call before creating a new invoice. Returns true if allowed, false + shows modal if blocked. */
  checkInvoiceLimit: () => boolean;
  refreshCount: () => Promise<void>;
  paymentStatus: string | null;
  pendingTier: string | null;
  refreshPlan: () => Promise<void>;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

export function PlanProvider({ children }: { children: ReactNode }) {
  const [planTier, setPlanTier] = useState<PlanTier>("Starter");
  const [invoiceCountThisMonth, setInvoiceCountThisMonth] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [pendingTier, setPendingTier] = useState<string | null>(null);

  const { userId } = useAuth();
  const limits = PLAN_LIMITS[planTier];
  const canCreateInvoice = invoiceCountThisMonth < limits.maxInvoicesPerMonth;

  const loadPlanAndCount = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const { databaseId, companyCollectionId, documentsCollectionId } = APPWRITE_CONFIG;

      // Fetch plan tier from company settings
      const companyRes = await databases.listDocuments(databaseId, companyCollectionId, [
        Query.equal("userId", userId),
        Query.limit(1),
      ]);

      if (companyRes.documents[0]) {
        const doc = companyRes.documents[0] as Record<string, unknown>;
        const tier = (doc.planTier as string) || "Starter";
        if (tier === "Pro" || tier === "Business") {
          setPlanTier(tier);
        } else {
          setPlanTier("Starter");
        }
        setPaymentStatus((doc.paymentStatus as string) || null);
        setPendingTier((doc.pendingTier as string) || null);
      }

      // Count invoices for the current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

      const invoiceRes = await databases.listDocuments(databaseId, documentsCollectionId, [
        Query.equal("userId", userId),
        Query.equal("type", "FACTURE"),
        Query.greaterThanEqual("$createdAt", startOfMonth),
        Query.lessThanEqual("$createdAt", endOfMonth),
        Query.limit(1), // we only need the total count
      ]);

      setInvoiceCountThisMonth(invoiceRes.total);
    } catch (err) {
      console.error("PlanContext: failed to load plan data", err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const refreshCount = useCallback(async () => {
    if (!userId) return;
    try {
      const { databaseId, documentsCollectionId } = APPWRITE_CONFIG;
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

      const invoiceRes = await databases.listDocuments(databaseId, documentsCollectionId, [
        Query.equal("userId", userId),
        Query.equal("type", "FACTURE"),
        Query.greaterThanEqual("$createdAt", startOfMonth),
        Query.lessThanEqual("$createdAt", endOfMonth),
        Query.limit(1),
      ]);

      setInvoiceCountThisMonth(invoiceRes.total);
    } catch (err) {
      console.error("PlanContext: failed to refresh count", err);
    }
  }, [userId]);

  const checkInvoiceLimit = useCallback((): boolean => {
    if (invoiceCountThisMonth >= limits.maxInvoicesPerMonth) {
      setShowUpgradeModal(true);
      return false;
    }
    return true;
  }, [invoiceCountThisMonth, limits.maxInvoicesPerMonth]);

  useEffect(() => {
    void loadPlanAndCount();
  }, [loadPlanAndCount]);

  return (
    <PlanContext.Provider
      value={{
        planTier,
        limits,
        invoiceCountThisMonth,
        canCreateInvoice,
        isLoading,
        showUpgradeModal,
        setShowUpgradeModal,
        checkInvoiceLimit,
        refreshCount,
        paymentStatus,
        pendingTier,
        refreshPlan: loadPlanAndCount,
      }}
    >
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  const context = useContext(PlanContext);
  if (!context) {
    throw new Error("usePlan must be used within a PlanProvider");
  }
  return context;
}
