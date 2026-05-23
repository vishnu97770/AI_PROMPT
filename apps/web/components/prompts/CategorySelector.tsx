"use client";

import {
  Image as ImageIcon, Camera, Film, Clapperboard, Code2,
  PenTool, FileText, BarChart2, Rocket, Youtube, Gamepad2,
  Bot, Wand2, Video, Globe, type LucideProps,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORY_CONFIG, type CategoryConfig } from "@/lib/constants";

type IconComponent = React.ComponentType<LucideProps>;

const ICON_MAP: Record<string, IconComponent> = {
  Image: ImageIcon, Camera, Film, Clapperboard, Code2,
  PenTool, FileText, BarChart2, Rocket, Youtube, Gamepad2,
  Bot, Wand2, Video, Globe,
};

interface CategorySelectorProps {
  selected: CategoryConfig | null;
  onSelect: (cat: CategoryConfig) => void;
}

export function CategorySelector({ selected, onSelect }: CategorySelectorProps) {
  return (
    <div className="relative">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent snap-x snap-mandatory">
        {CATEGORY_CONFIG.map((cat) => {
          const Icon = ICON_MAP[cat.lucideIcon] ?? Bot;
          const isSelected = selected?.slug === cat.slug;

          return (
            <button
              key={cat.slug}
              type="button"
              onClick={() => onSelect(cat)}
              className={cn(
                "snap-start shrink-0 flex flex-col items-center gap-1.5 rounded-xl border px-3 py-2.5",
                "transition-all duration-150 focus-visible:outline-none focus-visible:ring-2",
                "focus-visible:ring-primary/50 min-w-[72px] max-w-[80px]",
                isSelected
                  ? "border-primary/60 bg-primary/10 shadow-sm shadow-primary/20"
                  : "border-border bg-card hover:border-border/80 hover:bg-muted/60"
              )}
              style={
                isSelected
                  ? {
                      borderColor: `${cat.color}80`,
                      backgroundColor: `${cat.color}15`,
                    }
                  : undefined
              }
              title={cat.name}
            >
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                style={{
                  backgroundColor: isSelected ? `${cat.color}25` : `${cat.color}15`,
                  color: cat.color,
                }}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium leading-tight text-center line-clamp-2",
                  isSelected ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {cat.shortName}
              </span>
            </button>
          );
        })}
      </div>
      {/* Fade mask on right edge to hint at scroll */}
      <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-background to-transparent" />
    </div>
  );
}
