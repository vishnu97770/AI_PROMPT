import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { prisma } from "@/lib/db";
import { Errors } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

// ── POST /api/collections/[id]/prompts  (add prompt) ─────────────────────────

export async function POST(req: Request, { params }: Params) {
  const { id: collectionId } = await params;
  const supabase = await createServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return Errors.unauthorized();

  const col = await prisma.collection.findUnique({
    where: { id: collectionId },
    select: { userId: true },
  });
  if (!col || col.userId !== user.id) return Errors.notFound();

  let body: { promptId?: string };
  try { body = await req.json(); } catch { return Errors.serverError("Invalid JSON"); }
  if (!body.promptId) return Errors.serverError("promptId is required");

  // Verify the prompt belongs to this user
  const prompt = await prisma.prompt.findUnique({
    where: { id: body.promptId },
    select: { userId: true },
  });
  if (!prompt || prompt.userId !== user.id) return Errors.forbidden();

  try {
    await prisma.$transaction([
      prisma.collectionItem.create({
        data: { collectionId, promptId: body.promptId },
      }),
      prisma.collection.update({
        where: { id: collectionId },
        data: { itemCount: { increment: 1 } },
      }),
    ]);
  } catch (e: unknown) {
    // P2002 = unique constraint violation (already in collection)
    if ((e as { code?: string }).code === "P2002") {
      return NextResponse.json({ message: "Already in collection" });
    }
    throw e;
  }

  return NextResponse.json({ message: "Added" }, { status: 201 });
}

// ── DELETE /api/collections/[id]/prompts  (remove prompt) ────────────────────

export async function DELETE(req: Request, { params }: Params) {
  const { id: collectionId } = await params;
  const supabase = await createServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return Errors.unauthorized();

  const col = await prisma.collection.findUnique({
    where: { id: collectionId },
    select: { userId: true },
  });
  if (!col || col.userId !== user.id) return Errors.notFound();

  let body: { promptId?: string };
  try { body = await req.json(); } catch { return Errors.serverError("Invalid JSON"); }
  if (!body.promptId) return Errors.serverError("promptId is required");

  const deleted = await prisma.collectionItem.deleteMany({
    where: { collectionId, promptId: body.promptId },
  });

  if (deleted.count > 0) {
    await prisma.collection.update({
      where: { id: collectionId },
      data: { itemCount: { decrement: 1 } },
    });
  }

  return new NextResponse(null, { status: 204 });
}
