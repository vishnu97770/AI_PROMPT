import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const categorySlug = searchParams.get("category");
  const limit = Math.min(Number(searchParams.get("limit") ?? "5"), 20);

  const since = new Date();
  since.setDate(since.getDate() - 7);

  // Resolve category ID if slug was provided
  let categoryId: string | undefined;
  if (categorySlug) {
    const cat = await prisma.category.findUnique({
      where: { slug: categorySlug },
      select: { id: true },
    });
    categoryId = cat?.id;
    // Unknown slug → return empty rather than all-category results
    if (!cat) return NextResponse.json([]);
  }

  const prompts = await prisma.prompt.findMany({
    where: {
      isPublic: true,
      createdAt: { gte: since },
      ...(categoryId ? { categoryId } : {}),
    },
    orderBy: { copyCount: "desc" },
    take: limit,
    select: {
      id: true,
      generatedPrompt: true,
      copyCount: true,
      createdAt: true,
      category: { select: { slug: true, name: true } },
    },
  });

  return NextResponse.json(prompts);
}
