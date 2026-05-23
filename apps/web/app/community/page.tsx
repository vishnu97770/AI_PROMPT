"use client";

import { useCallback, useRef, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Flame, Sparkles, TrendingUp, Star } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CATEGORY_CONFIG, CATEGORY_MAP } from "@/lib/constants";
import { truncate, formatRelativeDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────

interface CommunityPrompt {
  id:              string;
  generatedPrompt: string;
  copyCount:       number;
  qualityScore:    number | null;
  trendingScore:   number;
  createdAt:       string;
  category: { slug: string; name: string; icon: string | null };
}

interface CommunityPage {
  data:        CommunityPrompt[];
  total:       number;
  page:        number;
  totalPages:  number;
  hasNextPage: boolean;
}

type TrendingPrompt = {
  id: string;
  generatedPrompt: string;
  copyCount: number;
  category: { slug: string; name: string };
};

// ── Mini copy button used on every card ───────────────────────────────────────

function CopyButton({ promptId, text }: { promptId: string; text: string }) {
  const [done, setDone] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
      fetch(`/api/prompts/${promptId}/copy`, { method: "POST" }).catch(() => {});
    } catch {
      // clipboard unavailable
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
        done
          ? "text-green-500"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
      )}
    >
      {done ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {done ? "Copied" : "Copy"}
    </button>
  );
}

// ── Trending hero card ────────────────────────────────────────────────────────

function TrendingCard({ prompt, rank }: { prompt: TrendingPrompt; rank: number }) {
  const cat = CATEGORY_MAP[prompt.category.slug];
  return (
    <Link href={`/prompts/${prompt.id}`}>
      <motion.div
        whileHover={{ y: -3 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        className="relative flex w-64 shrink-0 flex-col gap-3 rounded-2xl border border-border bg-card p-4 hover:border-border/80 hover:shadow-md transition-shadow cursor-pointer"
      >
        {/* Rank badge */}
        <span className="absolute -top-2 -left-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow">
          #{rank}
        </span>

        <span
          className="inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
          style={{
            backgroundColor: `${cat?.color ?? "#6366f1"}20`,
            color: cat?.color ?? "#6366f1",
          }}
        >
          {prompt.category.name}
        </span>

        <p className="text-xs leading-relaxed text-foreground/80 line-clamp-3 flex-1">
          {prompt.generatedPrompt}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
            <Copy className="h-2.5 w-2.5" /> {prompt.copyCount}
          </span>
          <CopyButton promptId={prompt.id} text={prompt.generatedPrompt} />
        </div>
      </motion.div>
    </Link>
  );
}

// ── Community grid card ────────────────────────────────────────────────────────

function CommunityCard({ prompt, index }: { prompt: CommunityPrompt; index: number }) {
  const cat = CATEGORY_MAP[prompt.category.slug];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index % 12, 11) * 0.04, duration: 0.22 }}
    >
      <Link href={`/prompts/${prompt.id}`} className="block group">
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 hover:border-border/80 hover:shadow-md transition-all duration-200 h-full cursor-pointer">
          {/* Category badge */}
          <span
            className="inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
            style={{
              backgroundColor: `${cat?.color ?? "#6366f1"}20`,
              color: cat?.color ?? "#6366f1",
            }}
          >
            {prompt.category.name}
          </span>

          {/* Prompt text */}
          <p className="flex-1 text-sm leading-relaxed text-foreground/80 line-clamp-3">
            {prompt.generatedPrompt}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-border/50 pt-2">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              {prompt.qualityScore != null && (
                <span className="flex items-center gap-0.5 text-yellow-500 font-medium">
                  <Star className="h-3 w-3 fill-current" />
                  {prompt.qualityScore.toFixed(1)}
                </span>
              )}
              <span className="flex items-center gap-0.5">
                <Copy className="h-3 w-3" /> {prompt.copyCount}
              </span>
            </div>
            <CopyButton promptId={prompt.id} text={prompt.generatedPrompt} />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ── Skeletons ─────────────────────────────────────────────────────────────────

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <Skeleton className="h-4 w-20 rounded-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
          <div className="flex justify-between pt-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CommunityPage() {
  const [activeCategory, setActiveCategory] = useState("");
  const [sort, setSort] = useState<"trending" | "newest">("trending");
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Trending today row
  const { data: trendingToday = [] } = useQuery<TrendingPrompt[]>({
    queryKey: ["trending-today"],
    queryFn: async () => {
      const res = await fetch("/api/prompts/trending?limit=5");
      if (!res.ok) throw new Error();
      return res.json();
    },
    staleTime: 5 * 60_000,
  });

  // Main infinite grid
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["community", activeCategory, sort],
    queryFn: ({ pageParam }: { pageParam: number }) => {
      const params = new URLSearchParams({
        page:  String(pageParam),
        limit: "12",
        sort,
        ...(activeCategory ? { category: activeCategory } : {}),
      });
      return fetch(`/api/community?${params}`).then((r) => {
        if (!r.ok) throw new Error("Failed to fetch");
        return r.json() as Promise<CommunityPage>;
      });
    },
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasNextPage ? last.page + 1 : undefined),
  });

  const allPrompts = data?.pages.flatMap((p) => p.data) ?? [];
  const total      = data?.pages[0]?.total ?? 0;

  return (
    <div className="space-y-10">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="py-8 text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="h-3 w-3" />
          Community Prompts
        </div>
        <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
          Explore AI Prompts
        </h1>
        <p className="mx-auto max-w-xl text-muted-foreground">
          Discover and copy prompts crafted by the PromptCraft community.
          From cinematic reels to code — find the perfect starting point.
        </p>
      </section>

      {/* ── Trending Today row ───────────────────────────────────────────── */}
      {trendingToday.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500" />
            <h2 className="font-semibold text-sm">Trending Today</h2>
          </div>
          <div className="relative">
            <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-border">
              {trendingToday.map((prompt, i) => (
                <TrendingCard key={prompt.id} prompt={prompt} rank={i + 1} />
              ))}
            </div>
            {/* Fade hint */}
            <div className="pointer-events-none absolute right-0 top-0 h-full w-16 bg-gradient-to-l from-background to-transparent" />
          </div>
        </section>
      )}

      {/* ── Category tabs + sort ─────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          {/* Category tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 flex-1 min-w-0">
            <button
              onClick={() => setActiveCategory("")}
              className={cn(
                "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                !activeCategory
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              All
            </button>
            {CATEGORY_CONFIG.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => setActiveCategory(cat.slug === activeCategory ? "" : cat.slug)}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap",
                  activeCategory === cat.slug
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {cat.shortName}
              </button>
            ))}
          </div>

          {/* Sort toggle */}
          <div className="flex items-center rounded-lg border border-border bg-card p-0.5 gap-0.5 shrink-0">
            <button
              onClick={() => setSort("trending")}
              className={cn(
                "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                sort === "trending"
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              Trending
            </button>
            <button
              onClick={() => setSort("newest")}
              className={cn(
                "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                sort === "newest"
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Newest
            </button>
          </div>
        </div>

        {/* Total count */}
        {total > 0 && !isLoading && (
          <p className="text-xs text-muted-foreground">
            {total.toLocaleString()} public prompts
            {activeCategory ? ` in ${CATEGORY_MAP[activeCategory]?.name ?? activeCategory}` : ""}
          </p>
        )}

        {/* ── Grid ───────────────────────────────────────────────────────── */}
        {isLoading ? (
          <GridSkeleton />
        ) : allPrompts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <p className="text-sm text-muted-foreground">No public prompts yet.</p>
            <Button asChild variant="outline">
              <Link href="/generate">Generate the first one</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence initial={false} mode="popLayout">
                {allPrompts.map((prompt, i) => (
                  <CommunityCard key={prompt.id} prompt={prompt} index={i} />
                ))}
              </AnimatePresence>
            </div>

            {hasNextPage && (
              <div ref={loadMoreRef} className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="min-w-[140px]"
                >
                  {isFetchingNextPage ? "Loading…" : "Load More"}
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
