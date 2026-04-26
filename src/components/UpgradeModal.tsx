"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { usePlan, type SubscriptionTier } from "@/contexts/PlanContext";
import { Crown, Zap, Shield, X, Check, Sparkles } from "lucide-react";

export function UpgradeModal() {
  const router = useRouter();
  const { showUpgradeModal, setShowUpgradeModal, subscriptionTier, invoiceCountThisMonth, limits } = usePlan();

  if (!showUpgradeModal) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setShowUpgradeModal(false)}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-4xl animate-in fade-in zoom-in-95 duration-300">
        <div className="mx-4 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          {/* Header */}
          <div className="relative bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#020617] px-8 pb-8 pt-10 text-white text-center">
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
            >
              <X className="size-4" />
            </button>

            <div className="inline-flex items-center justify-center gap-3 mb-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary/20 backdrop-blur-sm border border-primary/30">
                <Crown className="size-6 text-primary" />
              </div>
            </div>
            
            <h2 className="text-3xl font-black tracking-tight mb-2">Évoluez vers l'excellence</h2>
            <p className="text-white/60 max-w-lg mx-auto">
              Choisissez le plan qui correspond à l'ambition de votre entreprise. Libérez toute la puissance de Structura.
            </p>
          </div>

          {/* Plans Comparison */}
          <div className="px-8 py-10 bg-muted/30">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Core Plan */}
              <div className="rounded-2xl border border-border bg-card p-6 flex flex-col opacity-70">
                <div className="flex items-center gap-2 text-muted-foreground mb-4">
                  <Zap className="size-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">Core</span>
                </div>
                <div className="mb-6">
                  <p className="text-4xl font-black text-foreground">0 <span className="text-sm font-normal text-muted-foreground">DH/mois</span></p>
                  <p className="text-xs text-muted-foreground mt-1">Essentiel pour démarrer</p>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {["50 Factures / mois", "CRM Unifié", "Catalogue Produits", "Dashboard de base"].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-[13px] text-muted-foreground">
                      <Check className="size-3.5 shrink-0 text-muted-foreground" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button disabled className="w-full py-2.5 rounded-xl border border-border text-xs font-bold text-muted-foreground bg-muted/50">
                  Plan actuel
                </button>
              </div>

              {/* Pro Plan */}
              <div className="rounded-2xl border-2 border-primary bg-card p-6 flex flex-col relative shadow-xl shadow-primary/5 scale-105 z-10">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-tighter">
                  Recommandé
                </div>
                <div className="flex items-center gap-2 text-primary mb-4">
                  <Crown className="size-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">Pro</span>
                </div>
                <div className="mb-6">
                  <p className="text-4xl font-black text-foreground">299 <span className="text-sm font-normal text-muted-foreground">DH/mois</span></p>
                  <p className="text-xs text-primary/80 font-medium mt-1">Le Moteur Commercial</p>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {["Factures illimitées", "Conversion 1-Click", "Réconciliation FIFO", "Gouvernance & Rôles", "Sans Filigrane"].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-[13px] text-foreground/80">
                      <Check className="size-3.5 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={() => router.push("/abonnement?tier=Pro")}
                  className="w-full py-3 rounded-xl bg-primary text-white text-xs font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
                >
                  Passer à Pro
                </button>
              </div>

              {/* Enterprise Plan */}
              <div className="rounded-2xl border border-border bg-card p-6 flex flex-col">
                <div className="flex items-center gap-2 text-indigo-600 mb-4">
                  <Shield className="size-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">Enterprise</span>
                </div>
                <div className="mb-6">
                  <p className="text-4xl font-black text-foreground">999 <span className="text-sm font-normal text-muted-foreground">DH/mois</span></p>
                  <p className="text-xs text-muted-foreground mt-1">Gouvernance & Contrôle</p>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {["Tout du plan Pro", "RBAC (Multi-Rôles)", "Branding Complet", "Analytique Executive", "Support 24/7"].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-[13px] text-muted-foreground">
                      <Check className="size-3.5 shrink-0 text-indigo-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={() => router.push("/abonnement?tier=Enterprise")}
                  className="w-full py-2.5 rounded-xl border border-indigo-200 text-indigo-600 text-xs font-bold hover:bg-indigo-50 transition-all"
                >
                  Contactez-nous
                </button>
              </div>

            </div>

            <p className="mt-8 text-center text-xs text-muted-foreground">
              Prix hors taxes · Engagement mensuel · Support inclus
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
