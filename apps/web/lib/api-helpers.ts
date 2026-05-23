import { NextResponse } from "next/server";
import { ZodError } from "zod";
import crypto from "crypto";

// ─── Consistent error responses ───────────────────────────────────────────────

export function apiError(
  error: string,
  code: string,
  status: number,
  extra?: Record<string, unknown>
): NextResponse {
  return NextResponse.json({ error, code, status, ...extra }, { status });
}

export const Errors = {
  unauthorized:   () => apiError("Unauthorized",               "UNAUTHORIZED",    401),
  forbidden:      () => apiError("Forbidden",                  "FORBIDDEN",       403),
  notFound:       () => apiError("Not found",                  "NOT_FOUND",       404),
  serverError:    (msg = "Internal server error") =>
                       apiError(msg,                           "SERVER_ERROR",    500),
  validation:     (err: ZodError) =>
                       apiError(err.errors[0]?.message ?? "Invalid input",
                                "VALIDATION_ERROR", 400,
                                { issues: err.flatten().fieldErrors }),
  rateLimit: (remaining: number, resetIn: number) =>
    apiError("Daily generation limit reached", "RATE_LIMIT", 429, {
      remaining,
      resetIn,
    }),
} as const;

// ─── SHA-256 input hash ───────────────────────────────────────────────────────

/** Produces a hex SHA-256 digest suitable for cache keys. */
export async function hashInput(text: string): Promise<string> {
  // Works in Edge Runtime and Node.js
  if (typeof crypto.subtle !== "undefined") {
    const buf = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(text)
    );
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  // Node.js fallback
  return crypto.createHash("sha256").update(text).digest("hex");
}

// ─── SSE helpers ─────────────────────────────────────────────────────────────

export const SSE_HEADERS = {
  "Content-Type":  "text/event-stream",
  "Cache-Control": "no-cache, no-transform",
  "X-Accel-Buffering": "no",
  Connection:      "keep-alive",
} as const;

export function sseEvent(data: unknown): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);
}

export const SSE_DONE = new TextEncoder().encode("data: [DONE]\n\n");
