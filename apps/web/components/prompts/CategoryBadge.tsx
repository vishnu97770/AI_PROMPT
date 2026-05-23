import { cn } from "@/lib/utils";
import { CATEGORY_MAP } from "@/lib/constants";

interface CategoryBadgeProps {
  slug: string;
  className?: string;
  showIcon?: boolean;
}

export function CategoryBadge({ slug, className, showIcon = true }: CategoryBadgeProps) {
  const cat = CATEGORY_MAP[slug];
  if (!cat) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
        cat.colorClass,
        className
      )}
    >
      {showIcon && <span className="leading-none">{cat.icon}</span>}
      {cat.shortName}
    </span>
  );
}
