import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { prisma } from "@/lib/db";

export async function GET() {
  const supabase = await createServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prompts = await prisma.prompt.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 6,
    select: {
      id: true,
      userInput: true,
      generatedPrompt: true,
      createdAt: true,
      copyCount: true,
      category: {
        select: { slug: true, name: true },
      },
    },
  });

  return NextResponse.json(prompts);
}
