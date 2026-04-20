"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { usePlan } from "@/contexts/PlanContext";
import { Crown, Zap, Shield, X, Check, Sparkles } from "lucide-react";

export function UpgradeModal() {
  const router = useRouter();
  const { showUpgradeModal, setShowUpgradeModal, planTier, invoiceCountThisMonth, limits } = usePlan();

  if (!showUpgradeModal) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setShowUpgradeModal(false)}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg animate-in fade-in zoom-in-95 duration-300">
        <div className="mx-4 overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-2xl">
          {/* Header */}
          <div className="relative bg-gradient-to-br from-[#2563EB] via-[#1D4ED8] to-[#1E40AF] px-8 pb-8 pt-10 text-white">
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
            >
              <X className="size-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                <Crown className="size-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Limite atteinte</h2>
                <p className="text-sm text-white/70">
                  Plan {planTier} — {invoiceCountThisMonth}/{limits.maxInvoicesPerMonth === Infinity ? "∞" : limits.maxInvoicesPerMonth} factures ce mois
                </p>
              </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-white/80">
              Vous avez atteint la limite de <strong>{limits.maxInvoicesPerMonth} factures</strong> par mois
              sur le plan Starter. Passez au plan Pro pour débloquer la facturation illimitée
              et la gestion de stock.
            </p>
          </div>

          {/* Plans Comparison */}
          <div className="px-8 py-6">
            <div className="grid grid-cols-2 gap-4">
              {/* Pro Plan */}
              <div className="rounded-xl border-2 border-[#2563EB] bg-blue-50/50 p-5">
                <div className="flex items-center gap-2 text-[#2563EB]">
                  <Zap className="size-4" />
                  <span className="text-sm font-bold">Pro</span>
                </div>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  299 <span className="text-sm font-normal text-slate-500">DH/mois</span>
                </p>
                <ul className="mt-4 space-y-2">
                  {[
                    "Factures illimitées",
                    "Gestion de stock",
                    "Sans filigrane",
                    "Export PDF avancé",
                    "Support prioritaire",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-[13px] text-slate-700">
                      <Check className="size-3.5 shrink-0 text-[#2563EB]" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Business Plan */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5">
                <div className="flex items-center gap-2 text-slate-700">
                  <Shield className="size-4" />
                  <span className="text-sm font-bold">Business</span>
                </div>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  599 <span className="text-sm font-normal text-slate-500">DH/mois</span>
                </p>
                <ul className="mt-4 space-y-2">
                  {[
                    "Tout dans Pro",
                    "Multi-utilisateurs",
                    "Gestion des rôles",
                    "Rapports avancés",
                    "API & Intégrations",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-[13px] text-slate-700">
                      <Check className="size-3.5 shrink-0 text-emerald-500" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={() => {
                setShowUpgradeModal(false);
                router.push("/abonnement");
              }}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30"
            >
              <Sparkles className="size-4" />
              Passer au Plan Pro — 299 DH/mois
            </button>

            <p className="mt-3 text-center text-xs text-slate-400">
              Annulez à tout moment · Essai gratuit de 14 jours · Sans engagement
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
