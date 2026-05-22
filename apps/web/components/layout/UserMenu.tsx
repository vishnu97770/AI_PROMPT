"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  LogOut,
  Settings,
  User,
  ChevronDown,
  Sparkles,
  LayoutDashboard,
} from "lucide-react";
import { createBrowserClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import type { User as SupabaseUser } from "@supabase/supabase-js";

// ─── Types ────────────────────────────────────────────────────────────────────

type Plan = "FREE" | "PRO" | "CREATOR" | "ENTERPRISE";

interface UserMenuProps {
  user: SupabaseUser;
  plan?: Plan;
  creditsRemaining?: number;
}

// ─── Plan badge ───────────────────────────────────────────────────────────────

const PLAN_STYLES: Record<Plan, string> = {
  FREE: "bg-muted text-muted-foreground",
  PRO: "bg-primary/15 text-primary",
  CREATOR: "bg-violet-500/15 text-violet-400",
  ENTERPRISE: "bg-amber-500/15 text-amber-400",
};

function PlanBadge({ plan }: { plan: Plan }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide",
        PLAN_STYLES[plan]
      )}
    >
      {plan === "PRO" && <Sparkles className="w-2.5 h-2.5 mr-0.5" />}
      {plan}
    </span>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({
  src,
  name,
  size = "md",
}: {
  src?: string | null;
  name?: string | null;
  size?: "sm" | "md";
}) {
  const initials = (name ?? "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const sizeClass = size === "sm" ? "w-7 h-7 text-xs" : "w-8 h-8 text-sm";

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name ?? "User avatar"}
        className={cn("rounded-full object-cover ring-2 ring-border", sizeClass)}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-medium",
        "bg-primary/20 text-primary ring-2 ring-border",
        sizeClass
      )}
    >
      {initials}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function UserMenu({
  user,
  plan = "FREE",
  creditsRemaining,
}: UserMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const displayName =
    user.user_metadata?.display_name ??
    user.user_metadata?.full_name ??
    user.email?.split("@")[0] ??
    "User";
  const avatarUrl =
    user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null;

  // Close menu when clicking outside
  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    if (open) document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open]);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createBrowserClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to sign out. Please try again.");
      setSigningOut(false);
      return;
    }
    toast.success("Signed out successfully");
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Open user menu"
        className={cn(
          "flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg",
          "hover:bg-accent transition-colors",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        )}
      >
        <Avatar src={avatarUrl} name={displayName} />
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-muted-foreground transition-transform duration-150",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className={cn(
            "absolute right-0 mt-1.5 w-64 z-50",
            "rounded-xl border border-border bg-card shadow-lg",
            "animate-in fade-in slide-in-from-top-2 duration-150"
          )}
          role="menu"
        >
          {/* User info header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <Avatar src={avatarUrl} name={displayName} size="md" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
            <PlanBadge plan={plan} />
          </div>

          {/* Credits (if applicable) */}
          {plan === "FREE" && typeof creditsRemaining === "number" && (
            <div className="px-4 py-2.5 border-b border-border">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-muted-foreground">Daily credits</span>
                <span className="text-xs font-medium">{creditsRemaining} / 10</span>
              </div>
              <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${(creditsRemaining / 10) * 100}%` }}
                />
              </div>
              <Link
                href="/pricing"
                onClick={() => setOpen(false)}
                className="mt-2 block text-xs text-primary hover:underline"
              >
                Upgrade for unlimited →
              </Link>
            </div>
          )}

          {/* Nav items */}
          <div className="p-1.5" role="none">
            <MenuItem
              href="/dashboard"
              icon={<LayoutDashboard className="w-4 h-4" />}
              label="Dashboard"
              onClick={() => setOpen(false)}
            />
            <MenuItem
              href="/settings/profile"
              icon={<User className="w-4 h-4" />}
              label="Profile"
              onClick={() => setOpen(false)}
            />
            <MenuItem
              href="/settings"
              icon={<Settings className="w-4 h-4" />}
              label="Settings"
              onClick={() => setOpen(false)}
            />
          </div>

          {/* Sign out */}
          <div className="p-1.5 border-t border-border" role="none">
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              role="menuitem"
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm",
                "text-destructive hover:bg-destructive/10 transition-colors",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <LogOut className="w-4 h-4" />
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MenuItem helper ──────────────────────────────────────────────────────────

function MenuItem({
  href,
  icon,
  label,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm",
        "hover:bg-accent transition-colors"
      )}
    >
      <span className="text-muted-foreground">{icon}</span>
      {label}
    </Link>
  );
}
