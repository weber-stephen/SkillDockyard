"use client";

import { useState } from "react";
import { ArrowRight, Check, FileSearch, Send, Sparkles, X } from "lucide-react";
import { ProductLink as Link } from "@/components/product-link";
import { Button } from "@/components/ui/button";
import type { OnboardingPath, OnboardingState } from "@/lib/onboarding";

const paths: Array<{ id: OnboardingPath; title: string; body: string; bestFor: string; action: string; href: string; icon: typeof Send }> = [
  { id: "starter", title: "Start with examples", body: "Add three useful, editable skills to your private library.", bestFor: "Best if you want to see what a good skill looks like before writing your own.", action: "Add starter skills", href: "#starter", icon: Sparkles },
  { id: "share", title: "Add a skill manually", body: "Save a workflow from a file, document, or chat.", bestFor: "Best if the skill is not already installed on this computer.", action: "Add a new skill", href: "/submit", icon: Send },
  { id: "scan", title: "Import skills", body: "Bring in skills already installed in Codex or Claude Code.", bestFor: "Best if you have a skill folder or ZIP file from this computer.", action: "Import my skills", href: "/import", icon: FileSearch }
];

export function SetupHub({ initialState, hasArtifacts, artifactCount = hasArtifacts ? 1 : 0, compact = false }: { initialState: OnboardingState; hasArtifacts: boolean; artifactCount?: number; compact?: boolean }) {
  const [state, setState] = useState(initialState);
  const [busy, setBusy] = useState<OnboardingPath | null>(null);
  const [dismissed, setDismissed] = useState(initialState.dismissedAt !== null);
  const [starterMessage, setStarterMessage] = useState<string | null>(null);
  const completed = Boolean(state.firstSubmissionAt || state.firstScanAt || hasArtifacts);

  async function select(path: OnboardingPath) {
    setBusy(path);
    try {
      const response = await fetch("/api/onboarding", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path }) });
      if (response.ok) setState(await response.json());
    } finally { setBusy(null); }
  }

  async function dismiss() {
    setDismissed(true);
    await fetch("/api/onboarding", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dismissed: true }) });
  }

  async function addStarterSkills() {
    setBusy("starter");
    setStarterMessage(null);
    try {
      await select("starter");
      const response = await fetch("/api/starter-skills", { method: "POST" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Starter skills could not be added.");
      setStarterMessage(body.created?.length ? `Added ${body.created.length} starter skills to your private library.` : "Your starter skills are already in the library.");
    } catch (error) {
      setStarterMessage(error instanceof Error ? error.message : "Starter skills could not be added.");
    } finally {
      setBusy(null);
    }
  }

  if (dismissed) return null;
  if (compact) return <section className="flex flex-col gap-4 border border-primary/25 bg-primary/[0.055] px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Library setup</p><p className="mt-1 text-sm font-semibold">{completed ? "Your first outcome is complete. Keep building your private library." : "Choose one practical way to start your library."}</p></div><div className="flex gap-2"><Button asChild size="sm" variant="outline"><Link href="/getting-started">Open setup</Link></Button><Button size="sm" variant="ghost" onClick={dismiss} aria-label="Dismiss library setup"><X className="h-4 w-4" /></Button></div></section>;

  return <div className="space-y-8">
    <section className="border-b border-border pb-8"><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{completed ? "Your private library" : "Set up your library"}</p><h1 className="mt-4 max-w-3xl text-4xl font-black leading-[0.95] sm:text-6xl">{completed ? artifactCount ? "Your first skill is in your library." : "Your import is complete." : "Add your first skill."}</h1><p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">{completed ? artifactCount ? `Your library contains ${artifactCount} ${artifactCount === 1 ? "skill" : "skills"}. Add another whenever you are ready; everything stays private until you choose to publish it.` : "No skills were found this time. You can add one manually or try another import whenever you are ready." : "Choose the easiest way to start. Everything in your library stays private until you choose to publish it."}</p></section>
    <section className="grid gap-px overflow-hidden border border-border bg-border lg:grid-cols-3" aria-label="Choose a setup path">{paths.map((path) => { const Icon = path.icon; const selected = state.selectedPath === path.id; const done = (path.id === "share" && state.firstSubmissionAt) || (path.id === "starter" && state.firstStarterAt) || (path.id === "scan" && state.firstScanAt); return <article key={path.id} className="flex min-h-80 flex-col bg-panel p-6"><div className="flex items-center justify-between"><Icon className="h-5 w-5 text-primary" />{done ? <span className="inline-flex items-center gap-1 text-xs font-bold text-primary"><Check className="h-3.5 w-3.5" />Complete</span> : null}</div><h2 className="mt-8 text-2xl font-black">{path.title}</h2><p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">{path.body}</p><p className="mt-4 max-w-sm text-xs font-semibold leading-5 text-foreground/80">{path.bestFor}</p><div className="mt-auto pt-7">{path.id === "starter" ? <Button variant={selected ? "default" : "outline"} onClick={() => void addStarterSkills()} disabled={busy === "starter"}>{busy === "starter" ? "Adding…" : path.action}<ArrowRight className="h-4 w-4" /></Button> : <Button asChild variant={selected ? "default" : "outline"} onClick={() => void select(path.id)}><Link href={path.href}>{path.action}<ArrowRight className="h-4 w-4" /></Link></Button>}</div></article>; })}</section>
    {starterMessage ? <p role="status" className="border border-primary/25 bg-primary/[0.055] p-4 text-sm font-semibold">{starterMessage} <Link href="/artifacts" className="text-primary underline underline-offset-4">Open your library</Link></p> : null}
  </div>;
}
