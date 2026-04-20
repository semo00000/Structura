"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { navigation } from "@/lib/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useSidebar, SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from "@/contexts/SidebarContext";
import { usePlan } from "@/contexts/PlanContext";
import { account } from "@/lib/appwrite";
import { ChevronLeft, Crown, Loader2, Lock, LogIn, LogOut } from "lucide-react";

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { collapsed, toggle } = useSidebar();
  const { planTier, setShowUpgradeModal } = usePlan();
  const [userEmail, setUserEmail] = React.useState("Utilisateur");
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  // Plan tier ordering for access checks
  const TIER_ORDER: Record<string, number> = { Starter: 0, Pro: 1, Business: 2 };
  const userTierLevel = TIER_ORDER[planTier] ?? 0;

  React.useEffect(() => {
    let isMounted = true;

    async function loadCurrentUser() {
      try {
        const user = await account.get();

        if (!isMounted) {
          return;
        }

        setIsAuthenticated(true);
        setUserEmail(user.email || "Utilisateur connecte");
      } catch {
        if (!isMounted) {
          return;
        }

        setIsAuthenticated(false);
        setUserEmail("Utilisateur");
      }
    }

    void loadCurrentUser();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await account.deleteSession("current");
      setIsAuthenticated(false);
      setUserEmail("Utilisateur");
      router.replace("/login");
      router.refresh();
    } catch {
      setIsLoggingOut(false);
    }
  }

  return (
    <aside
      style={{ width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH }}
      className="fixed inset-y-0 left-0 z-40 flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out"
    >
      {/* Logo / Brand */}
      <div className="flex h-16 items-center gap-3 px-4">
        {!collapsed ? (
          <span className="text-base font-extrabold tracking-[0.15em] text-sidebar-foreground">
            STRUCTURA
          </span>
        ) : (
          <span className="text-lg font-extrabold text-sidebar-foreground">
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

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-6">
          {navigation.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/35">
                  {group.label}
                </p>
              )}
              <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                  const requiredLevel = item.requiresPlan ? (TIER_ORDER[item.requiresPlan] ?? 0) : 0;
                  const isLocked = requiredLevel > userTierLevel;
                  const isActive =
                    !isLocked && (pathname === item.href ||
                    (item.href !== "/dashboard" && pathname.startsWith(item.href)));
                  const Icon = item.icon;

                  // Locked item: show lock icon + Pro badge, trigger upgrade modal
                  if (isLocked) {
                    const lockedContent = (
                      <button
                        type="button"
                        onClick={() => setShowUpgradeModal(true)}
                        className={cn(
                          "group flex w-full items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-all duration-150",
                          "text-sidebar-foreground/30 hover:bg-sidebar-accent/30 cursor-pointer",
                          collapsed && "justify-center px-0"
                        )}
                      >
                        <Lock className="size-[17px] shrink-0 text-sidebar-foreground/25" />
                        {!collapsed && (
                          <span className="flex flex-1 items-center justify-between truncate">
                            <span>{item.title}</span>
                            <span className="ml-2 flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400/20 to-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-600">
                              <Crown className="size-2.5" />
                              PRO
                            </span>
                          </span>
                        )}
                      </button>
                    );

                    if (collapsed) {
                      return (
                        <li key={item.href}>
                          <Tooltip>
                            <TooltipTrigger render={lockedContent} />
                            <TooltipContent side="right" className="font-medium">
                              {item.title} <span className="text-amber-500">(Pro)</span>
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
                      className={cn(
                        "group flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-all duration-150",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                        collapsed && "justify-center px-0"
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
                      {!collapsed && (
                        <span className="truncate">{item.title}</span>
                      )}
                    </Link>
                  );

                  if (collapsed) {
                    return (
                      <li key={item.href}>
                        <Tooltip>
                          <TooltipTrigger
                            render={linkContent}
                          />
                          <TooltipContent side="right" className="font-medium">
                            {item.title}
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
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3">
        {collapsed ? (
          isAuthenticated ? (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="w-full text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    onClick={() => {
                      void handleLogout();
                    }}
                    disabled={isLoggingOut}
                  />
                }
              >
                {isLoggingOut ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <LogOut className="size-4" />
                )}
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                Déconnexion
              </TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="w-full text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    nativeButton={false}
                    render={<Link href="/login" />}
                  />
                }
              >
                <LogIn className="size-4" />
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                Connexion
              </TooltipContent>
            </Tooltip>
          )
        ) : (
          <div className="rounded-md bg-sidebar-accent/40 px-3 py-2">
            <p className="text-[11px] font-medium text-sidebar-foreground/60">
              Structura v1.0
            </p>
            <p className="text-[10px] text-sidebar-foreground/35">
              Gestion commerciale
            </p>
            <p className="mt-2 truncate text-[11px] text-sidebar-foreground/70">
              {userEmail}
            </p>

            {isAuthenticated ? (
              <Button
                type="button"
                size="sm"
                className="mt-3 w-full bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
                onClick={() => {
                  void handleLogout();
                }}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Déconnexion...
                  </>
                ) : (
                  <>
                    <LogOut className="size-3.5" />
                    Déconnexion
                  </>
                )}
              </Button>
            ) : (
              <Button
                size="sm"
                className="mt-3 w-full bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
                nativeButton={false}
                render={<Link href="/login" />}
              >
                <LogIn className="size-3.5" />
                Connexion
              </Button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
