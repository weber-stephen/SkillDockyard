"use client";

import { useMemo, useRef, useState } from "react";
import { Archive, CheckCircle2, FileArchive, FolderOpen, ShieldAlert, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { parseBrowserImport, type BrowserImportCandidate } from "@/lib/browser-skill-files";
import { trackAnalyticsEvent } from "@/lib/analytics";
import { ProductLink as Link } from "@/components/product-link";

export function SkillImporter({ isDemo }: { isDemo: boolean }) {
  const folderInput = useRef<HTMLInputElement>(null);
  const zipInput = useRef<HTMLInputElement>(null);
  const [candidates, setCandidates] = useState<BrowserImportCandidate[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [warnings, setWarnings] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<"private" | "workspace">("private");
  const [summary, setSummary] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const selectedCandidates = useMemo(() => candidates.filter((candidate) => selected.has(candidate.id)), [candidates, selected]);

  async function choose(files: FileList | null) {
    if (!files?.length) return;
    setParsing(true); setError(null); setMessage(null);
    try {
      const result = await parseBrowserImport([...files]);
      setCandidates(result.candidates);
      setSelected(new Set(result.candidates.map((candidate) => candidate.id)));
      setWarnings(result.warnings);
      trackAnalyticsEvent("skill_import_started", { source: files.length === 1 && files[0].name.toLowerCase().endsWith(".zip") ? "zip" : "folder", discovered: result.candidates.length });
    } catch (caught) {
      setCandidates([]); setSelected(new Set()); setWarnings([]);
      setError(caught instanceof Error ? caught.message : "We could not read those files.");
      trackAnalyticsEvent("skill_import_failed", { phase: "parse" });
    } finally { setParsing(false); }
  }

  async function importSelected() {
    if (!selectedCandidates.length) return setError("Choose at least one skill to import.");
    if (visibility === "workspace" && !summary.trim()) return setError("Explain why these skills should be shared with your workspace.");
    setImporting(true); setError(null); setMessage(null);
    try {
      const response = await fetch("/api/imports/skills", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility, summary, skills: selectedCandidates.map((candidate) => ({ path: candidate.path, content: candidate.content })) })
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "We could not import these skills.");
      setMessage(visibility === "private" ? `${body.imported} skill${body.imported === 1 ? " was" : "s were"} saved as private draft${body.imported === 1 ? "" : "s"}.` : `${body.imported} skill${body.imported === 1 ? " was" : "s were"} submitted for review.`);
      trackAnalyticsEvent("skill_import_completed", { count: body.imported, visibility });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We could not import these skills.");
      trackAnalyticsEvent("skill_import_failed", { phase: "save" });
    } finally { setImporting(false); }
  }

  if (isDemo) return <div className="space-y-6"><section className="border border-border bg-panel p-6"><h2 className="text-xl font-black">Import from your computer</h2><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Browser import saves real skill instructions to your private workspace. Create a workspace to import files from this computer.</p><Button asChild className="mt-5"><a href="/signup">Create a workspace</a></Button></section><SkillLocationGuide /></div>;

  return <div className="space-y-6">
    <section className="grid gap-5 border border-border bg-panel p-5 md:grid-cols-[1fr_auto] md:items-center">
      <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">From this computer</p><h2 className="mt-2 text-2xl font-black">Choose a skill folder or ZIP file.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">We look for `SKILL.md` files, then let you choose exactly what to save. Nothing is uploaded until you confirm.</p></div>
      <div className="flex flex-wrap gap-2"><Button onClick={() => folderInput.current?.click()} disabled={parsing}><FolderOpen className="h-4 w-4" />{parsing ? "Reading files…" : "Choose folder"}</Button><Button variant="outline" onClick={() => zipInput.current?.click()} disabled={parsing}><FileArchive className="h-4 w-4" />Choose ZIP</Button></div>
      <input ref={folderInput} className="sr-only" type="file" multiple {...({ webkitdirectory: "", directory: "" } as Record<string, string>)} onChange={(event) => void choose(event.target.files)} />
      <input ref={zipInput} className="sr-only" type="file" accept=".zip,application/zip" onChange={(event) => void choose(event.target.files)} />
    </section>
    <SkillLocationGuide />
    {error ? <p role="alert" className="border border-destructive bg-destructive/10 p-3 text-sm font-semibold text-destructive">{error}</p> : null}
    {warnings.map((warning) => <p key={warning} className="flex gap-2 border border-primary/25 bg-primary/[0.055] p-3 text-sm leading-6"><Archive className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{warning}</p>)}
    {candidates.length ? <section className="border border-border bg-panel"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5"><div><h2 className="font-black">Review detected skills</h2><p className="mt-1 text-sm text-muted-foreground">Select the instructions you want to bring into Skill Dockyard.</p></div><Button variant="outline" size="sm" onClick={() => setSelected(selected.size === candidates.length ? new Set() : new Set(candidates.map((candidate) => candidate.id)))}>{selected.size === candidates.length ? "Clear selection" : "Select all"}</Button></div><div className="divide-y divide-border">{candidates.map((candidate) => <div key={candidate.id} className="p-5 hover:bg-muted/45"><label className="flex cursor-pointer gap-3"><input className="mt-1 h-4 w-4 accent-primary" type="checkbox" checked={selected.has(candidate.id)} onChange={() => setSelected((current) => { const next = new Set(current); if (next.has(candidate.id)) next.delete(candidate.id); else next.add(candidate.id); return next; })} /><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><span className="font-bold">{candidate.metadata.name}</span>{!candidate.supportingFiles.length ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary"><CheckCircle2 className="h-3.5 w-3.5" />Instructions only</span> : null}</span><span className="mt-1 block text-sm text-muted-foreground">{candidate.metadata.description || "No description found."}</span><span className="mt-2 block font-mono text-xs text-muted-foreground">{candidate.path}</span>{Boolean(candidate.metadata.tools.length || candidate.metadata.mcpServers.length) ? <span className="mt-2 block text-xs text-muted-foreground">{candidate.metadata.tools.length ? `Tools: ${candidate.metadata.tools.join(", ")}` : ""}{candidate.metadata.tools.length && candidate.metadata.mcpServers.length ? " · " : ""}{candidate.metadata.mcpServers.length ? `Connectors: ${candidate.metadata.mcpServers.join(", ")}` : ""}</span> : null}</span></label>{candidate.supportingFiles.length ? <div className="ml-7 mt-2"><SupportingFileGuidance count={candidate.supportingFiles.length} /></div> : null}</div>)}</div></section> : null}
    {selectedCandidates.length ? <section className="border border-border bg-panel p-5"><fieldset className="space-y-3"><legend className="text-sm font-bold">Where should these skills go?</legend><div className="grid gap-3 md:grid-cols-2"><Destination selected={visibility === "private"} onSelect={() => setVisibility("private")} title="Private drafts" body="Only you can see them until you submit each skill for review." /><Destination selected={visibility === "workspace"} onSelect={() => setVisibility("workspace")} title="Workspace review" body="Each selected skill becomes a submission awaiting review." /></div></fieldset>{visibility === "workspace" ? <label className="mt-5 block space-y-2"><span className="text-sm font-bold">Why should these skills be shared?</span><Textarea value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Example: These are the team’s tested workflows for campaign planning." /><span className="block text-xs text-muted-foreground">This one explanation is attached to each submission in this batch.</span></label> : null}<div className="mt-5 flex flex-wrap items-center gap-3"><Button onClick={() => void importSelected()} disabled={importing}><Upload className="h-4 w-4" />{importing ? "Importing…" : visibility === "private" ? `Save ${selectedCandidates.length} private draft${selectedCandidates.length === 1 ? "" : "s"}` : `Submit ${selectedCandidates.length} skill${selectedCandidates.length === 1 ? "" : "s"}`}</Button></div>{message ? <p role="status" className="mt-4 border border-primary/25 bg-primary/[0.055] p-3 text-sm font-semibold">{message} <Link href={visibility === "private" ? "/artifacts" : "/submissions"} className="text-primary underline underline-offset-4">View skills</Link></p> : null}</section> : null}
  </div>;
}

function Destination({ selected, onSelect, title, body }: { selected: boolean; onSelect: () => void; title: string; body: string }) { return <button type="button" onClick={onSelect} className={`border p-4 text-left transition-colors ${selected ? "border-primary bg-primary/[0.055]" : "border-border hover:bg-muted"}`}><span className="block font-bold">{title}</span><span className="mt-1 block text-sm leading-5 text-muted-foreground">{body}</span></button>; }

function SupportingFileGuidance({ count }: { count: number }) {
  return <details className="group relative"><summary title="Hover or select to learn how to prepare this skill for sharing." className="inline-flex cursor-pointer list-none items-center gap-1 text-xs font-semibold text-attention focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><ShieldAlert className="h-3.5 w-3.5" />{count} supporting file{count === 1 ? "" : "s"} not imported <span className="text-primary underline underline-offset-2">How to fix this</span></summary><div className="absolute left-0 top-6 z-10 hidden w-[min(22rem,calc(100vw-3rem))] border border-border bg-panel p-4 text-sm leading-6 text-foreground shadow-lg group-hover:block group-open:block"><p className="font-bold">Prepare this skill before sharing</p><p className="mt-1 text-muted-foreground">Skill Dockyard imported <code>SKILL.md</code> only. The other files stay on this computer.</p><ol className="mt-3 list-decimal space-y-1 pl-5 text-muted-foreground"><li>Check whether the files are required.</li><li>Add short instructions or examples to <code>SKILL.md</code>.</li><li>For separate files, move them to a shared, stable location and explain where to find them in <code>SKILL.md</code>.</li><li>Remove passwords, tokens, and private data.</li><li>Re-import the updated skill when it is ready.</li></ol><p className="mt-3 text-xs text-muted-foreground">Skill Dockyard does not yet store or install supporting files.</p></div></details>;
}

function SkillLocationGuide() {
  return <section aria-labelledby="skill-locations-heading" className="border border-border bg-panel p-5"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Need help finding them?</p><h2 id="skill-locations-heading" className="mt-2 text-xl font-black">Where to find installed skills</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Select the whole <code>skills</code> folder to find several skills at once. If the folder is not there, there may not be any skills installed for that tool yet.</p></div><div className="mt-5 grid gap-4 md:grid-cols-2"><SkillLocation tool="Codex" macPath="~/.codex/skills/" windowsPath={"%USERPROFILE%\\.codex\\skills\\"} /><SkillLocation tool="Claude Code" macPath="~/.claude/skills/" windowsPath={"%USERPROFILE%\\.claude\\skills\\"} /></div><div className="mt-5 grid gap-3 border-t border-border pt-4 text-sm leading-6 text-muted-foreground md:grid-cols-2"><p><span className="font-bold text-foreground">macOS:</span> In Finder, choose <strong>Go → Go to Folder…</strong>, paste the path, then choose the <code>skills</code> folder.</p><p><span className="font-bold text-foreground">Windows:</span> Paste the path into File Explorer’s address bar, then choose the <code>skills</code> folder.</p></div></section>;
}

function SkillLocation({ tool, macPath, windowsPath }: { tool: string; macPath: string; windowsPath: string }) {
  return <article className="border border-border bg-background p-4"><h3 className="font-bold">{tool}</h3><dl className="mt-3 grid gap-3 text-sm"><div><dt className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">macOS</dt><dd className="mt-1 overflow-x-auto"><code>{macPath}</code></dd></div><div><dt className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Windows</dt><dd className="mt-1 overflow-x-auto"><code>{windowsPath}</code></dd></div></dl></article>;
}
