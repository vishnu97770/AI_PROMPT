import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getManyTrendingCounts } from "@/lib/redis";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // seconds — required for Vercel Pro / longer cron jobs

const CRON_SECRET = process.env.CRON_SECRET;
const BATCH_SIZE  = 50;

// ── POST /api/cron/trending ───────────────────────────────────────────────────
// Called on a schedule (e.g. every hour via Vercel Cron or external scheduler).
// Authorization: Bearer {CRON_SECRET}
//
// Algorithm per prompt:
//   trendingScore = (copies_24h × 0.6) + (copies_7d × 0.3)
//
// Prompts whose Redis keys have expired (no recent copies) naturally score 0.

export async function POST(req: Request) {
  // Auth check
  const auth = req.headers.get("authorization") ?? "";
  if (!CRON_SECRET || auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let cursor = 0;
  let updated = 0;
  let processed = 0;

  // Stream through all public prompt IDs in batches to avoid memory pressure
  while (true) {
    const batch = await prisma.prompt.findMany({
      where: { isPublic: true },
      select: { id: true, trendingScore: true },
      orderBy: { id: "asc" },
      skip: cursor,
      take: BATCH_SIZE,
    });

    if (!batch.length) break;
    processed += batch.length;

    const ids = batch.map((p: { id: string; trendingScore: number }) => p.id);
    const counts = await getManyTrendingCounts(ids);

    // Build update list — only touch rows whose score actually changes
    const updates: Array<{ id: string; score: number }> = [];
    for (const p of batch as Array<{ id: string; trendingScore: number }>) {
      const c = counts.get(p.id) ?? { h24: 0, d7: 0 };
      const score = c.h24 * 0.6 + c.d7 * 0.3;
      const rounded = Math.round(score * 100) / 100; // 2 dp precision
      if (rounded !== p.trendingScore) {
        updates.push({ id: p.id, score: rounded });
      }
    }

    if (updates.length) {
      // Prisma doesn't support bulk update with different values per row in one query,
      // so we use a transaction of individual updates.
      await prisma.$transaction(
        updates.map(({ id, score }) =>
          prisma.prompt.update({
            where: { id },
            data: { trendingScore: score },
          })
        )
      );
      updated += updates.length;
    }

    if (batch.length < BATCH_SIZE) break; // last page
    cursor += BATCH_SIZE;
  }

  return NextResponse.json({ ok: true, processed, updated });
}
