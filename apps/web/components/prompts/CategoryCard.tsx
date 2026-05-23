"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Image as ImageIcon, Camera, Film, Clapperboard, Code2,
  PenTool, FileText, BarChart2, Rocket, Youtube, Gamepad2,
  Bot, Wand2, Video, Globe, LucideProps,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { CategoryConfig } from "@/lib/constants";

// ── Lucide icon lookup ─────────────────────────────────────────────────────────

type IconComponent = React.ComponentType<LucideProps>;

const ICON_MAP: Record<string, IconComponent> = {
  Image:       ImageIcon,
  Camera,
  Film,
  Clapperboard,
  Code2,
  PenTool,
  FileText,
  BarChart2,
  Rocket,
  Youtube,
  Gamepad2,
  Bot,
  Wand2,
  Video,
  Globe,
};

// ── Card ──────────────────────────────────────────────────────────────────────

interface CategoryCardProps {
  category: CategoryConfig;
  /** When true renders a compact version for use in grids with many items */
  compact?: boolean;
}

export function CategoryCard({ category, compact = false }: CategoryCardProps) {
  const Icon = ICON_MAP[category.lucideIcon] ?? Sparkle;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.015 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className="h-full"
      style={
        {
          "--cat-color": category.color,
          "--cat-glow": `${category.color}33`,
        } as React.CSSProperties
      }
    >
      <div
        className={cn(
          "group relative flex flex-col h-full rounded-2xl border border-border bg-card",
          "p-5 transition-all duration-200",
          "hover:border-[var(--cat-color)]/50",
          "hover:shadow-[0_8px_32px_0_var(--cat-glow),0_0_0_1px_var(--cat-color)/20]"
        )}
      >
        {/* Icon + badge row */}
        <div className="flex items-start justify-between mb-4">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl transition-colors"
            style={{
              backgroundColor: `${category.color}1a`,
              color: category.color,
            }}
          >
            <Icon className="h-5 w-5" />
          </div>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{
              backgroundColor: `${category.color}1a`,
              color: category.color,
            }}
          >
            {category.shortName}
          </span>
        </div>

        {/* Name + description */}
        <h3 className="font-semibold text-sm leading-snug mb-1.5">
          {category.name}
        </h3>
        <p
          className={cn(
            "text-xs text-muted-foreground leading-relaxed",
            compact ? "line-clamp-2" : "line-clamp-2 mb-4"
          )}
        >
          {category.description}
        </p>

        {/* Example output — hidden in compact mode */}
        {!compact && (
          <div className="flex-1 my-3 rounded-lg bg-muted/60 px-3 py-2.5 border border-border/60">
            <p className="text-[10px] font-medium text-muted-foreground mb-1 uppercase tracking-wide">
              Example output
            </p>
            <p className="text-xs text-foreground/70 leading-relaxed line-clamp-3 font-mono">
              {category.exampleOutput}
            </p>
          </div>
        )}

        {/* Generate button */}
        <div className={cn("mt-auto", !compact && "pt-1")}>
          <Button
            asChild
            size="sm"
            className="w-full transition-all duration-200 group-hover:shadow-sm"
            style={
              {
                "--btn-bg": category.color,
                "--btn-hover": `${category.color}dd`,
              } as React.CSSProperties
            }
          >
            <Link href={`/generate?category=${category.slug}`}>
              Generate
              <svg
                className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// Fallback icon (never actually used if ICON_MAP is complete)
function Sparkle(props: LucideProps) {
  return <span {...(props as React.HTMLAttributes<HTMLSpanElement>)}>✦</span>;
}
