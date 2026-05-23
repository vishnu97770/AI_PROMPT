"use client";

import { useState } from "react";
import { Copy, Globe, Trash2, Check, Star, Loader2, BookMarked, X, Share2 } from "lucide-react";
import { motion } from "framer-motion";
import { PromptDetailDialog } from "./PromptDetailDialog";
import { SaveToCollectionDialog } from "./SaveToCollectionDialog";
import { toast } from "@/components/ui/toast";
import { copyToClipboard, formatRelativeDate } from "@/lib/utils";
import { CATEGORY_MAP, APP_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { PromptWithCategory } from "@promptcraft/types";

interface PromptCardProps {
  prompt: PromptWithCategory;
  onDeleted: (id: string) => void;
  onTogglePublic: (id: string, isPublic: boolean) => void;
  /** When provided, shows a "Remove" button instead of the delete button */
  onRemoveFromCollection?: (id: string) => void;
}

export function PromptCard({ prompt, onDeleted, onTogglePublic, onRemoveFromCollection }: PromptCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [togglingPublic, setTogglingPublic] = useState(false);
  const [isPublic, setIsPublic] = useState(prompt.isPublic);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const catConfig = CATEGORY_MAP[prompt.category.slug];

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isPublic) {
      toast.info("Make this prompt public to share it");
      return;
    }
    const ok = await copyToClipboard(`${APP_URL}/prompts/${prompt.id}`);
    if (ok) {
      setLinkCopied(true);
      toast.success("Share link copied!");
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (await copyToClipboard(prompt.generatedPrompt)) {
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTogglePublic = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setTogglingPublic(true);
    try {
      const res = await fetch(`/api/prompts/${prompt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: !isPublic }),
      });
      if (!res.ok) throw new Error();
      const next = !isPublic;
      setIsPublic(next);
      onTogglePublic(prompt.id, next);
    } catch {
      toast.error("Could not update visibility");
    } finally {
      setTogglingPublic(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      setTimeout(() => setDeleteConfirm(false), 3000);
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/prompts/${prompt.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      onDeleted(prompt.id);
      toast.success("Prompt deleted");
    } catch {
      toast.error("Could not delete prompt");
      setDeleting(false);
      setDeleteConfirm(false);
    }
  };

  return (
    <>
      <motion.div
        layoutId={`card-${prompt.id}`}
        className="group relative flex flex-col rounded-2xl border border-border bg-card hover:border-border/80 hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden"
        onClick={() => setDialogOpen(true)}
        whileHover={{ y: -2 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        {/* Card body */}
        <div className="flex flex-col gap-3 p-4 flex-1">
          {/* Category badge */}
          <div className="flex items-center justify-between gap-2">
            <span
              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold shrink-0"
              style={{
                backgroundColor: `${catConfig?.color ?? "#6366f1"}20`,
                color: catConfig?.color ?? "#6366f1",
              }}
            >
              {prompt.category.name}
            </span>
            {isPublic && (
              <Globe className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
            )}
          </div>

          {/* Prompt text */}
          <p className="text-sm leading-relaxed text-foreground/80 line-clamp-3 flex-1">
            {prompt.generatedPrompt}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/50">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              {prompt.qualityScore != null && (
                <span className="flex items-center gap-0.5 text-yellow-500 font-medium">
                  <Star className="h-3 w-3 fill-current" />
                  {prompt.qualityScore.toFixed(1)}
                </span>
              )}
              <span>{prompt.copyCount} copies</span>
            </div>
            <span className="text-[11px] text-muted-foreground">
              {formatRelativeDate(prompt.createdAt)}
            </span>
          </div>
        </div>

        {/* Hover action bar */}
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 flex items-center justify-between gap-1",
            "bg-card/95 backdrop-blur-sm border-t border-border px-3 py-2",
            "opacity-0 group-hover:opacity-100 transition-opacity duration-150",
            "translate-y-1 group-hover:translate-y-0"
          )}
          style={{ transition: "opacity 150ms, transform 150ms" }}
        >
          <button
            onClick={handleCopy}
            className={cn(
              "flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
              copied
                ? "text-green-500"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            )}
            title="Copy prompt"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>

          <div className="flex items-center gap-1">
            {/* Share */}
            <button
              onClick={handleShare}
              className={cn(
                "flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
                linkCopied
                  ? "text-green-500"
                  : isPublic
                  ? "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  : "text-muted-foreground/40 cursor-default"
              )}
              title={isPublic ? "Copy share link" : "Make Public to Share"}
            >
              {linkCopied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
            </button>

            {/* Save to collection */}
            <button
              onClick={(e) => { e.stopPropagation(); setSaveOpen(true); }}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              title="Save to collection"
            >
              <BookMarked className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={handleTogglePublic}
              disabled={togglingPublic}
              className={cn(
                "flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
                isPublic
                  ? "text-green-500 hover:text-green-600"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
              title={isPublic ? "Make private" : "Make public"}
            >
              {togglingPublic ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Globe className="h-3.5 w-3.5" />
              )}
            </button>

            {onRemoveFromCollection ? (
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  setRemoving(true);
                  try { onRemoveFromCollection(prompt.id); }
                  finally { setRemoving(false); }
                }}
                disabled={removing}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Remove from collection"
              >
                {removing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
              </button>
            ) : (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className={cn(
                  "flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
                  deleteConfirm
                    ? "text-destructive bg-destructive/10"
                    : "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                )}
                title={deleteConfirm ? "Click again to confirm" : "Delete"}
              >
                {deleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                {deleteConfirm && <span>Confirm?</span>}
              </button>
            )}
          </div>
        </div>
      </motion.div>

      <PromptDetailDialog
        prompt={{ ...prompt, isPublic }}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onDeleted={onDeleted}
        onTogglePublic={(id, val) => {
          setIsPublic(val);
          onTogglePublic(id, val);
        }}
      />

      <SaveToCollectionDialog
        promptId={prompt.id}
        open={saveOpen}
        onOpenChange={setSaveOpen}
      />
    </>
  );
}
