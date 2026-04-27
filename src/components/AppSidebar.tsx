"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navigation } from "@/lib/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useSidebar, SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from "@/contexts/SidebarContext";
import { usePlan } from "@/contexts/PlanContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { ChevronLeft, Crown, Loader2, Lock, LogIn, LogOut } from "lucide-react";

// ─── Sidebar nav content (shared between desktop + mobile) ───

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { collapsed, isMobile } = useSidebar();
  const { subscriptionTier, setShowUpgradeModal } = usePlan();
  const { t } = useLanguage();

  const TIER_ORDER: Record<string, number> = { Core: 0, Pro: 1, Enterprise: 2 };
  const userTierLevel = TIER_ORDER[subscriptionTier] ?? 1;
  const isExpanded = isMobile || !collapsed;

  return (
    <nav className="flex flex-col gap-5">
      {navigation.map((group) => (
        <div key={group.label}>
          {isExpanded && (
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/35">
              {group.label}
            </p>
          )}
          <ul className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const requiredLevel = item.requiresPlan ? (TIER_ORDER[item.requiresPlan] ?? 0) : 0;
              const isLocked = requiredLevel > userTierLevel;
              const isActive =
                !isLocked &&
                (pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href)));
              const Icon = item.icon;
              const title = t.nav[item.translationKey as keyof typeof t.nav] || item.title;

              if (isLocked) {
                const lockedContent = (
                  <button
                    type="button"
                    onClick={() => setShowUpgradeModal(true)}
                    className={cn(
                      "group flex w-full items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-all duration-200",
                      "text-sidebar-foreground/30 hover:bg-sidebar-accent/30 cursor-pointer",
                      !isExpanded && "justify-center px-0"
                    )}
                  >
                    <Lock className="size-[17px] shrink-0 text-sidebar-foreground/25" />
                    {isExpanded && (
                      <span className="flex flex-1 items-center justify-between truncate">
                        <span>{title}</span>
                        <span className="ml-2 flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400/20 to-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-600">
                          <Crown className="size-2.5" />
                          PRO
                        </span>
                      </span>
                    )}
                  </button>
                );

                if (!isExpanded) {
                  return (
                    <li key={item.href}>
                      <Tooltip>
                        <TooltipTrigger render={lockedContent} />
                        <TooltipContent side="right" className="font-medium">
                          {title} <span className="text-amber-500">(Pro)</span>
                        </TooltipContent>
                      </Tooltip>
                    </li>
                  );
                }

                return <li key={item.href}>{lockedContent}</li>;
              }

              const linkContent = (
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "group flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-all duration-200",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                    !isExpanded && "justify-center px-0"
                  )}
                >
                  <Icon
                    className={cn(
                      "size-[17px] shrink-0 transition-colors",
                      isActive
                        ? "text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70"
                    )}
                  />
                  {isExpanded && <span className="truncate">{title}</span>}
                </Link>
              );

              if (!isExpanded) {
                return (
                  <li key={item.href}>
                    <Tooltip>
                      <TooltipTrigger render={linkContent} />
                      <TooltipContent side="right" className="font-medium">
                        {title}
                      </TooltipContent>
                    </Tooltip>
                  </li>
                );
              }

              return <li key={item.href}>{linkContent}</li>;
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

// ─── Sidebar footer (shared) ───

function SidebarFooter({ variant }: { variant: "desktop" | "mobile" }) {
  const { collapsed, isMobile } = useSidebar();
  const { email: userEmail, authState, handleLogout } = useAuth();
  const { t } = useLanguage();
  const isAuthenticated = authState === "authed";
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const isExpanded = variant === "mobile" || !collapsed;

  async function performLogout() {
    setIsLoggingOut(true);
    try {
      await handleLogout();
    } finally {
      setIsLoggingOut(false);
    }
  }

  if (!isExpanded) {
    return (
      <div className="border-t border-sidebar-border p-3">
        {isAuthenticated ? (
          <Tooltip>
            <TooltipTrigger render={<Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="w-full text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                onClick={() => void performLogout()}
                disabled={isLoggingOut}
              />} />
            <TooltipContent side="right" className="font-medium">
              {t.nav.logout}
            </TooltipContent>
          </Tooltip>
        ) : (
          <Tooltip>
            <TooltipTrigger render={<Button
                variant="ghost"
                size="icon-sm"
                className="w-full text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                nativeButton={false}
                render={<Link href="/login" />}
              ><LogIn className="size-4" /></Button>} />
            <TooltipContent side="right" className="font-medium">
              {t.nav.login}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    );
  }

  return (
    <div className="border-t border-sidebar-border p-3">
      <div className="rounded-md bg-sidebar-accent/40 px-3 py-2">
        <p className="text-[11px] font-medium text-sidebar-foreground/60">
          Structura v1.0
        </p>
        <p className="text-[10px] text-sidebar-foreground/35">
          Le Karniy Digital
        </p>
        <p className="mt-2 truncate text-[11px] text-sidebar-foreground/70">
          {userEmail}
        </p>

        {isAuthenticated ? (
          <Button
            type="button"
            size="sm"
            className="mt-3 w-full bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => void performLogout()}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                {t.common.loading}
              </>
            ) : (
              <>
                <LogOut className="size-3.5" />
                {t.nav.logout}
              </>
            )}
          </Button>
        ) : (
          <Button
            size="sm"
            className="mt-3 w-full bg-primary text-primary-foreground hover:bg-primary/90"
            nativeButton={false}
            render={<Link href="/login" />}
          >
            <LogIn className="size-3.5" />
            {t.nav.login}
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Main export ───

export function AppSidebar() {
  const { collapsed, toggle, isMobile, mobileOpen, setMobileOpen } = useSidebar();

  // ── Mobile: Sheet drawer ──
  if (isMobile) {
    return (
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-[280px] bg-sidebar p-0 sm:max-w-[280px] [&_[data-slot=sheet-overlay]]:bg-black/40"
        >
          {/* Accessible title for screen readers */}
          <SheetTitle className="sr-only">Navigation Structura</SheetTitle>
          <SheetDescription className="sr-only">Menu de navigation principal</SheetDescription>

          {/* Brand */}
          <div className="flex h-14 items-center gap-3 px-4">
            <span className="font-mono text-lg font-black tracking-[0.2em] text-sidebar-foreground">
              STRUCTURA
            </span>
          </div>
          <Separator className="bg-sidebar-border" />

          {/* Nav */}
          <ScrollArea className="flex-1 px-3 py-4">
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
          </ScrollArea>

          {/* Footer */}
          <SidebarFooter variant="mobile" />
        </SheetContent>
      </Sheet>
    );
  }

  // ── Desktop: Fixed sidebar ──
  return (
    <aside
      style={{ width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH }}
      className="fixed inset-y-0 left-0 z-40 flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out"
    >
      {/* Brand */}
      <div className="flex h-14 items-center gap-3 px-4">
        {!collapsed ? (
          <span className="font-mono text-lg font-black tracking-[0.2em] text-sidebar-foreground">
            STRUCTURA
          </span>
        ) : (
          <span className="font-mono text-xl font-black text-sidebar-foreground">
            S
          </span>
        )}
        <button
          onClick={toggle}
          className={cn(
            "ml-auto flex size-7 shrink-0 items-center justify-center rounded-md text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground",
            collapsed && "ml-0"
          )}
          aria-label={collapsed ? "Développer la barre latérale" : "Réduire la barre latérale"}
        >
          <ChevronLeft
            className={cn(
              "size-4 transition-transform duration-300",
              collapsed && "rotate-180"
            )}
          />
        </button>
      </div>

      <Separator className="bg-sidebar-border" />

      {/* Nav */}
      <ScrollArea className="flex-1 px-3 py-4">
        <SidebarNav />
      </ScrollArea>

      {/* Footer */}
      <SidebarFooter variant="desktop" />
    </aside>
  );
}
