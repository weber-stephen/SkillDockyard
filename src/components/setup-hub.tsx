"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Check, FileSearch, Send, Sparkles, Terminal, X } from "lucide-react";
import { ProductLink as Link } from "@/components/product-link";
import { Button } from "@/components/ui/button";
import type { OnboardingPath, OnboardingState } from "@/lib/onboarding";

const paths: Array<{ id: OnboardingPath; title: string; body: string; bestFor: string; action: string; href: string; icon: typeof Send }> = [
  { id: "starter", title: "Start with examples", body: "Add three useful, editable skills to your private library.", bestFor: "Best if you want to see what a good skill looks like before writing your own.", action: "Add starter skills", href: "#starter", icon: Sparkles },
  { id: "share", title: "Add a skill manually", body: "Save a workflow from a file, document, or chat.", bestFor: "Best if the skill is not already installed on this computer.", action: "Add a new skill", href: "/submit", icon: Send },
  { id: "scan", title: "Import installed skills", body: "Bring in skills already installed in Codex or Claude Code.", bestFor: "Best if you already use Codex or Claude Code. Requires one Terminal command.", action: "Import my skills", href: "#scanner", icon: FileSearch }
];

export function SetupHub({ initialState, hasArtifacts, artifactCount = hasArtifacts ? 1 : 0, compact = false }: { initialState: OnboardingState; hasArtifacts: boolean; artifactCount?: number; compact?: boolean }) {
  const [state, setState] = useState(initialState);
  const [busy, setBusy] = useState<OnboardingPath | null>(null);
  const [dismissed, setDismissed] = useState(initialState.dismissedAt !== null);
  const [showScanner, setShowScanner] = useState(initialState.selectedPath === "scan");
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
    <section className="grid gap-px overflow-hidden border border-border bg-border lg:grid-cols-3" aria-label="Choose a setup path">{paths.map((path) => { const Icon = path.icon; const selected = state.selectedPath === path.id; const done = (path.id === "share" && state.firstSubmissionAt) || (path.id === "starter" && state.firstStarterAt) || (path.id === "scan" && state.firstScanAt); return <article key={path.id} className="flex min-h-80 flex-col bg-panel p-6"><div className="flex items-center justify-between"><Icon className="h-5 w-5 text-primary" />{done ? <span className="inline-flex items-center gap-1 text-xs font-bold text-primary"><Check className="h-3.5 w-3.5" />Complete</span> : null}</div><h2 className="mt-8 text-2xl font-black">{path.title}</h2><p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">{path.body}</p><p className="mt-4 max-w-sm text-xs font-semibold leading-5 text-foreground/80">{path.bestFor}</p><div className="mt-auto pt-7">{path.id === "starter" ? <Button variant={selected ? "default" : "outline"} onClick={() => void addStarterSkills()} disabled={busy === "starter"}>{busy === "starter" ? "Adding…" : path.action}<ArrowRight className="h-4 w-4" /></Button> : path.id === "scan" ? <Button variant={showScanner || selected ? "default" : "outline"} onClick={() => { setShowScanner(true); void select(path.id); requestAnimationFrame(() => document.getElementById("scanner")?.scrollIntoView({ behavior: "smooth", block: "start" })); }} disabled={busy === path.id}>{path.action}<ArrowRight className="h-4 w-4" /></Button> : <Button asChild variant={selected ? "default" : "outline"} onClick={() => void select(path.id)}><Link href={path.href}>{path.action}<ArrowRight className="h-4 w-4" /></Link></Button>}</div></article>; })}</section>
    {starterMessage ? <p role="status" className="border border-primary/25 bg-primary/[0.055] p-4 text-sm font-semibold">{starterMessage} <Link href="/artifacts" className="text-primary underline underline-offset-4">Open your library</Link></p> : null}
    {showScanner ? <ScannerSetup /> : null}
  </div>;
}

function ScannerSetup() {
  const [pairingCode, setPairingCode] = useState<string | null>(null); const [message, setMessage] = useState<string | null>(null); const [loading, setLoading] = useState(false); const [copied, setCopied] = useState(false); const [origin, setOrigin] = useState("https://your-skill-dockyard");
  useEffect(() => setOrigin(window.location.origin), []);
  const command = `npx skill-dockyard connect --endpoint ${origin} --code ${pairingCode}\nnpx skill-dockyard import`;
  async function createToken() { setLoading(true); setMessage(null); try { const res = await fetch("/api/cli/pairing-codes", { method: "POST" }); const data = await res.json(); if (!res.ok) throw new Error(data.error); setPairingCode(data.code); } catch (error) { setMessage(error instanceof Error ? error.message : "Could not create a pairing code."); } finally { setLoading(false); } }
  async function copyCommand() { try { await navigator.clipboard.writeText(command); setCopied(true); } catch { setMessage("Could not copy the command. Select and copy it from the box instead."); } }
  return <section id="scanner" className="grid scroll-mt-6 gap-6 border border-border bg-panel p-6 lg:grid-cols-[0.8fr_1.2fr]"><div><div className="flex items-center gap-2 text-primary"><Terminal className="h-4 w-4" /><span className="text-xs font-bold uppercase tracking-[0.16em]">Import existing skills</span></div><h2 className="mt-4 text-2xl font-black">Bring your Codex and Claude skills into this library.</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">The importer checks only the standard skill folders and uploads the skill instructions it finds.</p><div className="mt-6 border-l-2 border-primary pl-4"><p className="text-sm font-bold">Step 1 of 3 — Pair this computer</p><p className="mt-1 text-xs leading-5 text-muted-foreground">The one-time code expires after 10 minutes. You can revoke the connected CLI later.</p></div><Button className="mt-4" onClick={createToken} disabled={loading}>{loading ? "Creating pairing code…" : "Create pairing code"}</Button>{message ? <p className="mt-3 text-sm text-destructive">{message}</p> : null}</div><div className="min-w-0">{pairingCode ? <><p className="text-sm font-bold">Step 2 of 3 — Run these commands in Terminal</p><p className="mt-2 text-sm leading-6 text-muted-foreground">The first command connects this computer. The second imports installed skills.</p><pre className="mt-3 overflow-x-auto border border-border bg-background p-4 text-xs leading-6"><code>{command}</code></pre><Button className="mt-3" variant="outline" size="sm" onClick={() => void copyCommand()}>{copied ? "Commands copied" : "Copy commands"}</Button><p className="mt-3 border border-primary/25 bg-primary/[0.055] p-3 text-sm leading-6">Keep the pairing code private. It works once and expires after 10 minutes.</p><div className="mt-5 border-t border-border pt-5"><p className="text-sm font-bold">Step 3 of 3 — Check your library</p><p className="mt-1 text-sm leading-6 text-muted-foreground">After the import finishes, refresh this page.</p><Button className="mt-3" variant="outline" onClick={() => window.location.reload()}>Refresh setup</Button></div></> : <div className="border border-dashed border-border bg-background p-5"><p className="text-sm font-bold">No repository clone required</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Create a pairing code and run two short commands from any Terminal window.</p></div>}</div></section>;
}
