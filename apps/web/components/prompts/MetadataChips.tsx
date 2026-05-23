"use client";

import { Sun, Smile, Camera, Palette, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PromptMetadata } from "@promptcraft/types";

interface MetadataChipsProps {
  metadata: PromptMetadata;
  className?: string;
}

const CHIP_DEFS: Array<{
  key: keyof PromptMetadata;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}> = [
  { key: "lighting", label: "Lighting", icon: Sun,     color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25" },
  { key: "mood",     label: "Mood",     icon: Smile,   color: "bg-purple-500/15 text-purple-400 border-purple-500/25" },
  { key: "camera",   label: "Camera",   icon: Camera,  color: "bg-blue-500/15   text-blue-400   border-blue-500/25"   },
  { key: "style",    label: "Style",    icon: Palette, color: "bg-pink-500/15   text-pink-400   border-pink-500/25"   },
  { key: "category", label: "Category", icon: Tag,     color: "bg-green-500/15  text-green-400  border-green-500/25"  },
];

export function MetadataChips({ metadata, className }: MetadataChipsProps) {
  const chips = CHIP_DEFS.filter(
    (d) => metadata[d.key] && typeof metadata[d.key] === "string"
  );

  if (chips.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {chips.map(({ key, label, icon: Icon, color }) => (
        <span
          key={key}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
            color
          )}
        >
          <Icon className="h-3 w-3 shrink-0" />
          <span className="text-muted-foreground mr-0.5">{label}:</span>
          {String(metadata[key])}
        </span>
      ))}
    </div>
  );
}
