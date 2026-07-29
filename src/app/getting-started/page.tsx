import Link from "next/link";
import type { Route } from "next";
import type { ElementType } from "react";
import {
  Anchor,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Database,
  FileDown,
  Radar,
  Settings2,
  ShieldAlert,
  Terminal
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { hasSupabaseConfig } from "@/lib/supabase/server";

const sampleScanCommand = "npm run cli -- scan --repo tests/fixtures/sample-repo";
const ingestCommand = "npm run cli -- scan --repo tests/fixtures/sample-repo --endpoint http://localhost:3000/api/scan";
const exportCommand = "npm run cli -- export --repo tests/fixtures/sample-repo --format csv";

export default function GettingStartedPage() {
  const mode = hasSupabaseConfig() ? "Supabase connected" : "Demo mode";

  return (
    <div className="space-y-8">
      <header className="grid gap-6 border-b border-border pb-8 lg:grid-cols-[1fr_0.42fr]">
        <div className="space-y-4">
          <Badge variant={hasSupabaseConfig() ? "success" : "muted"}>{mode}</Badge>
          <div className="space-y-3">
            <h1 className="max-w-4xl text-4xl font-black leading-[0.95] tracking-normal sm:text-5xl">
              Start with visibility, then move into governance.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              Use this guide to see what AI instruction files exist, which ones carry risk, how reviews work, and how to export evidence for platform and security teams.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/artifacts">
                Review Demo Catalog
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/settings/repos">
                Configure Scanner
                <Settings2 className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
        <section className="rounded-md border border-border bg-panel p-5">
          <div className="mb-6 flex items-center gap-2">
            <Radar className="h-4 w-4" />
            <h2 className="font-black">What You Should Know First</h2>
          </div>
          <div className="space-y-4 text-sm leading-6 text-muted-foreground">
            <p>Skill Dockyard scans Git repos for assistant instructions, prompts, skills, Cursor rules, Copilot agents, and MCP configs.</p>
            <p>Demo data is enough to understand the workflow. Connect Supabase when you are ready to persist real scans and settings.</p>
          </div>
        </section>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1fr_0.65fr]">
        <div className="space-y-4">
          <GuideStep
            number="01"
            icon={Anchor}
            title="Review the demo catalog"
            body="Start by scanning the shape of the catalog: artifact names, repos, owners, review status, and risk counts. This gives you the product model before setup work."
            actionHref="/artifacts"
            actionLabel="Open Artifacts"
          />
          <GuideStep
            number="02"
            icon={ShieldAlert}
            title="Open a risky artifact"
            body="Inspect tools, MCP servers, extracted ownership, deterministic risk flags, and the current content snapshot. This is where reviewers decide what needs approval."
            actionHref="/artifacts"
            actionLabel="Find an Artifact"
            variant="risk"
          />
          <GuideStep
            number="03"
            icon={Settings2}
            title="Configure scanner inputs"
            body="Use the settings page to understand the config file, approved MCP servers, and high-impact tools. The local source of truth is skill-dockyard.yml."
            actionHref="/settings/repos"
            actionLabel="Open Settings"
          />
          <GuideStep
            number="04"
            icon={Terminal}
            title="Run a scan and ingest results"
            body="Run the scanner locally against the fixture repo first. When the app is running, add the endpoint flag to send results into the local API."
            command={sampleScanCommand}
            secondaryCommand={ingestCommand}
          />
          <GuideStep
            number="05"
            icon={FileDown}
            title="Export governance evidence"
            body="Download JSON or CSV reports for platform, security, and leadership review. Exports include artifact metadata, risk kinds, hashes, tools, MCP servers, and approval state."
            actionHref="/exports"
            actionLabel="Open Exports"
            command={exportCommand}
          />
        </div>

        <aside className="space-y-4">
          <OutcomePanel />
          <PersistencePanel connected={hasSupabaseConfig()} />
        </aside>
      </section>
    </div>
  );
}

function GuideStep({
  number,
  icon: Icon,
  title,
  body,
  actionHref,
  actionLabel,
  command,
  secondaryCommand,
  variant = "default"
}: {
  number: string;
  icon: ElementType;
  title: string;
  body: string;
  actionHref?: Route;
  actionLabel?: string;
  command?: string;
  secondaryCommand?: string;
  variant?: "default" | "risk";
}) {
  return (
    <article className="grid gap-4 rounded-md border border-border bg-panel p-5 md:grid-cols-[auto_1fr]">
      <div className="flex items-start gap-3 md:block">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary text-white">
          <Icon className="h-4 w-4" />
        </div>
        <Badge className="mt-2 md:mt-4" variant={variant === "risk" ? "risk" : "outline"}>{number}</Badge>
      </div>
      <div className="min-w-0 space-y-4">
        <div>
          <h2 className="text-xl font-black">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{body}</p>
        </div>
        {command ? <CommandBlock command={command} /> : null}
        {secondaryCommand ? <CommandBlock command={secondaryCommand} label="Ingest into the running app" /> : null}
        {actionHref && actionLabel ? (
          <Button asChild variant="outline" size="sm">
            <Link href={actionHref}>
              {actionLabel}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        ) : null}
      </div>
    </article>
  );
}

function CommandBlock({ command, label = "Run locally" }: { command: string; label?: string }) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <pre className="overflow-x-auto rounded-md bg-muted p-4 text-xs leading-6">{command}</pre>
    </div>
  );
}

function OutcomePanel() {
  const outcomes = [
    "Know which AI artifacts exist across repos.",
    "Spot high-impact tools and unapproved MCP servers.",
    "Review changes against Git-backed versions.",
    "Export evidence for governance conversations."
  ];

  return (
    <section className="rounded-md border border-border bg-panel p-5">
      <div className="mb-5 flex items-center gap-2">
        <ClipboardCheck className="h-4 w-4" />
        <h2 className="font-black">Outcomes</h2>
      </div>
      <div className="space-y-3">
        {outcomes.map((outcome) => (
          <div key={outcome} className="flex gap-3 text-sm leading-6">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>{outcome}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function PersistencePanel({ connected }: { connected: boolean }) {
  return (
    <section className="rounded-md border border-border bg-panel p-5">
      <div className="mb-5 flex items-center gap-2">
        <Database className="h-4 w-4" />
        <h2 className="font-black">Persistence</h2>
      </div>
      <p className="text-sm leading-6 text-muted-foreground">
        {connected
          ? "Supabase is configured. Real scan ingest, settings, reviews, and exports can use persistent workspace data."
          : "You are in demo mode. Use the product flow now, then add Supabase environment variables when you want persistent workspace data."}
      </p>
      <div className="mt-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/settings/repos">
            View Settings
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
