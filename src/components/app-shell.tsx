import Link from "next/link";
import { Anchor, Boxes, Compass, FileDown, Settings2 } from "lucide-react";

const nav = [
  { href: "/", label: "Dashboard", icon: Boxes },
  { href: "/getting-started", label: "Getting Started", icon: Compass },
  { href: "/artifacts", label: "Artifacts", icon: Anchor },
  { href: "/exports", label: "Exports", icon: FileDown },
  { href: "/settings/repos", label: "Settings", icon: Settings2 }
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-panel/85 px-4 py-5 backdrop-blur lg:block">
        <Link href="/" className="mb-10 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-primary text-white">
            <Anchor className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-bold uppercase tracking-[0.18em]">Skill</span>
            <span className="block text-lg font-black leading-none">Dockyard</span>
          </span>
        </Link>
        <nav className="space-y-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex h-10 items-center gap-3 rounded-md px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-10">{children}</div>
      </main>
    </div>
  );
}
