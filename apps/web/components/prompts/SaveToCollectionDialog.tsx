"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Plus, FolderOpen } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface CollectionSummary {
  id: string;
  name: string;
  itemCount: number;
  containsPrompt: boolean;
}

interface SaveToCollectionDialogProps {
  promptId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SaveToCollectionDialog({
  promptId,
  open,
  onOpenChange,
}: SaveToCollectionDialogProps) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [initialSelected, setInitialSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  // Inline create form
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const { data: collections = [], isLoading } = useQuery<CollectionSummary[]>({
    queryKey: ["collections", "for-prompt", promptId],
    queryFn: async () => {
      const res = await fetch(`/api/collections?promptId=${promptId}`);
      if (!res.ok) throw new Error("Failed to load collections");
      return res.json();
    },
    enabled: open,
  });

  // Sync initial selected from API
  useEffect(() => {
    if (!collections.length) return;
    const ids = new Set(collections.filter((c) => c.containsPrompt).map((c) => c.id));
    setSelected(new Set(ids));
    setInitialSelected(new Set(ids));
  }, [collections]);

  // Reset when closed
  useEffect(() => {
    if (!open) {
      setShowCreate(false);
      setNewName("");
    }
  }, [open]);

  const toggleCollection = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const toAdd    = [...selected].filter((id) => !initialSelected.has(id));
    const toRemove = [...initialSelected].filter((id) => !selected.has(id));

    try {
      await Promise.all([
        ...toAdd.map((id) =>
          fetch(`/api/collections/${id}/prompts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ promptId }),
          })
        ),
        ...toRemove.map((id) =>
          fetch(`/api/collections/${id}/prompts`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ promptId }),
          })
        ),
      ]);

      queryClient.invalidateQueries({ queryKey: ["collections"] });

      const added   = toAdd.length;
      const removed = toRemove.length;
      if (added || removed) {
        toast.success(
          added && removed
            ? `Updated ${added + removed} collections`
            : added
            ? `Added to ${added} collection${added > 1 ? "s" : ""}`
            : `Removed from ${removed} collection${removed > 1 ? "s" : ""}`
        );
      }
      onOpenChange(false);
    } catch {
      toast.error("Could not update collections");
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();

      // Immediately add to selection
      setSelected((prev) => new Set([...prev, created.id]));
      queryClient.invalidateQueries({ queryKey: ["collections", "for-prompt", promptId] });
      queryClient.invalidateQueries({ queryKey: ["collections"] });

      setNewName("");
      setShowCreate(false);
      toast.success(`"${created.name}" created`);
    } catch {
      toast.error("Could not create collection");
    } finally {
      setCreating(false);
    }
  };

  const isDirty =
    [...selected].some((id) => !initialSelected.has(id)) ||
    [...initialSelected].some((id) => !selected.has(id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm" className="flex flex-col max-h-[80vh] p-0">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-primary" />
            Save to Collection
          </DialogTitle>
        </DialogHeader>

        <DialogBody className="flex-1 overflow-y-auto px-5 py-3 space-y-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : collections.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No collections yet. Create one below.
            </p>
          ) : (
            collections.map((col) => {
              const isChecked = selected.has(col.id);
              return (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => toggleCollection(col.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                    isChecked
                      ? "bg-primary/10 text-foreground"
                      : "hover:bg-muted/60 text-foreground"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                      isChecked
                        ? "bg-primary border-primary"
                        : "border-border bg-background"
                    )}
                  >
                    {isChecked && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                  </div>
                  <span className="flex-1 text-sm font-medium truncate">{col.name}</span>
                  <span className="text-[11px] text-muted-foreground shrink-0">
                    {col.itemCount} prompts
                  </span>
                </button>
              );
            })
          )}

          {/* Inline create form */}
          {showCreate ? (
            <div className="mt-2 rounded-lg border border-border bg-muted/30 p-3 space-y-2">
              <Label className="text-xs">New collection name</Label>
              <div className="flex gap-2">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Midjourney Favourites"
                  className="h-8 text-sm"
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  autoFocus
                />
                <Button
                  size="sm"
                  className="h-8 shrink-0"
                  onClick={handleCreate}
                  disabled={!newName.trim() || creating}
                >
                  {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Create"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 shrink-0"
                  onClick={() => { setShowCreate(false); setNewName(""); }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors mt-1"
            >
              <Plus className="h-3.5 w-3.5" />
              New collection
            </button>
          )}
        </DialogBody>

        <DialogFooter className="shrink-0 border-t border-border px-5 py-3">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!isDirty || saving}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
