import Link from "next/link";
import type { Route } from "next";
import { AlertTriangle, Anchor, CheckCircle2, Compass, FileDown, GitBranch } from "lucide-react";
import { ArtifactTable } from "@/components/artifact-table";
import { Button } from "@/components/ui/button";
import { listArtifacts } from "@/lib/data";
import { hasSupabaseConfig } from "@/lib/supabase/server";

export default async function HomePage() {
  const artifacts = await listArtifacts();
  const approved = artifacts.filter((artifact) => artifact.status === "approved").length;
  const review = artifacts.filter((artifact) => artifact.status === "needs_reapproval" || artifact.status === "unreviewed").length;
  const risks = artifacts.reduce((sum, artifact) => sum + artifact.risk_count, 0);
  const mode = hasSupabaseConfig() ? "Supabase connected" : "Demo data";

  return (
    <div className="space-y-8">
      <header className="grid gap-6 border-b border-border pb-8 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-sm border border-border bg-panel px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
            <Anchor className="h-3.5 w-3.5" />
            {mode}
          </div>
          <div className="space-y-3">
            <h1 className="max-w-4xl text-4xl font-black leading-[0.95] tracking-normal sm:text-6xl">
              Every AI instruction file, docked before it ships.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              Skill Dockyard scans local repos, indexes assistant artifacts, flags risk, and records approvals against immutable Git hashes.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/getting-started">
                Start Guide
                <Compass className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/artifacts">Review Catalog</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/settings/repos">Configure Scanner</Link>
            </Button>
          </div>
        </div>
        <div className="grid content-end gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <Metric icon={GitBranch} label="Artifacts" value={artifacts.length.toString()} />
          <Metric icon={CheckCircle2} label="Approved" value={approved.toString()} />
          <Metric icon={AlertTriangle} label="Open Risks" value={risks.toString()} />
        </div>
      </header>
      <ArtifactTable artifacts={artifacts} />
      <section className="grid gap-4 md:grid-cols-3">
        <WorkflowStep title="1. Explore" body="Use the guided checklist to understand the catalog, review surface, scanner, and exports." actionHref="/getting-started" />
        <WorkflowStep title="2. Review" body="Inspect diffs, owners, tool access, MCP references, and risk flags." />
        <WorkflowStep title="3. Export" body="Give platform and security teams CSV or JSON governance reports." icon={<FileDown className="h-4 w-4" />} />
      </section>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-panel p-4">
      <div className="mb-5 flex items-center justify-between text-muted-foreground">
        <span className="text-xs font-bold uppercase tracking-[0.16em]">{label}</span>
        <Icon className="h-4 w-4" />
      </div>
      <div className="text-4xl font-black">{value}</div>
    </div>
  );
}

function WorkflowStep({ title, body, icon, actionHref }: { title: string; body: string; icon?: React.ReactNode; actionHref?: Route }) {
  return (
    <div className="rounded-md border border-border bg-panel p-5">
      <div className="mb-8 flex items-center justify-between">
        <h3 className="font-black">{title}</h3>
        {icon}
      </div>
      <p className="text-sm leading-6 text-muted-foreground">{body}</p>
      {actionHref ? (
        <Button asChild variant="outline" size="sm" className="mt-5">
          <Link href={actionHref}>
            Open Guide
            <Compass className="h-3.5 w-3.5" />
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
