"use client";

import * as React from "react";

type ToastVariant = "success" | "error" | "info";

export type ToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  durationMs?: number;
};

type ToastItem = {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  toast: (input: ToastInput) => void;
};

type ToastStateContextValue = {
  toasts: ToastItem[];
  dismissToast: (id: string) => void;
};

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);
const ToastStateContext = React.createContext<ToastStateContextValue | undefined>(
  undefined
);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const dismissToast = React.useCallback((id: string) => {
    setToasts((current) => current.filter((toastItem) => toastItem.id !== id));
  }, []);

  const toast = React.useCallback(
    (input: ToastInput) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const variant = input.variant ?? "info";
      const durationMs = input.durationMs ?? 3500;

      setToasts((current) => [
        ...current,
        {
          id,
          title: input.title,
          description: input.description,
          variant,
        },
      ]);

      window.setTimeout(() => {
        dismissToast(id);
      }, durationMs);
    },
    [dismissToast]
  );

  const contextValue = React.useMemo(
    () => ({
      toast,
    }),
    [toast]
  );

  const stateValue = React.useMemo(
    () => ({
      toasts,
      dismissToast,
    }),
    [toasts, dismissToast]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      <ToastStateContext.Provider value={stateValue}>
        {children}
      </ToastStateContext.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return context;
}

export function useToastState() {
  const context = React.useContext(ToastStateContext);

  if (!context) {
    throw new Error("useToastState must be used within ToastProvider");
  }

  return context;
}
