"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Sparkles,
  BookMarked,
  History,
  Users2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import type { User } from "@supabase/supabase-js";

interface SidebarProps {
  user?: User | null;
}

const NAV_ITEMS = [
  { href: "/dashboard",    label: "Dashboard",   icon: LayoutDashboard },
  { href: "/generate",     label: "Generate",    icon: Sparkles },
  { href: "/collections",  label: "Collections", icon: BookMarked },
  { href: "/history",      label: "History",     icon: History },
  { href: "/community",    label: "Community",   icon: Users2 },
] as const;

const PLAN_BADGE_VARIANT: Record<string, "FREE" | "PRO" | "CREATOR" | "ENTERPRISE"> = {
  FREE: "FREE",
  PRO: "PRO",
  CREATOR: "CREATOR",
  ENTERPRISE: "ENTERPRISE",
};

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const plan = (user?.user_metadata?.plan as string) ?? "FREE";
  const badgeVariant = PLAN_BADGE_VARIANT[plan] ?? "FREE";

  return (
    <aside
      className={cn(
        "relative hidden md:flex flex-col h-full border-r border-border bg-card/50 transition-all duration-200",
        collapsed ? "w-14" : "w-56"
      )}
    >
      {/* Collapse toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-5 z-10 h-6 w-6 rounded-full border border-border bg-card shadow-sm"
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </Button>

      {/* Nav */}
      <nav className="flex flex-col gap-1 p-2 pt-4 flex-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? label : undefined}
            >
              <Icon className={cn("shrink-0", active ? "text-primary" : "text-muted-foreground", "h-4 w-4")} />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Plan badge at bottom */}
      {!collapsed && user && (
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
            <Badge variant={badgeVariant} className="shrink-0 text-[10px] px-1.5 py-0">
              {plan}
            </Badge>
          </div>
        </div>
      )}
    </aside>
  );
}

/** Mobile bottom nav — shown below md breakpoint */
export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-border bg-background/95 backdrop-blur-sm px-2 pb-safe-bottom md:hidden">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-2 text-[10px] font-medium transition-colors",
              active ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
