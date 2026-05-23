"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { CollectionSummary } from "./CollectionCard";

interface CollectionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existing?: Pick<CollectionSummary, "id" | "name" | "description" | "isPublic">;
  onSuccess: (collection: CollectionSummary) => void;
}

export function CollectionFormDialog({
  open,
  onOpenChange,
  existing,
  onSuccess,
}: CollectionFormDialogProps) {
  const isEdit = !!existing;
  const [name, setName]           = useState(existing?.name        ?? "");
  const [description, setDesc]    = useState(existing?.description ?? "");
  const [isPublic, setIsPublic]   = useState(existing?.isPublic    ?? false);
  const [saving, setSaving]       = useState(false);

  // Keep form in sync when `existing` changes
  useEffect(() => {
    setName(existing?.name        ?? "");
    setDesc(existing?.description ?? "");
    setIsPublic(existing?.isPublic ?? false);
  }, [existing]);

  // Reset on close
  useEffect(() => {
    if (!open && !isEdit) {
      setName("");
      setDesc("");
      setIsPublic(false);
    }
  }, [open, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const url    = isEdit ? `/api/collections/${existing!.id}` : "/api/collections";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || null, isPublic }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      onSuccess(data);
      onOpenChange(false);
      toast.success(isEdit ? "Collection updated" : `"${data.name}" created`);
    } catch {
      toast.error(isEdit ? "Could not update collection" : "Could not create collection");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm" className="p-0 flex flex-col">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border">
          <DialogTitle>{isEdit ? "Edit Collection" : "New Collection"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DialogBody className="px-5 py-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="col-name">Name</Label>
              <Input
                id="col-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Cinematic Reels"
                autoFocus
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="col-desc">
                Description
                <span className="ml-1 text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="col-desc"
                value={description}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="What's in this collection?"
              />
            </div>

            {/* Public toggle */}
            <button
              type="button"
              onClick={() => setIsPublic((v) => !v)}
              className={cn(
                "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm transition-colors",
                isPublic
                  ? "border-green-500/40 bg-green-500/10 text-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted/40"
              )}
            >
              <div className="flex flex-col text-left">
                <span className={cn("font-medium", isPublic ? "text-foreground" : "")}>
                  {isPublic ? "Public collection" : "Private collection"}
                </span>
                <span className="text-xs mt-0.5 opacity-70">
                  {isPublic
                    ? "Anyone with the link can view this"
                    : "Only you can see this collection"}
                </span>
              </div>
              <div
                className={cn(
                  "relative h-5 w-9 rounded-full transition-colors",
                  isPublic ? "bg-green-500" : "bg-muted-foreground/30"
                )}
              >
                <div
                  className={cn(
                    "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                    isPublic ? "translate-x-4" : "translate-x-0"
                  )}
                />
              </div>
            </button>
          </DialogBody>

          <DialogFooter className="border-t border-border px-5 py-3">
            <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={!name.trim() || saving}>
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              {isEdit ? "Save Changes" : "Create Collection"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
