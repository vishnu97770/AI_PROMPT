"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { copyToClipboard } from "@/lib/utils";
import type { GenerateResponse } from "@promptcraft/types";

interface ToolVariantTabsProps {
  result: GenerateResponse;
  className?: string;
}

const TABS = [
  { id: "main",             label: "Main" },
  { id: "midjourney",       label: "Midjourney" },
  { id: "dalle",            label: "DALL·E 3" },
  { id: "stable_diffusion", label: "Stable Diffusion" },
  { id: "chatgpt",          label: "ChatGPT" },
] as const;

type TabId = typeof TABS[number]["id"];

function getContent(result: GenerateResponse, tab: TabId): string {
  const main = result.generatedPrompt;
  switch (tab) {
    case "main":             return main;
    case "midjourney":       return result.toolVariants?.midjourney       ?? main;
    case "dalle":            return result.toolVariants?.dalle             ?? main;
    case "stable_diffusion": return result.toolVariants?.stable_diffusion  ?? main;
    case "chatgpt":
      return `Please use the following as your complete creative brief:\n\n${main}`;
  }
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className={cn(
        "h-7 gap-1.5 text-xs transition-colors",
        copied ? "text-green-500" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied!" : "Copy"}
    </Button>
  );
}

export function ToolVariantTabs({ result, className }: ToolVariantTabsProps) {
  return (
    <Tabs defaultValue="main" className={cn("w-full", className)}>
      <div className="flex items-center justify-between mb-2">
        <TabsList variant="underline" className="gap-0 overflow-x-auto w-full justify-start">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} variant="underline" className="shrink-0 text-xs">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {TABS.map((tab) => {
        const content = getContent(result, tab.id);
        return (
          <TabsContent key={tab.id} value={tab.id}>
            <div className="relative rounded-xl border border-border bg-muted/40 p-4">
              <div className="absolute right-2 top-2">
                <CopyButton text={content} />
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap pr-16 text-foreground/90 font-mono">
                {content}
              </p>
            </div>
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
