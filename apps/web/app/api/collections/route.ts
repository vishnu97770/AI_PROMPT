import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { prisma } from "@/lib/db";
import { Errors } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

// ── GET /api/collections ──────────────────────────────────────────────────────
// Optional: ?promptId={id} adds `containsPrompt` flag to each collection.

export async function GET(req: Request) {
  const supabase = await createServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return Errors.unauthorized();

  const promptId = new URL(req.url).searchParams.get("promptId") ?? undefined;

  const [collections, containedIn] = await Promise.all([
    prisma.collection.findMany({
      where: { userId: user.id },
      include: { _count: { select: { items: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    promptId
      ? prisma.collectionItem.findMany({
          where: { collectionId: { in: [] }, promptId },
          select: { collectionId: true },
        }).then(() =>
          prisma.collectionItem.findMany({
            where: { promptId, collection: { userId: user.id } },
            select: { collectionId: true },
          })
        )
      : Promise.resolve([]),
  ]);

  const containedSet = new Set(containedIn.map((ci: { collectionId: string }) => ci.collectionId));

  return NextResponse.json(
    collections.map((c: typeof collections[number]) => ({
      id:           c.id,
      name:         c.name,
      description:  c.description,
      isPublic:     c.isPublic,
      itemCount:    c._count.items,
      createdAt:    c.createdAt,
      updatedAt:    c.updatedAt,
      containsPrompt: promptId ? containedSet.has(c.id) : undefined,
    }))
  );
}

// ── POST /api/collections ─────────────────────────────────────────────────────

export async function POST(req: Request) {
  const supabase = await createServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return Errors.unauthorized();

  let body: { name?: string; description?: string; isPublic?: boolean };
  try { body = await req.json(); } catch { return Errors.serverError("Invalid JSON"); }

  if (!body.name?.trim()) {
    return Errors.serverError("name is required");
  }

  const collection = await prisma.collection.create({
    data: {
      userId:      user.id,
      name:        body.name.trim(),
      description: body.description?.trim() ?? null,
      isPublic:    body.isPublic ?? false,
    },
    include: { _count: { select: { items: true } } },
  });

  return NextResponse.json(
    {
      id:          collection.id,
      name:        collection.name,
      description: collection.description,
      isPublic:    collection.isPublic,
      itemCount:   collection._count.items,
      createdAt:   collection.createdAt,
      updatedAt:   collection.updatedAt,
    },
    { status: 201 }
  );
}
