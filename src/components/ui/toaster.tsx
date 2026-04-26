"use client";

import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToastState } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

function toastContainerClass(variant: "success" | "error" | "info") {
  if (variant === "success") {
    return "border-emerald-200/50 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-300";
  }

  if (variant === "error") {
    return "border-red-200/50 bg-red-50 text-red-900 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300";
  }

  return "border-border bg-card text-foreground";
}

function ToastIcon({ variant }: { variant: "success" | "error" | "info" }) {
  if (variant === "success") {
    return <CheckCircle2 className="mt-0.5 size-4 text-emerald-600 dark:text-emerald-400" />;
  }

  if (variant === "error") {
    return <AlertCircle className="mt-0.5 size-4 text-red-600 dark:text-red-400" />;
  }

  return <Info className="mt-0.5 size-4 text-muted-foreground" />;
}

export function Toaster() {
  const { toasts, dismissToast } = useToastState();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed right-0 top-0 z-[100] flex w-full max-w-sm flex-col gap-2 p-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "pointer-events-auto rounded-lg border px-3 py-2 shadow-sm",
            toastContainerClass(toast.variant)
          )}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start gap-2">
            <ToastIcon variant={toast.variant} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{toast.title}</p>
              {toast.description ? (
                <p className="mt-0.5 text-xs opacity-90">{toast.description}</p>
              ) : null}
            </div>
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              className="size-6 rounded-md"
              onClick={() => dismissToast(toast.id)}
              aria-label="Fermer la notification"
            >
              <X className="size-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
