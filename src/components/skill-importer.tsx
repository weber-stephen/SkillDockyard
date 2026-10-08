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

  if (isDemo) return <section className="border border-border bg-panel p-6"><h2 className="text-xl font-black">Import from your computer</h2><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Browser import saves real skill instructions to your private workspace. Create a workspace to import files from this computer.</p><Button asChild className="mt-5"><a href="/signup">Create a workspace</a></Button></section>;

  return <div className="space-y-6">
    <section className="grid gap-5 border border-border bg-panel p-5 md:grid-cols-[1fr_auto] md:items-center">
      <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">From this computer</p><h2 className="mt-2 text-2xl font-black">Choose a skill folder or ZIP file.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">We look for `SKILL.md` files, then let you choose exactly what to save. Nothing is uploaded until you confirm.</p></div>
      <div className="flex flex-wrap gap-2"><Button onClick={() => folderInput.current?.click()} disabled={parsing}><FolderOpen className="h-4 w-4" />{parsing ? "Reading files…" : "Choose folder"}</Button><Button variant="outline" onClick={() => zipInput.current?.click()} disabled={parsing}><FileArchive className="h-4 w-4" />Choose ZIP</Button></div>
      <input ref={folderInput} className="sr-only" type="file" multiple {...({ webkitdirectory: "", directory: "" } as Record<string, string>)} onChange={(event) => void choose(event.target.files)} />
      <input ref={zipInput} className="sr-only" type="file" accept=".zip,application/zip" onChange={(event) => void choose(event.target.files)} />
    </section>
    {error ? <p role="alert" className="border border-destructive bg-destructive/10 p-3 text-sm font-semibold text-destructive">{error}</p> : null}
    {warnings.map((warning) => <p key={warning} className="flex gap-2 border border-primary/25 bg-primary/[0.055] p-3 text-sm leading-6"><Archive className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{warning}</p>)}
    {candidates.length ? <section className="border border-border bg-panel"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5"><div><h2 className="font-black">Review detected skills</h2><p className="mt-1 text-sm text-muted-foreground">Select the instructions you want to bring into Skill Dockyard.</p></div><Button variant="outline" size="sm" onClick={() => setSelected(selected.size === candidates.length ? new Set() : new Set(candidates.map((candidate) => candidate.id)))}>{selected.size === candidates.length ? "Clear selection" : "Select all"}</Button></div><div className="divide-y divide-border">{candidates.map((candidate) => <label key={candidate.id} className="flex cursor-pointer gap-3 p-5 hover:bg-muted/45"><input className="mt-1 h-4 w-4 accent-primary" type="checkbox" checked={selected.has(candidate.id)} onChange={() => setSelected((current) => { const next = new Set(current); if (next.has(candidate.id)) next.delete(candidate.id); else next.add(candidate.id); return next; })} /><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><span className="font-bold">{candidate.metadata.name}</span>{candidate.supportingFiles.length ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-attention"><ShieldAlert className="h-3.5 w-3.5" />{candidate.supportingFiles.length} supporting file{candidate.supportingFiles.length === 1 ? "" : "s"} not imported</span> : <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary"><CheckCircle2 className="h-3.5 w-3.5" />Instructions only</span>}</span><span className="mt-1 block text-sm text-muted-foreground">{candidate.metadata.description || "No description found."}</span><span className="mt-2 block font-mono text-xs text-muted-foreground">{candidate.path}</span>{Boolean(candidate.metadata.tools.length || candidate.metadata.mcpServers.length) ? <span className="mt-2 block text-xs text-muted-foreground">{candidate.metadata.tools.length ? `Tools: ${candidate.metadata.tools.join(", ")}` : ""}{candidate.metadata.tools.length && candidate.metadata.mcpServers.length ? " · " : ""}{candidate.metadata.mcpServers.length ? `Connectors: ${candidate.metadata.mcpServers.join(", ")}` : ""}</span> : null}</span></label>)}</div></section> : null}
    {selectedCandidates.length ? <section className="border border-border bg-panel p-5"><fieldset className="space-y-3"><legend className="text-sm font-bold">Where should these skills go?</legend><div className="grid gap-3 md:grid-cols-2"><Destination selected={visibility === "private"} onSelect={() => setVisibility("private")} title="Private drafts" body="Only you can see them until you submit each skill for review." /><Destination selected={visibility === "workspace"} onSelect={() => setVisibility("workspace")} title="Workspace review" body="Each selected skill becomes a submission awaiting review." /></div></fieldset>{visibility === "workspace" ? <label className="mt-5 block space-y-2"><span className="text-sm font-bold">Why should these skills be shared?</span><Textarea value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Example: These are the team’s tested workflows for campaign planning." /><span className="block text-xs text-muted-foreground">This one explanation is attached to each submission in this batch.</span></label> : null}<div className="mt-5 flex flex-wrap items-center gap-3"><Button onClick={() => void importSelected()} disabled={importing}><Upload className="h-4 w-4" />{importing ? "Importing…" : visibility === "private" ? `Save ${selectedCandidates.length} private draft${selectedCandidates.length === 1 ? "" : "s"}` : `Submit ${selectedCandidates.length} skill${selectedCandidates.length === 1 ? "" : "s"}`}</Button><Link href="/settings" className="text-sm font-semibold text-primary underline underline-offset-4">Use a connected computer instead</Link></div>{message ? <p role="status" className="mt-4 border border-primary/25 bg-primary/[0.055] p-3 text-sm font-semibold">{message} <Link href={visibility === "private" ? "/artifacts" : "/submissions"} className="text-primary underline underline-offset-4">View skills</Link></p> : null}</section> : null}
  </div>;
}

function Destination({ selected, onSelect, title, body }: { selected: boolean; onSelect: () => void; title: string; body: string }) { return <button type="button" onClick={onSelect} className={`border p-4 text-left transition-colors ${selected ? "border-primary bg-primary/[0.055]" : "border-border hover:bg-muted"}`}><span className="block font-bold">{title}</span><span className="mt-1 block text-sm leading-5 text-muted-foreground">{body}</span></button>; }
