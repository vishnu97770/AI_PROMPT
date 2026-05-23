import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Globe, BookMarked } from "lucide-react";
import { prisma } from "@/lib/db";
import { CATEGORY_MAP } from "@/lib/constants";
import { formatRelativeDate } from "@/lib/utils";
import { PublicCopyButton } from "./PublicCopyButton";

type Props = { params: Promise<{ id: string }> };

// ── SEO metadata ──────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const col = await prisma.collection.findUnique({
    where: { id, isPublic: true },
    select: { name: true, description: true },
  });
  if (!col) return { title: "Collection Not Found" };
  return {
    title: `${col.name} — PromptCraft`,
    description: col.description ?? "A curated AI prompt collection on PromptCraft",
    openGraph: {
      title: col.name,
      description: col.description ?? "Browse and copy AI prompts",
      type: "website",
    },
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function PublicCollectionPage({ params }: Props) {
  const { id } = await params;

  const collection = await prisma.collection.findUnique({
    where: { id, isPublic: true },
    include: {
      user: { select: { username: true, displayName: true } },
      items: {
        orderBy: { addedAt: "desc" },
        take: 60,
        include: {
          prompt: {
            include: {
              category: { select: { id: true, slug: true, name: true, icon: true } },
            },
          },
        },
      },
    },
  });

  if (!collection) notFound();

  const ownerName =
    collection.user.displayName ??
    collection.user.username ??
    "Anonymous";

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="flex items-center gap-2 text-sm font-bold text-foreground">
            <span className="text-primary">✦</span> PromptCraft
          </Link>
          <Link
            href="/login"
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Sign up free
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 space-y-8">
        {/* Collection hero */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Globe className="h-3.5 w-3.5" />
            <span>Public collection by {ownerName}</span>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <BookMarked className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{collection.name}</h1>
              {collection.description && (
                <p className="mt-1 text-muted-foreground">{collection.description}</p>
              )}
              <p className="mt-1.5 text-xs text-muted-foreground">
                {collection.items.length} prompts · Updated{" "}
                {formatRelativeDate(String(collection.updatedAt))}
              </p>
            </div>
          </div>
        </div>

        {/* Prompts grid */}
        {collection.items.length === 0 ? (
          <p className="py-20 text-center text-sm text-muted-foreground">
            This collection is empty.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {collection.items.map(({ prompt }: { prompt: typeof collection.items[number]["prompt"] }) => {
              const cat = CATEGORY_MAP[prompt.category.slug];
              return (
                <div
                  key={prompt.id}
                  className="flex flex-col rounded-2xl border border-border bg-card p-4 gap-3 hover:border-border/80 hover:shadow-md transition-all duration-200"
                >
                  <span
                    className="inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                    style={{
                      backgroundColor: `${cat?.color ?? "#6366f1"}20`,
                      color: cat?.color ?? "#6366f1",
                    }}
                  >
                    {prompt.category.name}
                  </span>

                  <p className="flex-1 text-sm leading-relaxed text-foreground/80 line-clamp-4">
                    {prompt.generatedPrompt}
                  </p>

                  <div className="flex items-center justify-between border-t border-border/50 pt-2">
                    <span className="text-[11px] text-muted-foreground">
                      {formatRelativeDate(String(prompt.createdAt))}
                    </span>
                    <PublicCopyButton promptId={prompt.id} text={prompt.generatedPrompt} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CTA */}
        <div className="rounded-2xl border border-primary/25 bg-primary/5 px-6 py-8 text-center space-y-3">
          <p className="font-semibold">Create your own AI prompt collections</p>
          <p className="text-sm text-muted-foreground">
            PromptCraft generates optimised prompts for Midjourney, DALL·E, Stable Diffusion and more.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Get started free →
          </Link>
        </div>
      </main>
    </div>
  );
}
