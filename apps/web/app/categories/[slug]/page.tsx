"use client";

import { notFound } from "next/navigation";
import Link from "next/link";
import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Image as ImageIcon, Camera, Film, Clapperboard, Code2,
  PenTool, FileText, BarChart2, Rocket, Youtube, Gamepad2,
  Bot, Wand2, Video, Globe, Sparkles, Copy, Check,
  ChevronRight, Lightbulb, ArrowRight, LucideProps,
} from "lucide-react";
import { cn, copyToClipboard, formatRelativeDate } from "@/lib/utils";
import { CATEGORY_MAP } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryCard } from "@/components/prompts/CategoryCard";
import { CategoryBadge } from "@/components/prompts/CategoryBadge";
import { toastCopied } from "@/components/ui/toast";
import { CATEGORY_CONFIG } from "@/lib/constants";
import { useState } from "react";

// ── Lucide icon lookup (same map as CategoryCard) ─────────────────────────────

type IconComponent = React.ComponentType<LucideProps>;

const ICON_MAP: Record<string, IconComponent> = {
  Image: ImageIcon, Camera, Film, Clapperboard, Code2,
  PenTool, FileText, BarChart2, Rocket, Youtube, Gamepad2,
  Bot, Wand2, Video, Globe,
};

// ── Types ──────────────────────────────────────────────────────────────────────

interface CommunityPrompt {
  id: string;
  generatedPrompt: string;
  copyCount: number;
  createdAt: string;
  category: { slug: string; name: string };
}

// ── Community prompt card ──────────────────────────────────────────────────────

function CommunityPromptCard({ prompt, rank }: { prompt: CommunityPrompt; rank: number }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const ok = await copyToClipboard(prompt.generatedPrompt);
    if (ok) {
      setCopied(true);
      toastCopied();
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.06 }}
    >
      <Card hoverable>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <span className="text-sm font-bold text-muted-foreground tabular-nums w-5 shrink-0 mt-0.5">
              {rank + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm leading-relaxed line-clamp-4 text-foreground/85">
                {prompt.generatedPrompt}
              </p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-[11px] text-muted-foreground">
                  {prompt.copyCount.toLocaleString()} copies
                </span>
                <span className="text-[11px] text-muted-foreground">·</span>
                <span className="text-[11px] text-muted-foreground">
                  {formatRelativeDate(new Date(prompt.createdAt))}
                </span>
              </div>
            </div>
            <button
              onClick={handleCopy}
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors rounded p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Copy prompt"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function CategorySlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const category = CATEGORY_MAP[slug];

  if (!category) notFound();

  const Icon = ICON_MAP[category.lucideIcon] ?? Sparkles;

  const { data: communityPrompts, isLoading } = useQuery<CommunityPrompt[]>({
    queryKey: ["trending", slug],
    queryFn: () =>
      fetch(`/api/prompts/trending?category=${slug}&limit=6`).then((r) =>
        r.json()
      ),
    staleTime: 60_000,
  });

  // Sibling categories (excluding current, up to 3)
  const relatedCategories = CATEGORY_CONFIG.filter(
    (c) => c.slug !== slug
  ).slice(0, 3);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 space-y-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/categories" className="hover:text-foreground transition-colors">
          Categories
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">{category.name}</span>
      </nav>

      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row gap-6 items-start"
      >
        {/* Icon */}
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset"
          style={{
            backgroundColor: `${category.color}1a`,
            color: category.color,
            outline: `1px solid ${category.color}30`,
            outlineOffset: "-1px",
          }}
        >
          <Icon className="h-8 w-8" />
        </div>

        {/* Text */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {category.name}
            </h1>
            <CategoryBadge slug={slug} />
          </div>
          <p className="text-muted-foreground leading-relaxed">
            {category.description}
          </p>
          {category.modelOverride && (
            <Badge variant="secondary" className="mt-3 text-[11px]">
              ✦ Powered by Claude Sonnet
            </Badge>
          )}
        </div>
      </motion.section>

      {/* CTA */}
      <section className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <h2 className="font-semibold">Ready to generate?</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Turn your idea into a professional {category.shortName} prompt in seconds.
          </p>
        </div>
        <Button asChild size="lg" className="shrink-0">
          <Link href={`/generate?category=${slug}`}>
            <Sparkles className="h-4 w-4 mr-2" />
            Start Generating
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </section>

      {/* Example output */}
      <section>
        <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
          <span
            className="inline-flex h-5 w-5 items-center justify-center rounded text-xs font-bold"
            style={{ backgroundColor: `${category.color}25`, color: category.color }}
          >
            ✦
          </span>
          Example Output
        </h2>
        <div className="rounded-xl bg-muted/50 border border-border p-4">
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
            Input: "{category.exampleInput}"
          </p>
          <p className="text-sm leading-relaxed font-mono text-foreground/80">
            {category.exampleOutput}
          </p>
        </div>
      </section>

      {/* Tips */}
      <section>
        <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Lightbulb className="h-4 w-4" style={{ color: category.color }} />
          Pro Tips for {category.shortName}
        </h2>
        <div className="space-y-3">
          {category.tips.map((tip, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex gap-3 rounded-xl border border-border bg-card p-4"
            >
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold mt-0.5"
                style={{
                  backgroundColor: `${category.color}20`,
                  color: category.color,
                }}
              >
                {i + 1}
              </span>
              <p className="text-sm leading-relaxed text-muted-foreground">{tip}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Community prompts */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">Top Community Prompts</h2>
          <Link
            href="/community"
            className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
          >
            View all <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <Skeleton className="h-4 w-4 shrink-0 mt-1" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-5/6" />
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-3 w-24 mt-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !communityPrompts?.length ? (
          <div className="rounded-2xl border border-dashed border-border px-6 py-10 text-center">
            <p className="text-sm font-medium">No community prompts yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Be the first to generate and share a {category.shortName} prompt.
            </p>
            <Button size="sm" className="mt-4" asChild>
              <Link href={`/generate?category=${slug}`}>Generate now</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {communityPrompts.map((p, i) => (
              <CommunityPromptCard key={p.id} prompt={p} rank={i} />
            ))}
          </div>
        )}
      </section>

      {/* Related categories */}
      <section>
        <h2 className="text-base font-semibold mb-4">Explore More Categories</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {relatedCategories.map((cat) => (
            <CategoryCard key={cat.slug} category={cat} compact />
          ))}
        </div>
        <div className="mt-4 text-center">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/categories">
              All categories <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
