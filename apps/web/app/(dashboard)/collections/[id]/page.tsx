"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Copy, Globe, Lock, Pencil, ArrowLeft, Loader2, BookMarked } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PromptCard } from "@/components/prompts/PromptCard";
import { CollectionFormDialog } from "@/components/collections/CollectionFormDialog";
import { toast } from "@/components/ui/toast";
import { copyToClipboard, formatRelativeDate } from "@/lib/utils";
import { APP_URL } from "@/lib/constants";
import type { PromptWithCategory } from "@promptcraft/types";
import type { CollectionSummary } from "@/components/collections/CollectionCard";

interface CollectionDetail {
  collection: CollectionSummary;
  prompts: PromptWithCategory[];
  total: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
}

async function fetchCollectionPage(id: string, page: number): Promise<CollectionDetail> {
  const res = await fetch(`/api/collections/${id}?page=${page}&limit=12`);
  if (!res.ok) throw new Error("Failed to load collection");
  return res.json();
}

export default function CollectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ["collection", id],
    queryFn: ({ pageParam }: { pageParam: number }) => fetchCollectionPage(id, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => last.hasNextPage ? last.page + 1 : undefined,
  });

  const collection = data?.pages[0]?.collection;
  const allPrompts = data?.pages.flatMap((p) => p.prompts) ?? [];
  const total      = data?.pages[0]?.total ?? 0;

  const handleEdited = (updated: CollectionSummary) => {
    queryClient.setQueryData(["collection", id], (old: typeof data) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((p, i) =>
          i === 0 ? { ...p, collection: { ...p.collection, ...updated } } : p
        ),
      };
    });
    queryClient.invalidateQueries({ queryKey: ["collections"] });
  };

  const handleRemoveFromCollection = async (promptId: string) => {
    try {
      const res = await fetch(`/api/collections/${id}/prompts`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptId }),
      });
      if (!res.ok) throw new Error();

      // Optimistically remove from cache
      queryClient.setQueryData(["collection", id], (old: typeof data) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((p) => ({
            ...p,
            prompts: p.prompts.filter((pr) => pr.id !== promptId),
            total: Math.max(0, p.total - 1),
            collection: { ...p.collection, itemCount: Math.max(0, p.collection.itemCount - 1) },
          })),
        };
      });
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      toast.success("Removed from collection");
    } catch {
      toast.error("Could not remove prompt");
    }
  };

  const handleDeleted = (promptId: string) => {
    queryClient.setQueryData(["collection", id], (old: typeof data) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((p) => ({
          ...p,
          prompts: p.prompts.filter((pr) => pr.id !== promptId),
          total: Math.max(0, p.total - 1),
        })),
      };
    });
  };

  const handleCopyShareLink = async () => {
    const url = `${APP_URL}/c/${id}`;
    if (await copyToClipboard(url)) {
      setCopied(true);
      toast.success("Share link copied");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !collection) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-sm text-muted-foreground">Collection not found.</p>
        <Button variant="outline" asChild>
          <Link href="/collections">Back to Collections</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/collections"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Collections
      </Link>

      {/* Collection header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">{collection.name}</h1>
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
              style={{
                backgroundColor: collection.isPublic ? "rgb(34 197 94 / 0.15)" : "rgb(148 163 184 / 0.15)",
                color: collection.isPublic ? "rgb(34 197 94)" : "rgb(148 163 184)",
              }}
            >
              {collection.isPublic ? (
                <><Globe className="h-2.5 w-2.5" />Public</>
              ) : (
                <><Lock className="h-2.5 w-2.5" />Private</>
              )}
            </span>
          </div>

          {collection.description && (
            <p className="text-sm text-muted-foreground">{collection.description}</p>
          )}

          <p className="text-xs text-muted-foreground">
            {total} {total === 1 ? "prompt" : "prompts"} · Updated {formatRelativeDate(collection.updatedAt)}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {collection.isPublic && (
            <Button variant="outline" size="sm" onClick={handleCopyShareLink} className="gap-1.5">
              {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Share"}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)} className="gap-1.5">
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
        </div>
      </div>

      {/* Prompts grid */}
      {allPrompts.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <BookMarked className="h-7 w-7 text-muted-foreground/50" />
          </div>
          <p className="text-sm text-muted-foreground">No prompts in this collection yet.</p>
          <Button variant="outline" asChild>
            <Link href="/history">Browse your prompts</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                    onTogglePublic={() => {}}
                    onRemoveFromCollection={handleRemoveFromCollection}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {hasNextPage && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="min-w-[140px]"
              >
                {isFetchingNextPage ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />Loading…</>
                ) : "Load More"}
              </Button>
            </div>
          )}
        </>
      )}

      <CollectionFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        existing={collection}
        onSuccess={handleEdited}
      />
    </div>
  );
}
