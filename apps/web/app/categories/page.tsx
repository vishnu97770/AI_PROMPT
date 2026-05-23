"use client";

import { useState, useMemo } from "react";
import { Search, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { CategoryCard } from "@/components/prompts/CategoryCard";
import { CATEGORY_CONFIG } from "@/lib/constants";

export default function CategoriesPage() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return CATEGORY_CONFIG;
    return CATEGORY_CONFIG.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.shortName.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary ring-1 ring-primary/20 mb-4">
          <Sparkles className="h-3 w-3" />
          15 Specialised Categories
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl mb-3">
          Choose Your{" "}
          <span className="bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
            Category
          </span>
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
          Each category is powered by a hand-crafted system prompt and expert
          vocabulary. Pick one and transform your idea into a professional-grade
          AI prompt in seconds.
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-8 max-w-md mx-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search categories…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Results count */}
      {query && (
        <p className="text-sm text-muted-foreground text-center mb-6">
          {filtered.length === 0
            ? "No categories match your search."
            : `${filtered.length} categor${filtered.length === 1 ? "y" : "ies"} found`}
        </p>
      )}

      {/* Grid */}
      <motion.div
        layout
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
      >
        <AnimatePresence mode="popLayout">
          {filtered.map((cat, i) => (
            <motion.div
              key={cat.slug}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.15, delay: i * 0.03 }}
            >
              <CategoryCard category={cat} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="text-4xl">🔍</div>
          <p className="font-semibold">No categories found</p>
          <p className="text-sm text-muted-foreground">
            Try searching for something else, like "video" or "code".
          </p>
          <button
            onClick={() => setQuery("")}
            className="text-sm text-primary hover:underline mt-1"
          >
            Clear search
          </button>
        </div>
      )}
    </div>
  );
}
