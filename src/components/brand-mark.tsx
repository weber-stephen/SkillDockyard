import { Anchor } from "lucide-react";
import { ProductLink as Link } from "@/components/product-link";
import { cn } from "@/lib/utils";

type BrandMarkProps = {
  compact?: boolean;
  className?: string;
  onNavigate?: () => void;
};

export function BrandMark({ compact = false, className, onNavigate }: BrandMarkProps) {
  return (
    <Link href="/" onClick={onNavigate} className={cn("brand-mark flex min-h-11 min-w-0 items-center gap-3 font-bold tracking-[-0.01em]", className)}>
      <span className={cn("brand-symbol grid shrink-0 place-items-center rounded-sm bg-primary text-primary-foreground", compact ? "h-9 w-9" : "h-10 w-10")}>
        <Anchor className={compact ? "h-4 w-4" : "h-5 w-5"} aria-hidden="true" />
      </span>
      {compact ? (
        <span className="truncate text-base font-black">Skill Dockyard</span>
      ) : (
        <span className="min-w-0 leading-none">
          <span className="block text-[11px] font-bold uppercase tracking-[0.18em]">Skill</span>
          <span className="block text-lg font-black">Dockyard</span>
        </span>
      )}
    </Link>
  );
}
