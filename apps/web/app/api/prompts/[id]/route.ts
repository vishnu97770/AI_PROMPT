import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { prisma } from "@/lib/db";
import { Errors } from "@/lib/api-helpers";
import { promptUpdateSchema } from "@/lib/validations";
import { ZodError } from "zod";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

// ── GET /api/prompts/[id]  ────────────────────────────────────────────────────

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;

  const supabase = await createServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return Errors.unauthorized();

  const prompt = await prisma.prompt.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, slug: true, name: true, icon: true } },
    },
  });

  if (!prompt) return Errors.notFound();

  // Allow owners to see their own private prompts; public prompts are readable by anyone
  if (!prompt.isPublic && prompt.userId !== user.id) return Errors.forbidden();

  return NextResponse.json(prompt);
}

// ── PATCH /api/prompts/[id]  ──────────────────────────────────────────────────

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;

  const supabase = await createServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return Errors.unauthorized();

  const prompt = await prisma.prompt.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!prompt) return Errors.notFound();
  if (prompt.userId !== user.id) return Errors.forbidden();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Errors.serverError("Invalid JSON body");
  }

  let updates: ReturnType<typeof promptUpdateSchema.parse>;
  try {
    updates = promptUpdateSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) return Errors.validation(err);
    return Errors.serverError();
  }

  const updated = await prisma.prompt.update({
    where: { id },
    data: updates,
    include: {
      category: { select: { id: true, slug: true, name: true, icon: true } },
    },
  });

  return NextResponse.json(updated);
}

// ── DELETE /api/prompts/[id]  ─────────────────────────────────────────────────

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;

  const supabase = await createServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return Errors.unauthorized();

  const prompt = await prisma.prompt.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!prompt) return Errors.notFound();
  if (prompt.userId !== user.id) return Errors.forbidden();

  await prisma.prompt.delete({ where: { id } });

  return new NextResponse(null, { status: 204 });
}
