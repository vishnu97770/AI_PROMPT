"use client";

import Link from "next/link";
import { Globe, Lock, BookMarked } from "lucide-react";
import { motion } from "framer-motion";
import { formatRelativeDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export interface CollectionSummary {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  itemCount: number;
  updatedAt: string;
}

// Simple deterministic color from collection name
function nameToAccent(name: string): string {
  const PALETTE = [
    "#A855F7", "#6366F1", "#EC4899", "#3B82F6",
    "#22C55E", "#F97316", "#EAB308", "#14B8A6",
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

interface CollectionCardProps {
  collection: CollectionSummary;
  onDelete?: (id: string) => void;
}

export function CollectionCard({ collection }: CollectionCardProps) {
  const accent = nameToAccent(collection.name);

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
    >
      <Link href={`/collections/${collection.id}`} className="block group">
        <div
          className="relative flex flex-col rounded-2xl border border-border bg-card overflow-hidden transition-all duration-200 group-hover:border-border/80 group-hover:shadow-md"
          style={{ "--accent": accent } as React.CSSProperties}
        >
          {/* Colour strip header */}
          <div
            className="h-2 w-full"
            style={{ backgroundColor: accent }}
          />

          <div className="flex flex-col gap-3 p-5">
            {/* Icon + name row */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${accent}20`, color: accent }}
                >
                  <BookMarked className="h-4 w-4" />
                </div>
                <h3 className="font-semibold text-sm leading-snug truncate">
                  {collection.name}
                </h3>
              </div>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0",
                  collection.isPublic
                    ? "bg-green-500/15 text-green-500"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {collection.isPublic ? (
                  <Globe className="h-2.5 w-2.5" />
                ) : (
                  <Lock className="h-2.5 w-2.5" />
                )}
                {collection.isPublic ? "Public" : "Private"}
              </span>
            </div>

            {/* Description */}
            {collection.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {collection.description}
              </p>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/50">
              <span className="font-medium text-foreground/70">
                {collection.itemCount} {collection.itemCount === 1 ? "prompt" : "prompts"}
              </span>
              <span>Updated {formatRelativeDate(collection.updatedAt)}</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
