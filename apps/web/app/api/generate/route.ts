import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { prisma } from "@/lib/db";
import { checkRateLimit, getCachedPrompt, setCachedPrompt } from "@/lib/redis";
import { hashInput, Errors } from "@/lib/api-helpers";
import { generateBodySchema } from "@/lib/validations";
import { ZodError } from "zod";
import type { GenerateResponse } from "@promptcraft/types";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? "http://localhost:8000";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const supabase = await createServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return Errors.unauthorized();

  // ── Body ────────────────────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Errors.serverError("Invalid JSON body");
  }

  let parsed: ReturnType<typeof generateBodySchema.parse>;
  try {
    parsed = generateBodySchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) return Errors.validation(err);
    return Errors.serverError();
  }
  const { userInput, categorySlug, hasImage, fresh } = parsed;

  // ── Plan / rate limit ───────────────────────────────────────────────────────
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { plan: true },
  });
  const plan = dbUser?.plan ?? "FREE";

  const rateInfo = await checkRateLimit(user.id, plan);
  if (!rateInfo.allowed) {
    return Errors.rateLimit(rateInfo.remaining, rateInfo.resetIn);
  }

  // ── Cache lookup ────────────────────────────────────────────────────────────
  const inputHash = await hashInput(`${userInput}::${categorySlug}`);
  const cached = fresh ? null : await getCachedPrompt(inputHash);

  if (cached) {
    const result = JSON.parse(cached) as GenerateResponse;
    return NextResponse.json({ ...result, cached: true });
  }

  // ── Resolve category ────────────────────────────────────────────────────────
  const category = await prisma.category.findUnique({
    where: { slug: categorySlug },
    select: { id: true },
  });
  if (!category) return Errors.notFound();

  // ── Call Python service ─────────────────────────────────────────────────────
  let aiRes: Response;
  try {
    aiRes = await fetch(`${AI_SERVICE_URL}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": user.id,
      },
      body: JSON.stringify({
        user_input: userInput,
        category_slug: categorySlug,
        user_plan: plan,
        has_image: hasImage,
      }),
    });
  } catch {
    return Errors.serverError("AI service unavailable");
  }

  if (!aiRes.ok) {
    const text = await aiRes.text().catch(() => "");
    console.error("[generate] AI service error:", aiRes.status, text);
    return Errors.serverError("AI service returned an error");
  }

  let result: GenerateResponse;
  try {
    result = (await aiRes.json()) as GenerateResponse;
  } catch {
    return Errors.serverError("Invalid response from AI service");
  }

  // ── Persist to DB ───────────────────────────────────────────────────────────
  let promptId: string;
  try {
    const saved = await prisma.prompt.create({
      data: {
        userId: user.id,
        categoryId: category.id,
        userInput,
        generatedPrompt: result.generatedPrompt,
        negativePrompt: result.negativePrompt ?? null,
        toolVariants: result.toolVariants as object,
        metadata: result.metadata as object,
        qualityScore: result.qualityScore ?? null,
        modelUsed: result.modelUsed,
      },
      select: { id: true },
    });
    promptId = saved.id;
  } catch (err) {
    console.error("[generate] DB persist failed:", err);
    // Still return the result even if DB write fails
    return NextResponse.json({ ...result, cached: false });
  }

  // Fire-and-forget: create GENERATE event
  prisma.promptEvent
    .create({
      data: { userId: user.id, promptId, eventType: "GENERATE" },
    })
    .catch(() => {});

  // Cache for future requests
  await setCachedPrompt(
    inputHash,
    JSON.stringify({ ...result, promptId, cached: false })
  );

  return NextResponse.json({ ...result, promptId, cached: false });
}
