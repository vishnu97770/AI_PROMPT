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

              // After forwarding done event, persist to DB while stream is still open
              if ("done" in event && event.done) {
                const finalResult = event.result;
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

                  // Emit saved event so client gets the DB-assigned promptId
                  controller.enqueue(sseEvent({ saved: true, promptId: saved.id }));

                  prisma.promptEvent
                    .create({ data: { userId: user.id, promptId: saved.id, eventType: "GENERATE" } })
                    .catch(() => {});

                  setCachedPrompt(
                    inputHash,
                    JSON.stringify({ ...finalResult, promptId: saved.id, cached: false })
                  ).catch(() => {});
                } catch (err) {
                  console.error("[generate/stream] DB persist failed:", err);
                  controller.enqueue(sseEvent({ saved: false, promptId: null }));
                }
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
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}
