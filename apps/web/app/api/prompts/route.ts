import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { prisma } from "@/lib/db";
import { Errors } from "@/lib/api-helpers";
import { promptListQuerySchema } from "@/lib/validations";
import { ZodError } from "zod";

export const dynamic = "force-dynamic";

// ── GET /api/prompts  ─────────────────────────────────────────────────────────
// Returns the authenticated user's prompts with pagination, filtering, sorting.

export async function GET(req: Request) {
  const supabase = await createServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return Errors.unauthorized();

  const { searchParams } = new URL(req.url);
  let query: ReturnType<typeof promptListQuerySchema.parse>;
  try {
    query = promptListQuerySchema.parse(Object.fromEntries(searchParams));
  } catch (err) {
    if (err instanceof ZodError) return Errors.validation(err);
    return Errors.serverError();
  }

  const { page, limit, category, search, sort } = query;
  const skip = (page - 1) * limit;

  // Build where clause dynamically
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = { userId: user.id };

  if (category) {
    const cat = await prisma.category.findUnique({
      where: { slug: category },
      select: { id: true },
    });
    if (cat) where.categoryId = cat.id;
  }

  if (search) {
    where.OR = [
      { userInput: { contains: search, mode: "insensitive" } },
      { generatedPrompt: { contains: search, mode: "insensitive" } },
    ];
  }

  // Build orderBy
  const orderBy =
    sort === "oldest"       ? { createdAt: "asc"  as const } :
    sort === "copyCount"    ? { copyCount:  "desc" as const } :
    sort === "qualityScore" ? { qualityScore: "desc" as const } :
                              { createdAt: "desc" as const }; // newest

  const [rows, total] = await Promise.all([
    prisma.prompt.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        category: { select: { id: true, slug: true, name: true, icon: true } },
      },
    }),
    prisma.prompt.count({ where }),
  ]);

  return NextResponse.json({
    prompts: rows,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    hasNextPage: skip + rows.length < total,
  });
}

// ── POST /api/prompts  ────────────────────────────────────────────────────────
// Manually save a prompt (used when the client already has the generated text).

export async function POST(req: Request) {
  const supabase = await createServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return Errors.unauthorized();

  let body: {
    categorySlug: string;
    userInput: string;
    generatedPrompt: string;
    negativePrompt?: string;
    toolVariants?: object;
    metadata?: object;
    qualityScore?: number;
    modelUsed?: string;
    isPublic?: boolean;
  };

  try {
    body = await req.json();
  } catch {
    return Errors.serverError("Invalid JSON body");
  }

  if (!body.categorySlug || !body.userInput || !body.generatedPrompt) {
    return Errors.serverError("categorySlug, userInput, and generatedPrompt are required");
  }

  const category = await prisma.category.findUnique({
    where: { slug: body.categorySlug },
    select: { id: true },
  });
  if (!category) return Errors.notFound();

  try {
    const prompt = await prisma.prompt.create({
      data: {
        userId: user.id,
        categoryId: category.id,
        userInput: body.userInput,
        generatedPrompt: body.generatedPrompt,
        negativePrompt: body.negativePrompt ?? null,
        toolVariants: body.toolVariants ?? undefined,
        metadata: body.metadata ?? undefined,
        qualityScore: body.qualityScore ?? null,
        modelUsed: body.modelUsed ?? null,
        isPublic: body.isPublic ?? false,
      },
      include: {
        category: { select: { id: true, slug: true, name: true, icon: true } },
      },
    });

    prisma.promptEvent
      .create({ data: { userId: user.id, promptId: prompt.id, eventType: "SAVE" } })
      .catch(() => {});

    return NextResponse.json(prompt, { status: 201 });
  } catch (err) {
    console.error("[prompts POST] DB error:", err);
    return Errors.serverError();
  }
}
