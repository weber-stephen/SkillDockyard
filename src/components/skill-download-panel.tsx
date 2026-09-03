"use client";

import { Download, MonitorDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ProductLink } from "@/components/product-link";
import { usePathname } from "next/navigation";
import { getInstallDirectory, type DownloadOs, type DownloadTarget } from "@/lib/skill-download";

const historyKey = "skill-dockyard.skill-downloads.v1";

interface DownloadRecord {
  artifactId: string;
  target: DownloadTarget;
  contentHash: string;
  downloadedAt: string;
}

export function SkillDownloadPanel({ artifactId, approvedHash, skillName, eligible, reason, hasPendingChange }: {
  artifactId: string;
  approvedHash: string | null;
  skillName: string;
  eligible: boolean;
  reason: string | null;
  hasPendingChange: boolean;
}) {
  const [target, setTarget] = useState<DownloadTarget>("codex");
  const [os, setOs] = useState<DownloadOs>("mac");
  const [records, setRecords] = useState<DownloadRecord[]>([]);
  const pathname = usePathname();

  useEffect(() => {
    if (navigator.userAgent.includes("Windows")) setOs("windows");
    try {
      const saved = JSON.parse(window.localStorage.getItem(historyKey) ?? "[]");
      if (Array.isArray(saved)) setRecords(saved);
    } catch {
      setRecords([]);
    }
  }, []);

  const previous = useMemo(() => records.find((record) => record.artifactId === artifactId && record.target === target), [artifactId, records, target]);
  const isUpdate = Boolean(previous && approvedHash && previous.contentHash !== approvedHash);
  const destination = getInstallDirectory(target, os);

  function rememberDownload() {
    if (!approvedHash) return;
    const next = [...records.filter((record) => !(record.artifactId === artifactId && record.target === target)), { artifactId, target, contentHash: approvedHash, downloadedAt: new Date().toISOString() }];
    setRecords(next);
    window.localStorage.setItem(historyKey, JSON.stringify(next));
  }

  if (!eligible) {
    return <div className="rounded-md border border-border bg-panel p-4 text-sm leading-6 text-muted-foreground"><div className="font-bold text-foreground">Download unavailable</div><p className="mt-1">{reason}</p></div>;
  }

  const targetName = target === "codex" ? "Codex" : "Claude Code";
  const href = `/api/artifacts/${artifactId}/download?target=${target}&os=${os}${pathname.startsWith("/demo") ? "&demo=1" : ""}`;

  return (
    <section id="get-this-skill" className="rounded-md border border-border bg-panel p-4">
      <div className="flex items-start gap-3">
        <MonitorDown className="mt-0.5 h-5 w-5" />
        <div><h2 className="font-black">Get this skill</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Download the owner-approved version for your AI tool. Your personal edits stay yours.</p></div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Choice label="Use it in" value={target} onChange={(value) => setTarget(value as DownloadTarget)} options={[{ value: "codex", label: "Codex" }, { value: "claude-code", label: "Claude Code" }]} />
        <Choice label="My computer" value={os} onChange={(value) => setOs(value as DownloadOs)} options={[{ value: "mac", label: "Mac" }, { value: "windows", label: "Windows" }]} />
      </div>
      {hasPendingChange ? <p className="mt-4 rounded-sm bg-amber-500/10 p-3 text-sm leading-6 text-amber-950">A newer change is waiting for review. This download contains the last published version.</p> : null}
      <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm leading-6 text-muted-foreground">
        <li>Download and double-click the ZIP file.</li>
        <li>Open <code className="rounded bg-muted px-1 py-0.5 text-foreground">{destination}</code>.</li>
        <li>Drag the extracted <strong className="text-foreground">{skillName}</strong> folder there.</li>
        <li>{target === "codex" ? "Start a new Codex session." : "Claude Code will notice the change automatically."}</li>
      </ol>
      <ProductLink className="mt-3 inline-block text-sm font-semibold text-primary underline underline-offset-4" href="/getting-started#step-get">Need help with these steps?</ProductLink>
      {isUpdate ? <p className="mt-3 text-sm leading-6 text-muted-foreground">Before replacing your old folder, rename it to keep a backup of any personal edits.</p> : null}
      <Button asChild className="mt-4 w-full sm:w-auto"><a href={href} onClick={rememberDownload}><Download className="h-4 w-4" />{isUpdate ? `Download update for ${targetName}` : `Download for ${targetName}`}</a></Button>
    </section>
  );
}

function Choice({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  return <label className="space-y-2"><span className="block text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</span><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm font-semibold" value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}
