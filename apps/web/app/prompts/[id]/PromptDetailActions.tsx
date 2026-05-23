"use client";

import { useState } from "react";
import { Copy, Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { APP_URL } from "@/lib/constants";

interface PromptDetailActionsProps {
  promptId: string;
  promptText: string;
  /** variant label → text */
  variants: Record<string, string>;
}

function CopyBtn({
  text,
  label,
  variant = "outline",
}: {
  text: string;
  label: string;
  variant?: "outline" | "default";
}) {
  const [done, setDone] = useState(false);

  const handle = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
      fetch(window.location.pathname.replace("/prompts/", "/api/prompts/") + "/copy", {
        method: "POST",
      }).catch(() => {});
    } catch {
      // clipboard API blocked
    }
  };

  return (
    <Button
      variant={variant}
      size="sm"
      onClick={handle}
      className={cn("gap-1.5", done && "text-green-500 border-green-500/40")}
    >
      {done ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {done ? "Copied!" : label}
    </Button>
  );
}

function ShareBtn({ promptId }: { promptId: string }) {
  const [done, setDone] = useState(false);

  const handle = async () => {
    const url = `${APP_URL}/prompts/${promptId}`;
    try {
      await navigator.clipboard.writeText(url);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch {
      // fallback — nothing we can do
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handle}
      className={cn("gap-1.5", done && "text-green-500 border-green-500/40")}
    >
      {done ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
      {done ? "Copied!" : "Share"}
    </Button>
  );
}

export function PromptDetailActions({
  promptId,
  promptText,
  variants,
}: PromptDetailActionsProps) {
  const [activeTab, setActiveTab] = useState("main");
  const currentText = variants[activeTab] ?? promptText;

  const TABS = [
    { id: "main",             label: "Main" },
    { id: "midjourney",       label: "Midjourney" },
    { id: "dalle",            label: "DALL·E 3" },
    { id: "stable_diffusion", label: "Stable Diffusion" },
    { id: "chatgpt",          label: "ChatGPT" },
  ] as const;

  return (
    <div className="space-y-4">
      {/* Tab row */}
      <div className="flex gap-1 overflow-x-auto pb-1 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "shrink-0 rounded-t-md px-3 py-1.5 text-xs font-medium transition-colors",
              activeTab === tab.id
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Prompt text */}
      <div className="relative rounded-xl border border-border bg-muted/40 p-4">
        <p className="text-sm leading-relaxed whitespace-pre-wrap font-mono pr-2 text-foreground/90">
          {currentText}
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <CopyBtn text={currentText} label={`Copy ${TABS.find((t) => t.id === activeTab)?.label ?? ""}`} variant="default" />
        <ShareBtn promptId={promptId} />
      </div>
    </div>
  );
}
