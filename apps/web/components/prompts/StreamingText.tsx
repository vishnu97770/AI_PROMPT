"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface StreamingTextProps {
  text: string;
  isStreaming: boolean;
  className?: string;
}

export function StreamingText({ text, isStreaming, className }: StreamingTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom as text streams in
  useEffect(() => {
    if (isStreaming && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [text, isStreaming]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "overflow-y-auto whitespace-pre-wrap break-words text-sm leading-relaxed",
        className
      )}
    >
      {text}
      {isStreaming && (
        <span className="inline-block w-[2px] h-[1em] bg-primary ml-0.5 align-middle animate-[blink_1s_step-start_infinite]" />
      )}
    </div>
  );
}
