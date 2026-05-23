"use client";

import { useState } from "react";
import { Copy, Globe, Trash2, Check, Star, Loader2, ExternalLink } from "lucide-react";
import { PromptDetailDialog } from "./PromptDetailDialog";
import { toast } from "@/components/ui/toast";
import { copyToClipboard, formatRelativeDate, truncate } from "@/lib/utils";
import { CATEGORY_MAP } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { PromptWithCategory } from "@promptcraft/types";

interface PromptListItemProps {
  prompt: PromptWithCategory;
  onDeleted: (id: string) => void;
  onTogglePublic: (id: string, isPublic: boolean) => void;
}

export function PromptListItem({ prompt, onDeleted, onTogglePublic }: PromptListItemProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [togglingPublic, setTogglingPublic] = useState(false);
  const [isPublic, setIsPublic] = useState(prompt.isPublic);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const catConfig = CATEGORY_MAP[prompt.category.slug];

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
      <div
        className="group flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 hover:border-border/80 hover:bg-card/80 transition-colors cursor-pointer"
        onClick={() => setDialogOpen(true)}
      >
        {/* Category badge */}
        <span
          className="mt-0.5 shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
          style={{
            backgroundColor: `${catConfig?.color ?? "#6366f1"}20`,
            color: catConfig?.color ?? "#6366f1",
          }}
        >
          {prompt.category.name}
        </span>

        {/* Prompt text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground/85 leading-snug">
            {truncate(prompt.generatedPrompt, 160)}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground truncate">
            {prompt.userInput}
          </p>
        </div>

        {/* Right meta + actions */}
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {/* Meta chips — hidden on small screens */}
          <div className="hidden sm:flex items-center gap-2 text-[11px] text-muted-foreground">
            {prompt.qualityScore != null && (
              <span className="flex items-center gap-0.5 text-yellow-500">
                <Star className="h-3 w-3 fill-current" />
                {prompt.qualityScore.toFixed(1)}
              </span>
            )}
            <span>{prompt.copyCount}</span>
            <span>{formatRelativeDate(prompt.createdAt)}</span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleCopy}
              className={cn(
                "rounded-md p-1.5 transition-colors",
                copied
                  ? "text-green-500"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
              title="Copy"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </button>

            <button
              onClick={handleTogglePublic}
              disabled={togglingPublic}
              className={cn(
                "rounded-md p-1.5 transition-colors",
                isPublic
                  ? "text-green-500"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
              title={isPublic ? "Make private" : "Make public"}
            >
              {togglingPublic
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Globe className="h-3.5 w-3.5" />}
            </button>

            <button
              onClick={handleDelete}
              disabled={deleting}
              className={cn(
                "rounded-md p-1.5 transition-colors",
                deleteConfirm
                  ? "text-destructive bg-destructive/10"
                  : "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              )}
              title={deleteConfirm ? "Click again to confirm" : "Delete"}
            >
              {deleting
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Trash2 className="h-3.5 w-3.5" />}
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); setDialogOpen(true); }}
              className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              title="View details"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

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
    </>
  );
}
