import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { prisma } from "@/lib/db";
import { PLANS } from "@/lib/constants";

export async function GET() {
  const supabase = await createServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Upsert user — handles first-login case where Prisma row doesn't exist yet
  const [dbUser, totalPrompts, promptsToday, collectionsCount] = await Promise.all([
    prisma.user.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        email: user.email!,
        username: (user.user_metadata?.username as string | undefined) ?? undefined,
        displayName: (user.user_metadata?.display_name as string | undefined) ?? undefined,
      },
      update: {},
      select: {
        plan: true,
        creditsRemaining: true,
        username: true,
        displayName: true,
      },
    }),
    prisma.prompt.count({ where: { userId: user.id } }),
    prisma.prompt.count({ where: { userId: user.id, createdAt: { gte: today } } }),
    prisma.collection.count({ where: { userId: user.id } }),
  ]);

  const plan = dbUser.plan as keyof typeof PLANS;
  const dailyLimit = PLANS[plan]?.dailyLimit ?? 10;

  return NextResponse.json({
    username:
      dbUser.displayName ??
      dbUser.username ??
      user.email?.split("@")[0] ??
      "there",
    plan,
    totalPrompts,
    promptsToday,
    dailyLimit: dailyLimit === Infinity ? null : dailyLimit,
    creditsRemaining: dbUser.creditsRemaining,
    collectionsCount,
  });
}
