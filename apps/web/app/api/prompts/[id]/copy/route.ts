import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { prisma } from "@/lib/db";
import { incrementCopyCount, incrementTrendingCounters } from "@/lib/redis";
import { Errors } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

// ── POST /api/prompts/[id]/copy  ──────────────────────────────────────────────
// Increments copyCount in Postgres and Redis, records a COPY event.

export async function POST(_req: Request, { params }: Params) {
  const { id } = await params;

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Unauthenticated users can copy public prompts — we just skip the event row
  const prompt = await prisma.prompt.findUnique({
    where: { id },
    select: { userId: true, isPublic: true, copyCount: true },
  });

  if (!prompt) return Errors.notFound();

  // Private prompts can only be copied by their owner
  if (!prompt.isPublic && prompt.userId !== user?.id) return Errors.forbidden();

  // Increment in Postgres and Redis in parallel
  const [updated] = await Promise.all([
    prisma.prompt.update({
      where: { id },
      data: { copyCount: { increment: 1 } },
      select: { copyCount: true },
    }),
    incrementCopyCount(id),
    incrementTrendingCounters(id),
  ]);

  // Fire-and-forget: create COPY event (only when user is authenticated)
  if (user) {
    prisma.promptEvent
      .create({
        data: {
          userId: user.id,
          promptId: id,
          eventType: "COPY",
        },
      })
      .catch(() => {});
  }

  return NextResponse.json({ copyCount: updated.copyCount });
}
