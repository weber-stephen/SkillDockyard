import { ProductLink as Link } from "@/components/product-link";
import { BrandMark } from "@/components/brand-mark";
import { CURRENT_PRIVACY_VERSION } from "@/lib/legal-documents";

export function PublicDocument({ title, intro, children, lastUpdated = CURRENT_PRIVACY_VERSION }: { title: string; intro: string; children: React.ReactNode; lastUpdated?: string }) {
  return <main className="mx-auto min-h-screen max-w-3xl px-5 py-10 sm:px-8 sm:py-16"><BrandMark compact /><article className="mt-12 rounded-md border border-border bg-panel p-6 shadow-sm sm:p-10"><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Last updated {lastUpdated}</p><h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1><p className="mt-5 text-lg leading-8 text-muted-foreground">{intro}</p><div className="mt-10 space-y-8 text-sm leading-7 text-foreground [&_h2]:text-xl [&_h2]:font-bold [&_p]:mt-2 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5">{children}</div></article><nav aria-label="Legal and support" className="flex flex-wrap gap-5 py-8 text-sm font-semibold text-muted-foreground"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/support">Support</Link></nav></main>;
}
