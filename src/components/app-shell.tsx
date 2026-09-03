"use client";

import { useState } from "react";
import { Anchor, Boxes, Compass, FileDown, Inbox, Menu, Send, Settings2, X } from "lucide-react";
import { ProductLink as Link } from "@/components/product-link";
import { AuthMenu } from "@/components/auth-menu";

const nav = [
  { href: "/", label: "Dashboard", icon: Boxes },
  { href: "/getting-started", label: "Set up your library", icon: Compass },
  { href: "/artifacts", label: "Skills", icon: Anchor },
  { href: "/invites", label: "Invites", icon: Inbox },
  { href: "/submit", label: "Submit Skill", icon: Send },
  { href: "/exports", label: "Exports", icon: FileDown },
  { href: "/settings/repos", label: "Settings", icon: Settings2 }
] as const;

function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  return <nav className="space-y-1">{nav.map((item) => <Link key={item.href} href={item.href} onClick={onNavigate} className="flex h-10 items-center gap-3 rounded-md px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"><item.icon className="h-4 w-4" />{item.label}</Link>)}</nav>;
}

export function AppShell({ children, mode, email }: { children: React.ReactNode; mode: "app" | "demo"; email?: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return <div className="min-h-screen bg-background text-foreground">
    <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-panel/85 px-4 py-5 backdrop-blur lg:block"><Link href="/" className="mb-10 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-md bg-primary text-white"><Anchor className="h-5 w-5" /></span><span><span className="block text-sm font-bold uppercase tracking-[0.18em]">Skill</span><span className="block text-lg font-black leading-none">Dockyard</span></span></Link><Navigation /></aside>
    <main className="lg:pl-64"><div className="flex min-h-16 items-center justify-between border-b border-border px-4 sm:px-6 lg:px-10"><div className="flex items-center gap-3"><button type="button" className="grid h-10 w-10 place-items-center rounded-md border border-border lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu className="h-5 w-5" /></button><span className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">{mode === "demo" ? "Interactive demo" : "Private workspace"}</span></div>{mode === "demo" ? <a className="text-sm font-bold text-primary underline underline-offset-4" href="/signup">Create workspace</a> : email ? <AuthMenu email={email} /> : null}</div><div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-10">{children}</div></main>
    {menuOpen ? <div className="fixed inset-0 z-50 lg:hidden"><button className="absolute inset-0 bg-foreground/20" aria-label="Close navigation" onClick={() => setMenuOpen(false)} /><section className="relative h-full w-[min(18rem,85vw)] border-r border-border bg-panel px-4 py-5 shadow-xl"><div className="mb-8 flex items-center justify-between"><Link href="/" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 font-black"><span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-white"><Anchor className="h-4 w-4" /></span>Skill Dockyard</Link><button type="button" className="grid h-9 w-9 place-items-center rounded-md hover:bg-muted" onClick={() => setMenuOpen(false)} aria-label="Close navigation"><X className="h-5 w-5" /></button></div><Navigation onNavigate={() => setMenuOpen(false)} /></section></div> : null}
  </div>;
}
