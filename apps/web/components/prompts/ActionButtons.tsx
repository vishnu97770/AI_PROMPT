"use client";

import { useState } from "react";
import { Globe, BookMarked, RefreshCw, Check, Loader2, FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { SaveToCollectionDialog } from "./SaveToCollectionDialog";
import { useGenerateStore } from "@/lib/stores/generateStore";

interface ActionButtonsProps {
  promptId: string | null;
  onEnhanceAgain: () => void;
}

export function ActionButtons({ promptId, onEnhanceAgain }: ActionButtonsProps) {
  const [isPublic, setIsPublic] = useState(false);
  const [savingPublic, setSavingPublic] = useState(false);
  const [publicDone, setPublicDone] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const resetOutput = useGenerateStore((s) => s.resetOutput);

  const handleMakePublic = async () => {
    if (!promptId) return;
    setSavingPublic(true);
    try {
      const res = await fetch(`/api/prompts/${promptId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: !isPublic }),
      });
      if (!res.ok) throw new Error("Failed");
      setIsPublic((v) => !v);
      setPublicDone(true);
      toast.success(isPublic ? "Prompt made private" : "Prompt is now public");
      setTimeout(() => setPublicDone(false), 2000);
    } catch {
      toast.error("Could not update visibility");
    } finally {
      setSavingPublic(false);
    }
  };

  return (
    <>
    <div className="flex flex-wrap gap-2">
      {/* Save to collection */}
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 text-xs h-8"
        onClick={() => setSaveOpen(true)}
        disabled={!promptId}
      >
        <FolderPlus className="h-3.5 w-3.5" />
        Save to Collection
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 text-xs h-8"
        onClick={handleMakePublic}
        disabled={!promptId || savingPublic}
      >
        {savingPublic ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : publicDone ? (
          <Check className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <Globe className="h-3.5 w-3.5" />
        )}
        {isPublic ? "Make Private" : "Make Public"}
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 text-xs h-8"
        onClick={onEnhanceAgain}
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Enhance Again
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 text-xs h-8 text-muted-foreground hover:text-foreground"
        onClick={resetOutput}
      >
        <BookMarked className="h-3.5 w-3.5" />
        Generate Another
      </Button>
    </div>

    {promptId && (
      <SaveToCollectionDialog
        promptId={promptId}
        open={saveOpen}
        onOpenChange={setSaveOpen}
      />
    )}
    </>
  );
}
