"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";
import { AppHeader } from "@/components/AppHeader";
import { SidebarProvider, useSidebar, SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from "@/contexts/SidebarContext";
import { PlanProvider } from "@/contexts/PlanContext";
import { UpgradeModal } from "@/components/UpgradeModal";
import { account } from "@/lib/appwrite";

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <div
        className="flex flex-1 flex-col overflow-hidden transition-all duration-300"
        style={{ marginLeft: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH }}
      >
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-6">
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
  const pathname = usePathname();
  const [authState, setAuthState] = React.useState<"checking" | "authed" | "guest">("checking");

  React.useEffect(() => {
    let isMounted = true;

    async function verifySession() {
      try {
        await account.get();

        if (!isMounted) {
          return;
        }
        
        // Pillar 2: The Onboarding Flow Wall
        try {
           const { databaseId, companyCollectionId } = await import("@/lib/appwrite").then(m => m.APPWRITE_CONFIG);
           const { databases } = await import("@/lib/appwrite");
           const { Query } = await import("appwrite");
           const companyDocs = await databases.listDocuments(databaseId, companyCollectionId, [Query.limit(1)]);
           
           if (companyDocs.total === 0) {
             setAuthState("guest");
             window.location.href = "/onboarding";
             return;
           }
        } catch (e) {
             console.error("Error checking company docs: ", e);
             // Assume they need onboarding if failure (or handle gracefully)
        }

        setAuthState("authed");
      } catch {
        if (!isMounted) {
          return;
        }

        setAuthState("guest");
        const nextPath = pathname || "/statistiques";
        window.location.href = `/login?next=${encodeURIComponent(nextPath)}`;
      }
    }

    void verifySession();

    return () => {
      isMounted = false;
    };
  }, [pathname]);

  if (authState !== "authed") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
          <Loader2 className="size-4 animate-spin text-[#2563EB]" />
          Verification de la session...
        </div>
      </div>
    );
  }

  return (
    <PlanProvider>
      <SidebarProvider>
        <DashboardShell>{children}</DashboardShell>
      </SidebarProvider>
      <UpgradeModal />
    </PlanProvider>
  );
}
