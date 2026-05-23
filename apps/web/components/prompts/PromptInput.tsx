"use client";

import { useRef, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, Sparkles, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { CategorySelector } from "./CategorySelector";
import { useGenerateStore } from "@/lib/stores/generateStore";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface StatsResponse {
  promptsToday: number;
  dailyLimit: number | null;
  plan: string;
}

export function PromptInput() {
  const {
    selectedCategory,
    userInput,
    stylePreferences,
    isGenerating,
    creditsUsed,
    creditsLimit,
    setSelectedCategory,
    setUserInput,
    setStylePreferences,
    setCredits,
    startGeneration,
  } = useGenerateStore();

  const [stylesOpen, setStylesOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch credits from user stats
  const { data: stats } = useQuery<StatsResponse>({
    queryKey: ["user-stats-credits"],
    queryFn: async () => {
      const res = await fetch("/api/user/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
    staleTime: 30_000,
  });

  useEffect(() => {
    if (stats) {
      setCredits(stats.promptsToday, stats.dailyLimit ?? 10);
    }
  }, [stats, setCredits]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const lineH = 24;
    const min = lineH * 3;
    const max = lineH * 8;
    el.style.height = Math.min(Math.max(el.scrollHeight, min), max) + "px";
    el.style.overflowY = el.scrollHeight > max ? "auto" : "hidden";
  }, [userInput]);

  const placeholder = selectedCategory
    ? `Describe your ${selectedCategory.name.toLowerCase()} idea...\n\nExample: "${selectedCategory.exampleInput}"`
    : "Select a category above, then describe what you want to create…";

  const canGenerate =
    !isGenerating &&
    userInput.trim().length >= 3 &&
    !!selectedCategory &&
    (creditsLimit === 0 || creditsUsed < creditsLimit);

  const creditsExhausted = creditsLimit > 0 && creditsUsed >= creditsLimit;

  const handleGenerate = () => {
    if (!canGenerate) return;
    startGeneration();
  };

  const pct = creditsLimit > 0 ? Math.min((creditsUsed / creditsLimit) * 100, 100) : 0;

  return (
    <div className="flex flex-col gap-5">
      {/* Category selector */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
          Category
        </label>
        <CategorySelector
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />
      </div>

      {/* Textarea */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
          Your Idea
        </label>
        <Textarea
          ref={textareaRef}
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "resize-none transition-all duration-150 text-sm leading-relaxed",
            "min-h-[72px] placeholder:text-muted-foreground/60",
            selectedCategory && "border-border/80 focus:border-primary/50"
          )}
          style={{ overflow: "hidden" }}
          disabled={isGenerating}
        />
        <p className="mt-1 text-right text-[11px] text-muted-foreground">
          {userInput.length} / 2000
        </p>
      </div>

      {/* Style Preferences (collapsible) */}
      <div className="rounded-xl border border-border/60 overflow-hidden">
        <button
          type="button"
          onClick={() => setStylesOpen((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-2.5 text-sm font-medium hover:bg-muted/40 transition-colors"
        >
          <span className="flex items-center gap-2 text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            Style Preferences
            <span className="text-[10px] font-normal">(optional)</span>
          </span>
          {stylesOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {stylesOpen && (
          <div className="grid grid-cols-1 gap-3 border-t border-border/60 bg-muted/20 px-4 py-4">
            {[
              { key: "mood"         as const, label: "Mood",          placeholder: "e.g. dark, dramatic, peaceful" },
              { key: "lighting"     as const, label: "Lighting Style", placeholder: "e.g. golden hour, neon, soft studio" },
              { key: "colorPalette" as const, label: "Color Palette",  placeholder: "e.g. muted earth tones, neon pastels" },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                  {label}
                </label>
                <Input
                  value={stylePreferences[key]}
                  onChange={(e) => setStylePreferences({ [key]: e.target.value })}
                  placeholder={placeholder}
                  className="h-8 text-sm"
                  disabled={isGenerating}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Generate button */}
      {creditsExhausted ? (
        <div className="space-y-3">
          <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-3 text-sm text-orange-400">
            You&apos;ve used all {creditsLimit} daily generations. Upgrade for more.
          </div>
          <Button asChild className="w-full gap-2">
            <Link href="/settings/billing">
              <Zap className="h-4 w-4" />
              Upgrade to Pro
            </Link>
          </Button>
        </div>
      ) : (
        <Button
          onClick={handleGenerate}
          disabled={!canGenerate}
          size="lg"
          className="w-full gap-2 font-semibold"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate Prompt
            </>
          )}
        </Button>
      )}

      {/* Credits */}
      {!creditsExhausted && creditsLimit > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Daily generations</span>
            <span className="tabular-nums font-medium">
              {creditsUsed} / {creditsLimit}
            </span>
          </div>
          <Progress
            value={pct}
            indicatorClassName={pct >= 80 ? "bg-orange-500" : "bg-primary"}
          />
        </div>
      )}
    </div>
  );
}
