"use client";

import { useState } from "react";
import { Check, Copy, Globe, Loader2, Star, Trash2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MetadataChips } from "./MetadataChips";
import { toast } from "@/components/ui/toast";
import { copyToClipboard, formatRelativeDate } from "@/lib/utils";
import { CATEGORY_MAP } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { PromptWithCategory, ToolVariants, PromptMetadata } from "@promptcraft/types";

interface PromptDetailDialogProps {
  prompt: PromptWithCategory;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: (id: string) => void;
  onTogglePublic: (id: string, isPublic: boolean) => void;
}

const VARIANT_TABS = [
  { id: "main",             label: "Main" },
  { id: "midjourney",       label: "Midjourney" },
  { id: "dalle",            label: "DALL·E 3" },
  { id: "stable_diffusion", label: "Stable Diffusion" },
  { id: "chatgpt",          label: "ChatGPT" },
] as const;

function getVariant(prompt: PromptWithCategory, tabId: string): string {
  const v = prompt.toolVariants as ToolVariants | null;
  switch (tabId) {
    case "midjourney":       return v?.midjourney       ?? prompt.generatedPrompt;
    case "dalle":            return v?.dalle             ?? prompt.generatedPrompt;
    case "stable_diffusion": return v?.stable_diffusion  ?? prompt.generatedPrompt;
    case "chatgpt":          return `Please use the following as your complete creative brief:\n\n${prompt.generatedPrompt}`;
    default:                 return prompt.generatedPrompt;
  }
}

function CopyBtn({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  const handle = async () => {
    if (await copyToClipboard(text)) {
      setDone(true);
      toast.success("Copied!");
      setTimeout(() => setDone(false), 2000);
    }
  };
  return (
    <Button variant="outline" size="sm" onClick={handle} className={cn("gap-1.5", done && "text-green-500 border-green-500/40")}>
      {done ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {done ? "Copied" : label}
    </Button>
  );
}

export function PromptDetailDialog({
  prompt,
  open,
  onOpenChange,
  onDeleted,
  onTogglePublic,
}: PromptDetailDialogProps) {
  const [togglingPublic, setTogglingPublic] = useState(false);
  const [isPublic, setIsPublic] = useState(prompt.isPublic);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const catConfig = CATEGORY_MAP[prompt.category.slug];

  const handleTogglePublic = async () => {
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
      toast.success(next ? "Prompt is now public" : "Prompt made private");
    } catch {
      toast.error("Could not update visibility");
    } finally {
      setTogglingPublic(false);
    }
  };

  const handleDelete = async () => {
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
      onOpenChange(false);
      toast.success("Prompt deleted");
    } catch {
      toast.error("Could not delete prompt");
    } finally {
      setDeleting(false);
      setDeleteConfirm(false);
    }
  };

  const metadata = prompt.metadata as PromptMetadata | null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl" className="flex flex-col max-h-[85vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          {/* Category badge */}
          <div className="flex items-center gap-2 mb-2">
            <span
              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
              style={{
                backgroundColor: `${catConfig?.color ?? "#6366f1"}20`,
                color: catConfig?.color ?? "#6366f1",
              }}
            >
              {prompt.category.name}
            </span>
            {isPublic && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-medium text-green-500">
                <Globe className="h-2.5 w-2.5" />
                Public
              </span>
            )}
          </div>
          <DialogTitle className="text-base leading-snug line-clamp-2">
            {prompt.userInput}
          </DialogTitle>
          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-muted-foreground">
            {prompt.qualityScore != null && (
              <span className="flex items-center gap-1 text-yellow-500">
                <Star className="h-3 w-3 fill-current" />
                {prompt.qualityScore.toFixed(1)} / 10
              </span>
            )}
            {prompt.modelUsed && (
              <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-[10px]">
                {prompt.modelUsed.split("/").pop()}
              </span>
            )}
            <span>{formatRelativeDate(prompt.createdAt)}</span>
            <span>{prompt.copyCount} copies</span>
          </div>
        </DialogHeader>

        {/* Scrollable body */}
        <DialogBody className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full px-6 py-4">
            {/* Tool variant tabs */}
            <Tabs defaultValue="main" className="w-full">
              <TabsList variant="underline" className="overflow-x-auto w-full justify-start mb-0">
                {VARIANT_TABS.map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id} variant="underline" className="shrink-0 text-xs">
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {VARIANT_TABS.map((tab) => (
                <TabsContent key={tab.id} value={tab.id}>
                  <div className="relative rounded-xl border border-border bg-muted/40 p-4 mt-3">
                    <p className="text-sm font-mono leading-relaxed whitespace-pre-wrap text-foreground/90">
                      {getVariant(prompt, tab.id)}
                    </p>
                  </div>
                </TabsContent>
              ))}
            </Tabs>

            {/* Negative prompt */}
            {prompt.negativePrompt && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                  Negative Prompt
                </p>
                <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
                  <p className="text-sm font-mono text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {prompt.negativePrompt}
                  </p>
                </div>
              </div>
            )}

            {/* Metadata chips */}
            {metadata && Object.keys(metadata).length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                  Style Metadata
                </p>
                <MetadataChips metadata={metadata} />
              </div>
            )}
          </ScrollArea>
        </DialogBody>

        <DialogFooter className="shrink-0 gap-2 flex-wrap justify-between">
          <div className="flex gap-2 flex-wrap">
            <CopyBtn text={prompt.generatedPrompt} label="Copy Prompt" />
            {(prompt.toolVariants as ToolVariants | null)?.midjourney && (
              <CopyBtn
                text={(prompt.toolVariants as ToolVariants).midjourney!}
                label="Copy for Midjourney"
              />
            )}
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTogglePublic}
              disabled={togglingPublic}
              className="gap-1.5"
            >
              {togglingPublic ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Globe className="h-3.5 w-3.5" />
              )}
              {isPublic ? "Make Private" : "Make Public"}
            </Button>

            <Button
              variant={deleteConfirm ? "destructive" : "outline"}
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="gap-1.5"
            >
              {deleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              {deleteConfirm ? "Confirm Delete" : "Delete"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
