import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase";

// Supabase redirects here after Google OAuth / email confirmation with a
// one-time `code` parameter. We exchange it for a session cookie and then
// forward the user to their intended destination.

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  // Reject non-relative redirect targets to prevent open-redirect attacks
  const safeNext = next.startsWith("/") ? next : "/dashboard";

  if (!code) {
    // No code — something went wrong on Supabase's side
    return NextResponse.redirect(
      new URL(`/login?error=missing_code`, origin)
    );
  }

  const supabase = await createServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] exchangeCodeForSession error:", error.message);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, origin)
    );
  }

  // Session established — redirect to the originally requested page
  return NextResponse.redirect(new URL(safeNext, origin));
}
