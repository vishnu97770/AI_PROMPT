import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Show a character counter when maxLength is provided */
  showCount?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, showCount, maxLength, value, onChange, ...props }, ref) => {
    const [count, setCount] = React.useState(
      typeof value === "string" ? value.length : 0
    );

    function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
      setCount(e.target.value.length);
      onChange?.(e);
    }

    return (
      <div className="relative">
        <textarea
          ref={ref}
          maxLength={maxLength}
          value={value}
          onChange={showCount ? handleChange : onChange}
          className={cn(
            "flex min-h-[80px] w-full rounded-lg border border-input bg-card px-3 py-2 text-sm",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "resize-y transition-colors",
            showCount && maxLength && "pb-6",
            className
          )}
          {...props}
        />
        {showCount && maxLength && (
          <span
            className={cn(
              "absolute bottom-2 right-3 text-[11px] tabular-nums",
              count / maxLength > 0.9
                ? "text-destructive"
                : "text-muted-foreground"
            )}
          >
            {count}/{maxLength}
          </span>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
