"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { Bell, Boxes, ClipboardList, FileDown, GitMerge, Inbox, Menu, Send, Settings2, ShieldCheck, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ProductLink as Link } from "@/components/product-link";
import { AuthMenu } from "@/components/auth-menu";
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
  return <Link href="/" onClick={onNavigate} className="brand-mark mb-8 flex items-center gap-3"><span className={`brand-symbol grid place-items-center rounded-md bg-primary text-white ${compact ? "h-9 w-9" : "h-10 w-10"}`}><GitMerge className={compact ? "h-4 w-4" : "h-5 w-5"} /></span>{compact ? <span className="font-black">Skill Dockyard</span> : <span><span className="block text-sm font-bold uppercase tracking-[0.18em]">Skill</span><span className="block text-lg font-black leading-none">Dockyard</span></span>}</Link>;
}

function SidebarContent({ mode, navigation, onNavigate }: { mode: "app" | "demo"; navigation: AppNavigationState; onNavigate?: () => void }) {
  const pathname = usePathname();
  const showReview = mode === "demo" || navigation.canReview;
  const sections: Array<{ label: string; items: Array<{ href: string; label: string; icon: LucideIcon; count?: number }> }> = [
    { label: "Workspace", items: [{ href: "/", label: "Overview", icon: Boxes }, { href: "/artifacts", label: "Skills", icon: GitMerge }] },
    { label: "Work", items: [{ href: "/submissions", label: "My submissions", icon: ClipboardList }, ...(showReview ? [{ href: "/review-queue", label: "Submissions to review", icon: ShieldCheck, count: navigation.pendingReviewCount }] : [])] },
    { label: "Access", items: [{ href: "/invites", label: "Invitations", icon: Inbox, count: navigation.pendingInviteCount }] },
    { label: "Administration", items: [{ href: "/settings", label: "Workspace settings", icon: Settings2 }, { href: "/exports", label: "Export skill list", icon: FileDown }] }
  ];
  return <div className="sidebar-content space-y-7"><Link href="/submit" onClick={onNavigate} className="sidebar-primary-action flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Send className="h-4 w-4" />Add skill</Link><nav aria-label="Primary navigation" className="primary-navigation space-y-6">{sections.map((section) => <div className="nav-section" key={section.label}><h2 className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{section.label}</h2><div className="nav-items space-y-1">{section.items.map((item) => <NavigationLink key={item.href} {...item} pathname={pathname} onNavigate={onNavigate} />)}</div></div>)}</nav></div>;
}

function NavigationLink({ href, label, icon: Icon, count = 0, pathname, onNavigate }: { href: string; label: string; icon: LucideIcon; count?: number; pathname: string; onNavigate?: () => void }) {
  const prefix = pathname.startsWith("/demo") ? "/demo" : pathname.startsWith("/app") ? "/app" : "";
  const target = `${prefix}${href === "/" ? "" : href}` || "/";
  const active = href === "/" ? pathname === prefix || pathname === `${prefix}/` : pathname === target || pathname.startsWith(`${target}/`);
  return <Link href={href} onClick={onNavigate} aria-current={active ? "page" : undefined} className={`flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}><Icon className="h-4 w-4" /> <span className="min-w-0 flex-1">{label}</span>{count > 0 ? <span className="min-w-5 rounded-full bg-primary px-1.5 py-0.5 text-center text-[11px] font-bold text-white" aria-label={`${count} pending`}>{count > 99 ? "99+" : count}</span> : null}</Link>;
}

function TopBar({ mode, email, navigation, onOpenMenu }: { mode: "app" | "demo"; email?: string; navigation: AppNavigationState; onOpenMenu: () => void }) {
  return <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6 lg:px-10"><div className="flex items-center gap-3"><button type="button" className="grid h-10 w-10 place-items-center rounded-md border border-border lg:hidden" onClick={onOpenMenu} aria-label="Open navigation"><Menu className="h-5 w-5" /></button><div><span className="block text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">{mode === "demo" ? "Interactive demo" : navigation.workspaceName ?? "Private workspace"}</span>{mode === "demo" ? <span className="block text-xs text-muted-foreground">Changes are saved only in this browser.</span> : null}</div></div><div className="flex items-center gap-3"><Link href="/notifications" aria-label={navigation.unreadNotificationCount ? `${navigation.unreadNotificationCount} unread notifications` : "Notifications"} className="relative grid h-10 w-10 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Bell className="h-4 w-4" />{navigation.unreadNotificationCount > 0 ? <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" aria-hidden="true" /> : null}</Link>{mode === "demo" ? <a className="text-sm font-bold text-primary underline underline-offset-4" href="/signup">Create a workspace</a> : email ? <AuthMenu email={email} /> : null}</div></div>;
}
