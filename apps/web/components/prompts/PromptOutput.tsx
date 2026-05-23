"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, Check, Copy, ChevronDown, ChevronUp, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { StreamingText } from "./StreamingText";
import { ToolVariantTabs } from "./ToolVariantTabs";
import { MetadataChips } from "./MetadataChips";
import { ActionButtons } from "./ActionButtons";
import { useGenerateStore } from "@/lib/stores/generateStore";
import { copyToClipboard } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { GenerateResponse } from "@promptcraft/types";

// Animated "Generating with {model}..." dots
function GeneratingDots({ model }: { model: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="text-primary font-medium">Generating</span>
      {model && (
        <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono">
          {model.split("/").pop()}
        </span>
      )}
      <span className="flex gap-0.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="inline-block h-1.5 w-1.5 rounded-full bg-primary/60"
            style={{ animation: `bounce 1.2s ${i * 0.2}s infinite` }}
          />
        ))}
      </span>
    </div>
  );
}

function QualityBadge({ score }: { score: number }) {
  const color =
    score >= 8 ? "text-green-500 bg-green-500/10 border-green-500/25" :
    score >= 6 ? "text-yellow-500 bg-yellow-500/10 border-yellow-500/25" :
                 "text-red-500 bg-red-500/10 border-red-500/25";
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold", color)}>
      <Star className="h-3 w-3 fill-current" />
      Quality: {score.toFixed(1)} / 10
    </span>
  );
}

export function PromptOutput() {
  const {
    isGenerating,
    streamedText,
    streamModel,
    finalResult,
    savedPromptId,
    error,
    selectedCategory,
    userInput,
    stylePreferences,
    appendToken,
    setStreamModel,
    setFinalResult,
    setSavedPromptId,
    setError,
    incrementCreditsUsed,
    startGeneration,
  } = useGenerateStore();

  const esRef = useRef<EventSource | null>(null);
  const [negativeOpen, setNegativeOpen] = useState(false);
  const [mainCopied, setMainCopied] = useState(false);

  // Open SSE connection when generation starts
  useEffect(() => {
    if (!isGenerating) {
      esRef.current?.close();
      esRef.current = null;
      return;
    }
    if (esRef.current) return;
    if (!selectedCategory) return;

    // Build enhanced input: append style preferences if set
    let enhancedInput = userInput;
    const prefs = [
      stylePreferences.mood         && `Mood: ${stylePreferences.mood}`,
      stylePreferences.lighting     && `Lighting: ${stylePreferences.lighting}`,
      stylePreferences.colorPalette && `Color palette: ${stylePreferences.colorPalette}`,
    ].filter(Boolean);
    if (prefs.length) {
      enhancedInput += `\n\nStyle preferences: ${prefs.join(", ")}`;
    }

    const params = new URLSearchParams({
      userInput: enhancedInput,
      categorySlug: selectedCategory.slug,
    });

    const es = new EventSource(`/api/generate/stream?${params}`);
    esRef.current = es;

    es.onmessage = async (e: MessageEvent<string>) => {
      if (e.data === "[DONE]") {
        es.close();
        esRef.current = null;
        return;
      }
      try {
        const event = JSON.parse(e.data) as Record<string, unknown>;

        if ("event" in event && event.event === "start") {
          setStreamModel(String(event.model ?? ""));
        } else if ("token" in event) {
          appendToken(String(event.token ?? ""));
        } else if ("done" in event && event.done === true) {
          const result = event.result as GenerateResponse;
          setFinalResult(result);
          incrementCreditsUsed();
        } else if ("saved" in event) {
          if (event.saved && event.promptId) {
            setSavedPromptId(String(event.promptId));
            toast.success("Prompt saved to history ✓");
          }
        } else if ("error" in event) {
          const msg = String(event.error ?? "Generation failed");
          setError(msg);
          toast.error(msg);
          es.close();
          esRef.current = null;
        }
      } catch {
        // malformed event
      }
    };

    es.onerror = () => {
      setError("Connection failed. Please try again.");
      toast.error("Generation failed — please try again.");
      es.close();
      esRef.current = null;
    };

    return () => {
      es.close();
      esRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGenerating]);

  const handleMainCopy = async () => {
    if (!finalResult) return;
    const ok = await copyToClipboard(finalResult.generatedPrompt);
    if (ok) {
      setMainCopied(true);
      setTimeout(() => setMainCopied(false), 2000);
    }
  };

  const handleEnhanceAgain = () => {
    startGeneration();
  };

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (!isGenerating && !finalResult && !error) {
    return (
      <div className="flex h-full min-h-[360px] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border/60 bg-muted/20 p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Sparkles className="h-8 w-8 text-primary/60" />
        </div>
        <div>
          <p className="font-semibold text-foreground/80">
            Your optimized prompt will appear here
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Select a category, describe your idea, then click Generate
          </p>
        </div>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────────
  if (error && !isGenerating) {
    return (
      <div className="flex h-full min-h-[360px] flex-col items-center justify-center gap-4 rounded-2xl border border-red-500/30 bg-red-500/5 p-8 text-center">
        <p className="text-sm font-medium text-red-400">{error}</p>
        <Button variant="outline" size="sm" onClick={startGeneration}>
          Try again
        </Button>
      </div>
    );
  }

  // ── Generating state ─────────────────────────────────────────────────────────
  if (isGenerating) {
    return (
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 min-h-[360px]">
        <GeneratingDots model={streamModel} />
        <StreamingText
          text={streamedText}
          isStreaming={true}
          className="flex-1 min-h-[240px] rounded-xl bg-muted/40 p-4"
        />
      </div>
    );
  }

  // ── Result state ─────────────────────────────────────────────────────────────
  if (!finalResult) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="result"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="flex flex-col gap-5"
      >
        {/* Header row */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-500">
              <Check className="h-3.5 w-3.5" />
              Generated
            </span>
            {finalResult.qualityScore != null && (
              <QualityBadge score={finalResult.qualityScore} />
            )}
            {finalResult.cached && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                cached
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMainCopy}
            className={cn(
              "h-7 gap-1.5 text-xs",
              mainCopied ? "text-green-500" : "text-muted-foreground"
            )}
          >
            {mainCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {mainCopied ? "Copied!" : "Copy"}
          </Button>
        </div>

        {/* Tool variant tabs */}
        <ToolVariantTabs result={finalResult} />

        {/* Negative prompt (collapsible) */}
        {finalResult.negativePrompt && (
          <div className="rounded-xl border border-border/60 overflow-hidden">
            <button
              type="button"
              onClick={() => setNegativeOpen((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-2.5 text-xs font-medium text-muted-foreground hover:bg-muted/40 transition-colors"
            >
              <span>Negative Prompt</span>
              {negativeOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {negativeOpen && (
              <div className="border-t border-border/60 bg-muted/20 px-4 py-3">
                <p className="text-sm text-muted-foreground font-mono leading-relaxed whitespace-pre-wrap">
                  {finalResult.negativePrompt}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Metadata chips */}
        {finalResult.metadata && Object.keys(finalResult.metadata).length > 0 && (
          <MetadataChips metadata={finalResult.metadata} />
        )}

        {/* Action buttons */}
        <ActionButtons
          promptId={savedPromptId}
          onEnhanceAgain={handleEnhanceAgain}
        />
      </motion.div>
    </AnimatePresence>
  );
}
