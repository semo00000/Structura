"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { CalendarDays, Bell, Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { navigation } from "@/lib/navigation";

function getPageTitle(pathname: string): string {
  for (const group of navigation) {
    for (const item of group.items) {
      if (
        pathname === item.href ||
        (item.href !== "/dashboard" && pathname.startsWith(item.href))
      ) {
        return item.title;
      }
    }
  }
  return "Tableau de bord";
}

function formatDate(): string {
  return new Intl.DateTimeFormat("fr-MA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

export function AppHeader() {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);
  const today = formatDate();
  const { displayName, email: userEmail, initials, handleLogout } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card px-6">
      {/* Left — Page title */}
      <h1 className="text-sm font-semibold tracking-tight text-foreground">
        {pageTitle}
      </h1>

      {/* Right — Actions */}
      <div className="flex items-center gap-2">
        {/* Date badge */}
        <Badge
          variant="secondary"
          className="hidden gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium md:flex"
        >
          <CalendarDays className="size-3" />
          <span className="capitalize">{today}</span>
        </Badge>

        {/* Search */}
        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground transition-colors duration-200 hover:bg-accent/50 hover:text-foreground">
          <Search className="size-3.5" />
          <span className="sr-only">Rechercher</span>
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative size-8 text-muted-foreground transition-colors duration-200 hover:bg-accent/50 hover:text-foreground">
          <Bell className="size-3.5" />
          <span className="absolute right-1.5 top-1 size-1.5 rounded-full bg-destructive" />
          <span className="sr-only">Notifications</span>
        </Button>

        {/* Separator */}
        <div className="mx-1 h-5 w-px bg-border" />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="flex items-center gap-2 rounded-md px-2 py-1 text-sm font-medium outline-none transition-colors duration-200 hover:bg-accent/80 hover:text-accent-foreground">
                <Avatar className="size-7">
                  <AvatarFallback className="bg-primary text-[10px] font-bold text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-xs font-medium text-foreground md:inline-block">
                  {displayName}
                </span>
              </button>
            }
          />
          <DropdownMenuContent align="end" className="w-52">
            <div className="flex flex-col gap-0.5 px-2 py-2">
              <p className="text-sm font-medium">{displayName}</p>
              <p className="text-xs text-muted-foreground">{userEmail}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>Paramètres du compte</DropdownMenuItem>
              <DropdownMenuItem>Aide & Support</DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => void handleLogout()} variant="destructive" className="cursor-pointer">
                Se déconnecter
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
