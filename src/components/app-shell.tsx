"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { Bell, Boxes, ClipboardList, FileDown, GitMerge, Inbox, Menu, Send, Settings2, ShieldCheck, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ProductLink as Link } from "@/components/product-link";
import { AuthMenu } from "@/components/auth-menu";
import { BrandMark } from "@/components/brand-mark";
import type { AppNavigationState } from "@/lib/navigation";

const defaultNavigation: AppNavigationState = { canReview: true, pendingReviewCount: 0, pendingInviteCount: 0, unreadNotificationCount: 0, workspaceName: null };

export function AppShell({ children, mode, email, navigation = defaultNavigation }: { children: React.ReactNode; mode: "app" | "demo"; email?: string; navigation?: AppNavigationState }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return <div className="app-shell min-h-screen bg-background text-foreground">
    <aside className="app-sidebar fixed inset-y-0 left-0 hidden w-64 overflow-y-auto border-r border-border bg-panel/85 px-4 py-5 backdrop-blur lg:block"><Brand /><SidebarContent mode={mode} navigation={navigation} /></aside>
    <main className="app-main lg:pl-64"><TopBar mode={mode} email={email} navigation={navigation} onOpenMenu={() => setMenuOpen(true)} /><div className="app-content mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-10">{children}</div></main>
    {menuOpen ? <div className="fixed inset-0 z-50 lg:hidden"><button className="absolute inset-0 bg-foreground/20" aria-label="Close navigation" onClick={() => setMenuOpen(false)} /><section className="relative h-full w-[min(18rem,85vw)] overflow-y-auto border-r border-border bg-panel px-4 py-5 shadow-xl"><div className="mb-8 flex items-center justify-between"><Brand compact onNavigate={() => setMenuOpen(false)} /><button type="button" className="grid h-9 w-9 place-items-center rounded-md hover:bg-muted" onClick={() => setMenuOpen(false)} aria-label="Close navigation"><X className="h-5 w-5" /></button></div><SidebarContent mode={mode} navigation={navigation} onNavigate={() => setMenuOpen(false)} /></section></div> : null}
  </div>;
}

function Brand({ compact = false, onNavigate }: { compact?: boolean; onNavigate?: () => void }) {
  return <BrandMark compact={compact} onNavigate={onNavigate} className={compact ? "" : "mb-8"} />;
}

function SidebarContent({ mode, navigation, onNavigate }: { mode: "app" | "demo"; navigation: AppNavigationState; onNavigate?: () => void }) {
  const pathname = usePathname();
  const showReview = mode === "demo" || navigation.canReview;
  const sections: Array<{ label: string; items: Array<{ href: string; label: string; icon: LucideIcon; count?: number; activeAliases?: string[] }> }> = [
    { label: "Workspace", items: [{ href: "/", label: "Overview", icon: Boxes }, { href: "/artifacts", label: "Skills", icon: GitMerge, activeAliases: ["/import"] }] },
    { label: "Work", items: [{ href: "/submissions", label: "My submissions", icon: ClipboardList }, ...(showReview ? [{ href: "/review-queue", label: "Submissions to review", icon: ShieldCheck, count: navigation.pendingReviewCount }] : [])] },
    { label: "Access", items: [{ href: "/invites", label: "Invitations", icon: Inbox, count: navigation.pendingInviteCount }] }
  ];
  return <div className="sidebar-content space-y-7"><Link href="/submit" onClick={onNavigate} className="sidebar-primary-action flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Send className="h-4 w-4" />Add skill</Link><nav aria-label="Primary navigation" className="primary-navigation space-y-6">{sections.map((section) => <div className="nav-section" key={section.label}><h2 className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{section.label}</h2><div className="nav-items space-y-1">{section.items.map((item) => <NavigationLink key={item.href} {...item} pathname={pathname} onNavigate={onNavigate} />)}</div></div>)}</nav><div className="mobile-utilities border-t border-border pt-6 lg:hidden"><h2 className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Workspace</h2><div className="space-y-1"><NavigationLink href="/settings" label="Workspace settings" icon={Settings2} pathname={pathname} onNavigate={onNavigate} /><NavigationLink href="/exports" label="Export skill list" icon={FileDown} pathname={pathname} onNavigate={onNavigate} /></div></div></div>;
}

function NavigationLink({ href, label, icon: Icon, count = 0, pathname, onNavigate, activeAliases = [] }: { href: string; label: string; icon: LucideIcon; count?: number; pathname: string; onNavigate?: () => void; activeAliases?: string[] }) {
  const prefix = pathname.startsWith("/demo") ? "/demo" : pathname.startsWith("/app") ? "/app" : "";
  const target = `${prefix}${href === "/" ? "" : href}` || "/";
  const active = href === "/" ? pathname === prefix || pathname === `${prefix}/` : pathname === target || pathname.startsWith(`${target}/`) || activeAliases.some((alias) => pathname === `${prefix}${alias}` || pathname.startsWith(`${prefix}${alias}/`));
  return <Link href={href} onClick={onNavigate} aria-current={active ? "page" : undefined} className={`flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}><Icon className="h-4 w-4" /> <span className="min-w-0 flex-1">{label}</span>{count > 0 ? <span className="min-w-5 rounded-full bg-attention px-1.5 py-0.5 text-center text-[11px] font-bold text-foreground" aria-label={`${count} pending`}>{count > 99 ? "99+" : count}</span> : null}</Link>;
}

function TopBar({ mode, email, navigation, onOpenMenu }: { mode: "app" | "demo"; email?: string; navigation: AppNavigationState; onOpenMenu: () => void }) {
  return <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6 lg:px-10"><div className="flex items-center gap-3"><button type="button" className="grid h-10 w-10 place-items-center rounded-md border border-border lg:hidden" onClick={onOpenMenu} aria-label="Open navigation"><Menu className="h-5 w-5" /></button><div><span className="block text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">{mode === "demo" ? "Interactive demo" : navigation.workspaceName ?? "Private workspace"}</span>{mode === "demo" ? <span className="block text-xs text-muted-foreground">Changes are saved only in this browser.</span> : null}</div></div><div className="flex items-center gap-3"><Link href="/notifications" aria-label={navigation.unreadNotificationCount ? `${navigation.unreadNotificationCount} unread notifications` : "Notifications"} className="relative grid h-10 w-10 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Bell className="h-4 w-4" />{navigation.unreadNotificationCount > 0 ? <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-attention" aria-hidden="true" /> : null}</Link><div className="hidden items-center gap-1 lg:flex"><Link href="/settings" className="inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Settings2 className="h-4 w-4" />Workspace settings</Link><Link href="/exports" className="inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><FileDown className="h-4 w-4" />Export skill list</Link></div>{mode === "demo" ? <a className="text-sm font-bold text-primary underline underline-offset-4" href="/signup">Create a workspace</a> : email ? <AuthMenu email={email} /> : null}</div></div>;
}
