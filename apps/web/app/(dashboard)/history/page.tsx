"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Search, LayoutGrid, List, SlidersHorizontal, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PromptCard } from "@/components/prompts/PromptCard";
import { PromptListItem } from "@/components/prompts/PromptListItem";
import { CATEGORY_CONFIG } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { PromptWithCategory } from "@promptcraft/types";

const PAGE_SIZE = 12;

interface PromptsPage {
  prompts: PromptWithCategory[];
  total: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
}

async function fetchPromptsPage({
  search,
  category,
  sort,
  page,
}: {
  search: string;
  category: string;
  sort: string;
  page: number;
}): Promise<PromptsPage> {
  const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE), sort });
  if (search)   params.set("search",   search);
  if (category) params.set("category", category);

  const res = await fetch(`/api/prompts?${params}`);
  if (!res.ok) throw new Error("Failed to fetch prompts");
  return res.json();
}

// ─── Skeletons ─────────────────────────────────────────────────────────────────

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <Skeleton className="h-4 w-24 rounded-full" />
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

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card px-4 py-3 flex items-center gap-3">
          <Skeleton className="h-5 w-20 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-3 w-16 hidden sm:block" />
        </div>
      ))}
    </div>
  );
}

// ─── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <BookOpen className="h-8 w-8 text-muted-foreground/50" />
      </div>
      <div>
        <p className="font-semibold text-foreground/80">
          {hasFilters ? "No prompts match your filters" : "No prompts yet"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {hasFilters
            ? "Try a different search or clear your filters"
            : "Generate your first prompt to see it here"}
        </p>
      </div>
      {!hasFilters && (
        <Button asChild>
          <a href="/generate">Generate a Prompt</a>
        </Button>
      )}
    </div>
  );
}

// ─── Main content (needs Suspense wrapper for useSearchParams) ─────────────────

function HistoryContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const pathname     = usePathname();
  const queryClient  = useQueryClient();

  // Read filter state from URL
  const urlSearch   = searchParams.get("q")        ?? "";
  const urlCategory = searchParams.get("category") ?? "";
  const urlSort     = searchParams.get("sort")     ?? "newest";
  const urlView     = searchParams.get("view")     ?? "grid";

  // Local search input (debounced → URL)
  const [searchInput, setSearchInput] = useState(urlSearch);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (v) params.set(k, v);
        else params.delete(k);
      });
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateParams({ q: value });
    }, 300);
  };

  // Keep local input in sync when URL changes externally
  useEffect(() => {
    setSearchInput(urlSearch);
  }, [urlSearch]);

  // Infinite query — resets when filter keys change
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ["prompts", urlSearch, urlCategory, urlSort],
    queryFn: ({ pageParam }: { pageParam: number }) =>
      fetchPromptsPage({ search: urlSearch, category: urlCategory, sort: urlSort, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasNextPage ? last.page + 1 : undefined),
  });

  const allPrompts = data?.pages.flatMap((p) => p.prompts) ?? [];
  const total      = data?.pages[0]?.total ?? 0;
  const hasFilters = !!(urlSearch || urlCategory);

  // ── Cache mutations ──────────────────────────────────────────────────────────

  const handleDeleted = (id: string) => {
    queryClient.setQueryData(
      ["prompts", urlSearch, urlCategory, urlSort],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((p: PromptsPage) => ({
            ...p,
            prompts: p.prompts.filter((pr) => pr.id !== id),
            total: Math.max(0, p.total - 1),
          })),
        };
      }
    );
  };

  const handleTogglePublic = (id: string, isPublic: boolean) => {
    queryClient.setQueryData(
      ["prompts", urlSearch, urlCategory, urlSort],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((p: PromptsPage) => ({
            ...p,
            prompts: p.prompts.map((pr) =>
              pr.id === id ? { ...pr, isPublic } : pr
            ),
          })),
        };
      }
    );
  };

  const isGrid = urlView !== "list";

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-bold tracking-tight">Your Prompts</h1>
          {total > 0 && !isLoading && (
            <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {total.toLocaleString()}
            </span>
          )}
        </div>
        <Button variant="outline" size="sm" asChild className="gap-1.5">
          <a href="/generate">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            New Prompt
          </a>
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="flex-1 min-w-[180px] max-w-xs">
          <Input
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search prompts…"
            startIcon={<Search />}
            className="h-9"
          />
        </div>

        {/* Category */}
        <Select
          value={urlCategory || "all"}
          onValueChange={(v) => updateParams({ category: v === "all" ? "" : v })}
        >
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORY_CONFIG.map((c) => (
              <SelectItem key={c.slug} value={c.slug}>
                {c.shortName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select
          value={urlSort}
          onValueChange={(v) => updateParams({ sort: v })}
        >
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
            <SelectItem value="copyCount">Most Copied</SelectItem>
            <SelectItem value="qualityScore">Highest Quality</SelectItem>
          </SelectContent>
        </Select>

        {/* View toggle */}
        <div className="flex items-center rounded-lg border border-border bg-card p-0.5 gap-0.5 ml-auto">
          <button
            onClick={() => updateParams({ view: "grid" })}
            className={cn(
              "rounded-md p-1.5 transition-colors",
              isGrid
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
            title="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => updateParams({ view: "list" })}
            className={cn(
              "rounded-md p-1.5 transition-colors",
              !isGrid
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
            title="List view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        isGrid ? <GridSkeleton /> : <ListSkeleton />
      ) : isError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-6 text-center text-sm text-destructive">
          Failed to load prompts. Please refresh.
        </div>
      ) : allPrompts.length === 0 ? (
        <EmptyState hasFilters={hasFilters} />
      ) : isGrid ? (
        /* ── Grid view ────────────────────────────────────────────────────── */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence initial={false} mode="popLayout">
            {allPrompts.map((prompt, i) => (
              <motion.div
                key={prompt.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                transition={{ delay: Math.min(i, 11) * 0.05, duration: 0.25 }}
              >
                <PromptCard
                  prompt={prompt}
                  onDeleted={handleDeleted}
                  onTogglePublic={handleTogglePublic}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        /* ── List view ────────────────────────────────────────────────────── */
        <div className="flex flex-col gap-2">
          <AnimatePresence initial={false} mode="popLayout">
            {allPrompts.map((prompt, i) => (
              <motion.div
                key={prompt.id}
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.12 } }}
                transition={{ delay: Math.min(i, 11) * 0.03, duration: 0.2 }}
              >
                <PromptListItem
                  prompt={prompt}
                  onDeleted={handleDeleted}
                  onTogglePublic={handleTogglePublic}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Load more */}
      {hasNextPage && (
        <div className="flex justify-center pt-2">
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
    </div>
  );
}

// ─── Page export (Suspense wrapper required for useSearchParams) ───────────────

export default function HistoryPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <GridSkeleton />
        </div>
      }
    >
      <HistoryContent />
    </Suspense>
  );
}
