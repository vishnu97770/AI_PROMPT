import type { RateLimitInfo } from "@promptcraft/types";

// ─── Upstash REST client (no extra package needed) ────────────────────────────

const REDIS_URL   = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

type RedisValue = string | number | null;

interface UpstashResponse<T = RedisValue> {
  result: T;
  error?: string;
}

/** Execute a single Redis command via Upstash REST API. */
async function redisCmd<T = RedisValue>(
  ...args: (string | number)[]
): Promise<T> {
  if (!REDIS_URL || !REDIS_TOKEN) {
    throw new Error(
      "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set"
    );
  }
  const path = args.map((a) => encodeURIComponent(String(a))).join("/");
  const res = await fetch(`${REDIS_URL}/${path}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    // Disable fetch cache so every call is fresh
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Redis HTTP ${res.status}: ${await res.text()}`);
  }
  const body = (await res.json()) as UpstashResponse<T>;
  if (body.error) throw new Error(`Redis error: ${body.error}`);
  return body.result;
}

/** Execute multiple commands atomically in a pipeline. */
async function redisPipeline(
  commands: (string | number)[][]
): Promise<RedisValue[]> {
  if (!REDIS_URL || !REDIS_TOKEN) {
    throw new Error(
      "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set"
    );
  }
  const res = await fetch(`${REDIS_URL}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Redis pipeline HTTP ${res.status}: ${await res.text()}`);
  }
  const results = (await res.json()) as UpstashResponse[];
  return results.map((r) => r.result);
}

// ─── Plan daily limits ────────────────────────────────────────────────────────

const DAILY_LIMITS: Record<string, number> = {
  FREE:       10,
  PRO:        200,
  CREATOR:    -1,   // unlimited
  ENTERPRISE: -1,
  // lowercase aliases
  free:       10,
  pro:        200,
  creator:    -1,
  enterprise: -1,
};

// ─── Rate limiting ────────────────────────────────────────────────────────────

/**
 * Increment the user's daily generation count and return limit status.
 * Key: `ratelimit:{userId}:{YYYY-MM-DD}` with a 25-hour TTL (cleans up automatically).
 */
export async function checkRateLimit(
  userId: string,
  plan: string
): Promise<RateLimitInfo> {
  const limit = DAILY_LIMITS[plan] ?? 10;

  // Unlimited plans — skip Redis entirely
  if (limit === -1) {
    return { allowed: true, remaining: 999_999, resetIn: 0 };
  }

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const key   = `ratelimit:${userId}:${today}`;

  // Atomic pipeline: INCR the counter, then refresh its TTL to 25 hours.
  // Using the date in the key means yesterday's key is already a different key,
  // so we just need the TTL for automatic cleanup.
  const [count] = await redisPipeline([
    ["INCR",   key],
    ["EXPIRE", key, 90_000], // 25 h — safe cleanup window
  ]);

  const current = Number(count);
  const allowed = current <= limit;
  const remaining = Math.max(0, limit - current);

  // Seconds until next midnight UTC
  const now = Date.now();
  const nextMidnight = new Date();
  nextMidnight.setUTCHours(24, 0, 0, 0);
  const resetIn = Math.floor((nextMidnight.getTime() - now) / 1000);

  return { allowed, remaining, resetIn };
}

// ─── Semantic prompt cache ────────────────────────────────────────────────────

/** Retrieve a cached prompt by its input hash. Returns null on miss. */
export async function getCachedPrompt(inputHash: string): Promise<string | null> {
  try {
    const result = await redisCmd<string | null>("GET", `cache:prompt:${inputHash}`);
    return result ?? null;
  } catch {
    return null; // cache misses should never break generation
  }
}

/**
 * Store a generated prompt result under its input hash.
 * TTL: 24 hours.
 */
export async function setCachedPrompt(
  inputHash: string,
  result: string
): Promise<void> {
  try {
    await redisCmd("SET", `cache:prompt:${inputHash}`, result, "EX", 86_400);
  } catch (err) {
    console.error("[redis] setCachedPrompt failed:", err);
  }
}

// ─── Copy count ───────────────────────────────────────────────────────────────

/**
 * Increment the Redis copy counter for a prompt.
 * The authoritative count lives in Postgres (Prompt.copyCount);
 * this is a fast counter for real-time dashboards.
 */
export async function incrementCopyCount(promptId: string): Promise<void> {
  try {
    await redisCmd("INCR", `copies:${promptId}`);
  } catch (err) {
    console.error("[redis] incrementCopyCount failed:", err);
  }
}
