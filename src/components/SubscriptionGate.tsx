"use client";

import * as React from "react";
import { usePlan, type SubscriptionTier } from "@/contexts/PlanContext";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles } from "lucide-react";

interface SubscriptionGateProps {
  children: React.ReactNode;
  tier: SubscriptionTier;
  fallback?: React.ReactNode;
}

export function SubscriptionGate({ children, tier, fallback }: SubscriptionGateProps) {
  const { subscriptionTier, setShowUpgradeModal } = usePlan();

  const tierOrder: SubscriptionTier[] = ["Core", "Pro", "Enterprise"];
  const hasAccess = tierOrder.indexOf(subscriptionTier) >= tierOrder.indexOf(tier);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) return <>{fallback}</>;

  return (
    <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-2xl bg-muted/30 text-center space-y-4">
      <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
        <Lock className="size-6 text-primary" />
      </div>
      <div className="space-y-1">
        <h3 className="font-bold text-foreground">Fonctionnalité Verrouillée</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Cette fonctionnalité nécessite le plan <span className="font-bold text-primary uppercase tracking-tighter">{tier}</span>.
        </p>
      </div>
      <Button size="sm" variant="outline" className="gap-2 border-primary/20 text-primary hover:bg-primary/5" onClick={() => setShowUpgradeModal(true)}>
        <Sparkles className="size-4" />
        Débloquer maintenant
      </Button>
    </div>
  );
}
