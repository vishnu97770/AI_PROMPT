import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// ── GET /api/community ────────────────────────────────────────────────────────
// Public prompts feed.  Query params:
//   category  — category slug filter
//   sort      — "trending" (default) | "newest"
//   page      — 1-based, default 1
//   limit     — max 24, default 12

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") ?? "";
  const sort     = searchParams.get("sort")     ?? "trending";
  const page     = Math.max(1, Number(searchParams.get("page")  ?? 1));
  const limit    = Math.min(24, Math.max(1, Number(searchParams.get("limit") ?? 12)));
  const skip     = (page - 1) * limit;

  // Resolve category slug → id
  let categoryId: string | undefined;
  if (category) {
    const cat = await prisma.category.findUnique({
      where: { slug: category },
      select: { id: true },
    });
    if (!cat) return NextResponse.json({ data: [], total: 0, page, totalPages: 0, hasNextPage: false });
    categoryId = cat.id;
  }

  const where = {
    isPublic: true,
    ...(categoryId ? { categoryId } : {}),
  };

  const orderBy =
    sort === "newest"
      ? { createdAt: "desc" as const }
      : { trendingScore: "desc" as const };   // trending (default)

  const [prompts, total] = await Promise.all([
    prisma.prompt.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      select: {
        id:              true,
        generatedPrompt: true,
        copyCount:       true,
        qualityScore:    true,
        trendingScore:   true,
        createdAt:       true,
        category: { select: { slug: true, name: true, icon: true } },
      },
    }),
    prisma.prompt.count({ where }),
  ]);

  return NextResponse.json({
    data:        prompts,
    total,
    page,
    totalPages:  Math.ceil(total / limit),
    hasNextPage: skip + prompts.length < total,
  });
}
