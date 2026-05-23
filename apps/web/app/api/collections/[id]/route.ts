import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { prisma } from "@/lib/db";
import { Errors } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

// ── GET /api/collections/[id] ─────────────────────────────────────────────────

export async function GET(req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return Errors.unauthorized();

  const { searchParams } = new URL(req.url);
  const page  = Math.max(1, Number(searchParams.get("page")  ?? 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 12)));
  const skip  = (page - 1) * limit;

  const collection = await prisma.collection.findUnique({
    where: { id },
    include: { _count: { select: { items: true } } },
  });

  if (!collection || collection.userId !== user.id) return Errors.notFound();

  const [items, total] = await Promise.all([
    prisma.collectionItem.findMany({
      where: { collectionId: id },
      include: {
        prompt: {
          include: {
            category: { select: { id: true, slug: true, name: true, icon: true } },
          },
        },
      },
      orderBy: { addedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.collectionItem.count({ where: { collectionId: id } }),
  ]);

  return NextResponse.json({
    collection: {
      id:          collection.id,
      name:        collection.name,
      description: collection.description,
      isPublic:    collection.isPublic,
      itemCount:   collection._count.items,
      createdAt:   collection.createdAt,
      updatedAt:   collection.updatedAt,
    },
    prompts:    items.map((ci: typeof items[number]) => ci.prompt),
    total,
    page,
    totalPages: Math.ceil(total / limit),
    hasNextPage: skip + items.length < total,
  });
}

// ── PATCH /api/collections/[id] ───────────────────────────────────────────────

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return Errors.unauthorized();

  const col = await prisma.collection.findUnique({ where: { id }, select: { userId: true } });
  if (!col || col.userId !== user.id) return Errors.notFound();

  let body: { name?: string; description?: string; isPublic?: boolean };
  try { body = await req.json(); } catch { return Errors.serverError("Invalid JSON"); }

  const updated = await prisma.collection.update({
    where: { id },
    data: {
      ...(body.name        !== undefined && { name:        body.name.trim() }),
      ...(body.description !== undefined && { description: body.description?.trim() ?? null }),
      ...(body.isPublic    !== undefined && { isPublic:    body.isPublic }),
    },
    include: { _count: { select: { items: true } } },
  });

  return NextResponse.json({
    id:          updated.id,
    name:        updated.name,
    description: updated.description,
    isPublic:    updated.isPublic,
    itemCount:   updated._count.items,
    updatedAt:   updated.updatedAt,
  });
}

// ── DELETE /api/collections/[id] ──────────────────────────────────────────────

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return Errors.unauthorized();

  const col = await prisma.collection.findUnique({ where: { id }, select: { userId: true } });
  if (!col || col.userId !== user.id) return Errors.notFound();

  await prisma.collection.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
