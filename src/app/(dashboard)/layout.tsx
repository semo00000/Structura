"use client";

import * as React from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { AppHeader } from "@/components/AppHeader";
import { SidebarProvider, useSidebar, SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from "@/contexts/SidebarContext";

// --- Polyfill for matchMedia to fix @base-ui / floating-ui crash ---
if (typeof window !== "undefined" && window.matchMedia) {
  const m = window.matchMedia("(min-width: 1px)");
  if (typeof m.addListener !== "function") {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = function (query) {
      const result = originalMatchMedia(query);
      if (typeof result.addListener !== "function") {
        result.addListener = function (cb: any) { result.addEventListener("change", cb); };
        result.removeListener = function (cb: any) { result.removeEventListener("change", cb); };
      }
      return result;
    };
  }
}

import { PlanProvider } from "@/contexts/PlanContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { UpgradeModal } from "@/components/UpgradeModal";

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { collapsed, isMobile } = useSidebar();

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <div
        className="flex flex-1 flex-col overflow-hidden transition-all duration-300"
        style={{
          marginLeft: isMobile ? 0 : collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
        }}
      >
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <PlanProvider>
        <SidebarProvider>
          <DashboardShell>{children}</DashboardShell>
        </SidebarProvider>
        <UpgradeModal />
      </PlanProvider>
    </AuthProvider>
  );
}
