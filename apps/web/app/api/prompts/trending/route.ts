import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const since = new Date();
  since.setDate(since.getDate() - 7); // last 7 days gives richer trending data

  const prompts = await prisma.prompt.findMany({
    where: {
      isPublic: true,
      createdAt: { gte: since },
    },
    orderBy: { copyCount: "desc" },
    take: 5,
    select: {
      id: true,
      generatedPrompt: true,
      copyCount: true,
      category: {
        select: { slug: true, name: true },
      },
    },
  });

  return NextResponse.json(prompts);
}
