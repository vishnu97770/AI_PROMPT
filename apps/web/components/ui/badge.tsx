import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-primary/15 text-primary border border-primary/20 hover:bg-primary/20",
        secondary:
          "bg-secondary text-secondary-foreground border border-border hover:bg-secondary/80",
        destructive:
          "bg-destructive/15 text-destructive border border-destructive/20 hover:bg-destructive/20",
        outline:
          "border border-border text-foreground hover:bg-accent",
        success:
          "bg-green-500/15 text-green-500 border border-green-500/20",
        warning:
          "bg-yellow-500/15 text-yellow-500 border border-yellow-500/20",
        // Plan badges
        FREE:
          "bg-muted text-muted-foreground border border-border",
        PRO:
          "bg-primary/15 text-primary border border-primary/30",
        CREATOR:
          "bg-violet-500/15 text-violet-400 border border-violet-500/30",
        ENTERPRISE:
          "bg-amber-500/15 text-amber-400 border border-amber-500/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
