"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  /** Show percentage label */
  showLabel?: boolean;
  /** Optional indicator colour override (Tailwind bg-* class) */
  indicatorClassName?: string;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, showLabel, indicatorClassName, ...props }, ref) => (
  <div className={cn("flex items-center gap-3", className)}>
    <ProgressPrimitive.Root
      ref={ref}
      className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary"
      value={value}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          "h-full w-full flex-1 bg-primary transition-all duration-500 ease-in-out rounded-full",
          indicatorClassName
        )}
        style={{ transform: `translateX(-${100 - (value ?? 0)}%)` }}
      />
    </ProgressPrimitive.Root>
    {showLabel && (
      <span className="shrink-0 text-xs tabular-nums text-muted-foreground w-8 text-right">
        {Math.round(value ?? 0)}%
      </span>
    )}
  </div>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
