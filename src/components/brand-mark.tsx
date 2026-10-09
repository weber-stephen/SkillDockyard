import { ProductLink as Link } from "@/components/product-link";
import { cn } from "@/lib/utils";

type BrandMarkProps = {
  compact?: boolean;
  className?: string;
  onNavigate?: () => void;
};

export function BrandMark({ compact = false, className, onNavigate }: BrandMarkProps) {
  const markSize = compact ? "h-[18px] w-[18px]" : "h-5 w-5";

  return (
    <Link href="/" onClick={onNavigate} className={cn("brand-mark flex min-h-11 min-w-0 items-center gap-3 font-bold tracking-[-0.01em]", className)}>
      <span className={cn("brand-symbol grid shrink-0 place-items-center rounded-sm bg-primary text-primary-foreground", compact ? "h-9 w-9" : "h-10 w-10")}>
        <svg className={markSize} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="4" r="1.8" fill="currentColor" />
          <path d="M12 6.8v11.35M5 12.5h14M5 12.5v1.1a7 7 0 0 0 14 0v-1.1" stroke="currentColor" strokeWidth="2.35" strokeLinecap="square" strokeLinejoin="miter" />
          <path d="M5 12.5 2.8 10.3M19 12.5l2.2-2.2" stroke="currentColor" strokeWidth="2.35" strokeLinecap="square" />
        </svg>
      </span>
      {compact ? (
        <span className="truncate text-base font-black">Skill Dockyard</span>
      ) : (
        <span className="min-w-0 leading-none">
          <span className="eyebrow block">Skill</span>
          <span className="block text-lg font-black">Dockyard</span>
        </span>
      )}
    </Link>
  );
}
