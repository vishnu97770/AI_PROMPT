"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import type { Metadata } from "next";
import { PromptInput } from "@/components/prompts/PromptInput";
import { PromptOutput } from "@/components/prompts/PromptOutput";
import { useGenerateStore } from "@/lib/stores/generateStore";
import { CATEGORY_MAP } from "@/lib/constants";

export default function GeneratePage() {
  const searchParams = useSearchParams();
  const setSelectedCategory = useGenerateStore((s) => s.setSelectedCategory);
  const selectedCategory    = useGenerateStore((s) => s.selectedCategory);

  // Pre-select category from ?category= URL param
  useEffect(() => {
    const slug = searchParams.get("category");
    if (slug && !selectedCategory) {
      const cat = CATEGORY_MAP[slug];
      if (cat) setSelectedCategory(cat);
    }
    // Only run on mount / when slug changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <div className="min-h-full">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Generate Prompt</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Describe your idea and let AI craft the perfect prompt for your tool of choice.
        </p>
      </div>

      {/* Two-column layout: 40 / 60 on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_3fr]">
        {/* LEFT — Input panel */}
        <div className="rounded-2xl border border-border bg-card p-5 self-start">
          <PromptInput />
        </div>

        {/* RIGHT — Output panel */}
        <div className="min-h-[420px]">
          <PromptOutput />
        </div>
      </div>
    </div>
  );
}
