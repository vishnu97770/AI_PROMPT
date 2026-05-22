"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  plan: "FREE" | "PRO" | "CREATOR" | "ENTERPRISE";
  creditsRemaining: number;
}

// ─── getCurrentUser ───────────────────────────────────────────────────────────
// Returns the authenticated Supabase user, or null if not signed in.
// Uses getUser() (JWT-verified) instead of getSession() (client-only cache).

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
}

// ─── requireAuth ─────────────────────────────────────────────────────────────
// Throws a redirect to /login if there is no authenticated session.
// Use at the top of any protected Server Component or Server Action.

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

// ─── signOut ─────────────────────────────────────────────────────────────────

export async function signOut(): Promise<void> {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
