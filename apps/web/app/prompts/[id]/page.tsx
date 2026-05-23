import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Copy, Star, Wand2 } from "lucide-react";
import { prisma } from "@/lib/db";
import { createServerClient } from "@/lib/supabase";
import { CATEGORY_MAP } from "@/lib/constants";
import { formatRelativeDate } from "@/lib/utils";
import { PromptDetailActions } from "./PromptDetailActions";
import type { ToolVariants } from "@promptcraft/types";

type Props = { params: Promise<{ id: string }> };

// ── SEO ───────────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const prompt = await prisma.prompt.findUnique({
    where: { id, isPublic: true },
    select: { generatedPrompt: true, category: { select: { name: true } } },
  });
  if (!prompt) return { title: "Prompt Not Found" };

  const title = prompt.generatedPrompt.slice(0, 60).trimEnd() +
    (prompt.generatedPrompt.length > 60 ? "…" : "");

  return {
    title: `${title} — PromptCraft`,
    description: `${prompt.category.name} prompt: ${prompt.generatedPrompt.slice(0, 140)}`,
    openGraph: {
      title,
      description: prompt.generatedPrompt.slice(0, 200),
      type: "article",
    },
    twitter: {
      card: "summary",
      title,
      description: prompt.generatedPrompt.slice(0, 140),
    },
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function PromptDetailPage({ params }: Props) {
  const { id } = await params;

  // Optional auth — if the user owns the prompt they can view even if private
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const prompt = await prisma.prompt.findUnique({
    where: { id },
    include: { category: { select: { id: true, slug: true, name: true, icon: true } } },
  });

  if (!prompt) notFound();
  if (!prompt.isPublic && prompt.userId !== user?.id) notFound();

  const cat = CATEGORY_MAP[prompt.category.slug];
  const variants = prompt.toolVariants as ToolVariants | null;

  // Build variants map for the client component
  const variantMap: Record<string, string> = {
    main:             prompt.generatedPrompt,
    midjourney:       variants?.midjourney       ?? prompt.generatedPrompt,
    dalle:            variants?.dalle             ?? prompt.generatedPrompt,
    stable_diffusion: variants?.stable_diffusion  ?? prompt.generatedPrompt,
    chatgpt:          `Please use the following as your complete creative brief:\n\n${prompt.generatedPrompt}`,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal top bar */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/community" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            Community
          </Link>
          <Link href="/" className="text-sm font-bold text-foreground">
            <span className="text-primary">✦</span> PromptCraft
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 space-y-8">
        {/* Header */}
        <div className="space-y-3">
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
            style={{
              backgroundColor: `${cat?.color ?? "#6366f1"}20`,
              color: cat?.color ?? "#6366f1",
            }}
          >
            {prompt.category.name}
          </span>

          <h1 className="text-2xl font-bold leading-snug tracking-tight">
            {prompt.generatedPrompt.slice(0, 80)}
            {prompt.generatedPrompt.length > 80 && "…"}
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Copy className="h-3.5 w-3.5" />
              {prompt.copyCount.toLocaleString()} copies
            </span>
            {prompt.qualityScore != null && (
              <span className="flex items-center gap-1 text-yellow-500 font-medium">
                <Star className="h-3.5 w-3.5 fill-current" />
                {prompt.qualityScore.toFixed(1)} / 10
              </span>
            )}
            {prompt.modelUsed && (
              <span className="font-mono bg-muted rounded px-1.5 py-0.5">
                {prompt.modelUsed.split("/").pop()}
              </span>
            )}
            <span>Created {formatRelativeDate(String(prompt.createdAt))}</span>
          </div>
        </div>

        {/* Interactive tabs + copy — client island */}
        <PromptDetailActions
          promptId={prompt.id}
          promptText={prompt.generatedPrompt}
          variants={variantMap}
        />

        {/* Negative prompt */}
        {prompt.negativePrompt && (
          <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Negative Prompt
            </p>
            <p className="text-sm text-muted-foreground font-mono leading-relaxed whitespace-pre-wrap">
              {prompt.negativePrompt}
            </p>
          </div>
        )}

        {/* Generate similar CTA */}
        <div className="rounded-2xl border border-primary/25 bg-primary/5 px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-semibold">Generate a similar prompt</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Customise this idea with your own details
            </p>
          </div>
          <Link
            href={`/generate?category=${prompt.category.slug}&ref=${prompt.id}`}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Wand2 className="h-4 w-4" />
            Generate Similar
          </Link>
        </div>
      </main>
    </div>
  );
}
