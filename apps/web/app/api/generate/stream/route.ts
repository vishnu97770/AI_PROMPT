import { createServerClient } from "@/lib/supabase";
import { prisma } from "@/lib/db";
import { checkRateLimit, getCachedPrompt, setCachedPrompt } from "@/lib/redis";
import { hashInput, Errors, SSE_HEADERS, sseEvent, SSE_DONE } from "@/lib/api-helpers";
import { generateQuerySchema } from "@/lib/validations";
import { ZodError } from "zod";
import type { GenerateResponse, StreamEvent } from "@promptcraft/types";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? "http://localhost:8000";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const supabase = await createServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return Errors.unauthorized();

  // ── Query params ────────────────────────────────────────────────────────────
  const { searchParams } = new URL(req.url);
  let query: ReturnType<typeof generateQuerySchema.parse>;
  try {
    query = generateQuerySchema.parse(Object.fromEntries(searchParams));
  } catch (err) {
    if (err instanceof ZodError) return Errors.validation(err);
    return Errors.serverError();
  }
  const { userInput, categorySlug, fresh } = query;

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

  const encoder = new TextEncoder();

  if (cached) {
    // Stream cached result immediately as a done event
    const stream = new ReadableStream({
      start(controller) {
        const result = JSON.parse(cached) as GenerateResponse;
        const startEvent: StreamEvent = { event: "start", model: result.modelUsed };
        controller.enqueue(sseEvent(startEvent));
        const doneEvent: StreamEvent = { done: true, result: { ...result, cached: true } };
        controller.enqueue(sseEvent(doneEvent));
        controller.enqueue(SSE_DONE);
        controller.close();
      },
    });
    return new Response(stream, { headers: SSE_HEADERS });
  }

  // ── Resolve category ────────────────────────────────────────────────────────
  const category = await prisma.category.findUnique({
    where: { slug: categorySlug },
    select: { id: true },
  });
  if (!category) return Errors.notFound();

  // ── Proxy Python SSE stream ─────────────────────────────────────────────────
  let aiRes: Response;
  try {
    aiRes = await fetch(
      `${AI_SERVICE_URL}/generate/stream?` +
        new URLSearchParams({
          user_input: userInput,
          category_slug: categorySlug,
          user_plan: plan,
        }),
      { headers: { "x-user-id": user.id } }
    );
  } catch {
    return Errors.serverError("AI service unavailable");
  }

  if (!aiRes.ok || !aiRes.body) {
    return Errors.serverError("AI service returned an error");
  }

  let savedPromptId: string | null = null;
  let finalResult: GenerateResponse | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      const reader = aiRes.body!.getReader();
      const dec = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += dec.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim();
            if (raw === "[DONE]") {
              controller.enqueue(SSE_DONE);
              continue;
            }
            try {
              const event = JSON.parse(raw) as StreamEvent;
              controller.enqueue(sseEvent(event));

              // Capture the final result payload
              if ("done" in event && event.done) {
                finalResult = event.result;
              }
            } catch {
              // malformed event — skip
            }
          }
        }
      } finally {
        reader.releaseLock();
        controller.close();
      }

      // ── Persist to DB + cache after stream ends ─────────────────────────────
      if (finalResult) {
        try {
          const saved = await prisma.prompt.create({
            data: {
              userId: user.id,
              categoryId: category.id,
              userInput,
              generatedPrompt: finalResult.generatedPrompt,
              negativePrompt: finalResult.negativePrompt ?? null,
              toolVariants: finalResult.toolVariants as object,
              metadata: finalResult.metadata as object,
              qualityScore: finalResult.qualityScore ?? null,
              modelUsed: finalResult.modelUsed,
            },
            select: { id: true },
          });
          savedPromptId = saved.id;

          // Fire-and-forget: create GENERATE event
          prisma.promptEvent
            .create({
              data: {
                userId: user.id,
                promptId: savedPromptId,
                eventType: "GENERATE",
              },
            })
            .catch(() => {});

          // Cache the result keyed by input hash
          await setCachedPrompt(
            inputHash,
            JSON.stringify({ ...finalResult, promptId: savedPromptId, cached: false })
          );
        } catch (err) {
          console.error("[generate/stream] DB persist failed:", err);
        }
      }
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}
