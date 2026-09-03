"use client";

import { ProductLink as Link } from "@/components/product-link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowRight, CheckCircle2, ChevronDown, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { clearLocalDrafts, readLocalDrafts, writeLocalDraft, type LocalDraftArtifact } from "@/lib/local-drafts";
import type { SubmissionOptions } from "@/lib/submission-options";
import type { Artifact } from "@/lib/types";

interface SubmissionResponse {
  saved: boolean;
  message: string;
  artifactId: string | null;
  compareHref: string | null;
  trustNotes: number;
}

export function SubmissionForm({ artifacts, options, supabaseConfigured }: { artifacts: Artifact[]; options: SubmissionOptions; supabaseConfigured: boolean }) {
  const [mode, setMode] = useState<"new" | "update">(artifacts.length ? "update" : "new");
  const [artifactId, setArtifactId] = useState(artifacts[0]?.id ?? "");
  const [name, setName] = useState("");
  const [owner, setOwner] = useState("");
  const [customOwner, setCustomOwner] = useState("");
  const [repoName, setRepoName] = useState(options.libraryAreas[0] ?? "General Skills");
  const [customRepoName, setCustomRepoName] = useState("");
  const [path, setPath] = useState("");
  const [changeSummary, setChangeSummary] = useState("");
  const [skillText, setSkillText] = useState("");
  const [tools, setTools] = useState<string[]>([]);
  const [customTool, setCustomTool] = useState("");
  const [mcpServers, setMcpServers] = useState<string[]>([]);
  const [customMcpServer, setCustomMcpServer] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [localDrafts, setLocalDrafts] = useState<LocalDraftArtifact[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmissionResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const pathname = usePathname();

  const selectedArtifact = useMemo(() => artifacts.find((artifact) => artifact.id === artifactId) ?? null, [artifactId, artifacts]);
  const canUpdate = artifacts.length > 0;
  const selectedOwner = owner === "__custom__" ? customOwner : owner;
  const selectedRepoName = repoName === "__custom__" ? customRepoName : repoName;
  const selectedTools = [...tools, customTool].map((value) => value.trim()).filter(Boolean);
  const selectedMcpServers = [...mcpServers, customMcpServer].map((value) => value.trim()).filter(Boolean);

  useEffect(() => {
    const sync = () => setLocalDrafts(readLocalDrafts(window.localStorage));
    sync();
    window.addEventListener("skill-dockyard-local-drafts", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("skill-dockyard-local-drafts", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);

    const response = await fetch(`/api/submissions${pathname.startsWith("/demo") ? "?demo=1" : ""}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode,
        artifactId: mode === "update" ? artifactId : undefined,
        name: mode === "new" ? name : selectedArtifact?.name,
        owner: selectedOwner,
        repoName: selectedRepoName,
        path,
        changeSummary,
        skillText,
        tools: selectedTools,
        mcpServers: selectedMcpServers
      })
    });
    const payload = await response.json();
    setSubmitting(false);

    if (!response.ok) {
      setError(payload.error ?? "We could not submit this skill.");
      return;
    }

    if (payload.mode === "demo") {
      const draft = writeLocalDraft(window.localStorage, {
        mode,
        existingArtifact: selectedArtifact,
        name,
        owner: selectedOwner,
        libraryArea: selectedRepoName,
        path,
        changeSummary,
        trustNotes: payload.trustNotes ?? 0
      });
      setResult({
        ...payload,
        saved: true,
        artifactId: null,
        compareHref: null,
        message: "Saved in this browser. Connect Supabase when you want teammates to see it."
      });
      return;
    }

    setResult(payload);
  }

  function continueToDetails() {
    setError(null);
    if (mode === "update" && !artifactId) return setError("Choose the shared skill you want to update.");
    if (skillText.trim().length < 20) return setError("Paste the full skill instructions before continuing.");
    if (!changeSummary.trim()) return setError(mode === "update" ? "Tell reviewers what improved in this update." : "Tell reviewers why this skill should be shared.");
    setStep(2);
  }

  return (
    <section className="rounded-md border border-border bg-panel p-5">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-black">Skill Submission</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">No command line required. Paste the skill and explain why it belongs in the library or why a shared skill should be improved.</p>
        </div>
        <div className="grid grid-cols-2 rounded-md border border-border p-1 text-sm font-semibold">
          <button
            type="button"
            className={mode === "update" ? "rounded-sm bg-primary px-3 py-2 text-white" : "rounded-sm px-3 py-2 text-muted-foreground"}
            onClick={() => setMode("update")}
            disabled={!canUpdate}
          >
            Update
          </button>
          <button
            type="button"
            className={mode === "new" ? "rounded-sm bg-primary px-3 py-2 text-white" : "rounded-sm px-3 py-2 text-muted-foreground"}
            onClick={() => setMode("new")}
          >
            New skill
          </button>
        </div>
      </div>

      <div className="mb-5 flex items-center gap-3 text-sm"><span className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${step === 1 ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>1</span><span className={step === 1 ? "font-bold" : "text-muted-foreground"}>Skill and value</span><span className="h-px w-6 bg-border" /><span className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${step === 2 ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>2</span><span className={step === 2 ? "font-bold" : "text-muted-foreground"}>Library details</span></div>

      <form className="space-y-5" onSubmit={onSubmit}>
        {!supabaseConfigured ? (
          <div className="rounded-md border border-border bg-background p-3 text-sm leading-6 text-muted-foreground">
            Submissions save in this browser until Supabase is connected. They are drafts only; teammates will not see them yet.
          </div>
        ) : null}
        {step === 1 && mode === "update" ? (
          <label className="block space-y-2">
            <span className="text-sm font-bold">Which shared skill are you improving?</span>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
              value={artifactId}
              onChange={(event) => setArtifactId(event.target.value)}
              disabled={!canUpdate}
            >
              {artifacts.map((artifact) => (
                <option key={artifact.id} value={artifact.id}>
                  {artifact.name} - {artifact.repo_name}{artifact.access_scope?.startsWith("shared_") ? " (shared)" : ""}
                </option>
              ))}
            </select>
            <span className="block text-xs leading-5 text-muted-foreground">
              Choose the skill this update should be compared against. Shared recipients can propose updates; source workspace reviewers still control publishing.
            </span>
          </label>
        ) : null}

        {step === 2 && mode === "new" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Skill name" help="Use the name teammates will recognize." value={name} onChange={setName} />
            <SelectField
              label="Where should teammates find it?"
              help="Choose the library area where this skill belongs."
              value={repoName}
              onChange={setRepoName}
              options={options.libraryAreas}
              customLabel="Add another area"
            />
            {repoName === "__custom__" ? (
              <Field label="New library area" help="Example: Support Ops or Platform Skills." value={customRepoName} onChange={setCustomRepoName} />
            ) : null}
          </div>
        ) : null}

        {step === 2 ? <div className="grid gap-4 md:grid-cols-2">
          <SelectField
            label="Responsible team"
            help="Who should answer questions about this skill?"
            value={owner}
            onChange={setOwner}
            options={options.owners}
            customLabel="Add another owner"
          />
          {owner === "__custom__" ? (
            <Field label="New responsible team" help="Example: @platform or Support Ops." value={customOwner} onChange={setCustomOwner} />
          ) : null}
        </div> : null}

        {step === 2 ? <><ChecklistField label="Tools used" help="Optional. Select known tools or add one if it is not listed." options={options.tools} selected={tools} onChange={setTools} /><Field label="Add another tool" help="Optional. Example: jira or stripe." value={customTool} onChange={setCustomTool} /></> : null}

        {step === 1 ? <label className="block space-y-2">
          <span className="text-sm font-bold">{mode === "update" ? "What improved?" : "Why should this be shared?"}</span>
          <Textarea
            className="min-h-28"
            value={changeSummary}
            onChange={(event) => setChangeSummary(event.target.value)}
            placeholder={mode === "update" ? "Example: Adds customer-language prompts and a short sales handoff." : "Example: Helps campaign managers turn a product launch into a clear customer message."}
          />
          <span className="block text-xs leading-5 text-muted-foreground">Reviewers see this before comparing detailed content.</span>
        </label> : null}

        {step === 1 ? <label className="block space-y-2">
          <span className="text-sm font-bold">Skill instructions</span>
          <Textarea
            className="min-h-72 font-mono text-xs leading-6"
            value={skillText}
            onChange={(event) => setSkillText(event.target.value)}
            placeholder={"Paste the full skill here. Include the role, steps, tools, boundaries, and examples teammates should receive."}
          />
          <span className="block text-xs leading-5 text-muted-foreground">Do not paste passwords, API keys, customer data, or private tokens.</span>
        </label> : null}

        {step === 2 ? <ChecklistField
          label="MCP servers or local services"
          help="Optional. Select known services this skill depends on."
          options={options.mcpServers}
          selected={mcpServers}
          onChange={setMcpServers}
        /> : null}
        {step === 2 ? <Field label="Add another MCP server or local service" help="Optional. Example: localhost:3333." value={customMcpServer} onChange={setCustomMcpServer} /> : null}

        {step === 2 ? <div className="rounded-md border border-border bg-background">
          <button
            type="button"
            className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-bold"
            onClick={() => setShowAdvanced((value) => !value)}
          >
            Advanced details
            <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
          </button>
          {showAdvanced ? (
            <div className="border-t border-border p-4">
              <Field label="File path, if known" help="Optional. Example: skills/campaign-brief-builder/SKILL.md." value={path} onChange={setPath} />
            </div>
          ) : null}
        </div> : null}

        {error ? <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm font-semibold text-destructive">{error}</div> : null}
        {result ? <SubmissionSuccess result={result} /> : null}

        <div className="flex flex-wrap gap-3">
          {step === 1 ? <Button type="button" onClick={continueToDetails} disabled={mode === "update" && !canUpdate}>Continue<ArrowRight className="h-4 w-4" /></Button> : <Button type="submit" disabled={submitting || (mode === "update" && !canUpdate)}>
            {submitting ? "Checking submission..." : "Submit Skill"}
            <Send className="h-4 w-4" />
          </Button>}
          {step === 2 ? <Button type="button" variant="outline" onClick={() => setStep(1)}>Back</Button> : null}
          <Button asChild variant="outline">
            <Link href="/artifacts">Cancel</Link>
          </Button>
        </div>
      </form>
      {!supabaseConfigured ? <LocalDraftsPanel drafts={localDrafts} onClear={() => clearLocalDrafts(window.localStorage)} /> : null}
    </section>
  );
}

function Field({
  label,
  help,
  value,
  onChange
}: {
  label: string;
  help: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-bold">{label}</span>
      <Input value={value} onChange={(event) => onChange(event.target.value)} />
      <span className="block text-xs leading-5 text-muted-foreground">{help}</span>
    </label>
  );
}

function SelectField({
  label,
  help,
  value,
  onChange,
  options,
  customLabel
}: {
  label: string;
  help: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  customLabel: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-bold">{label}</span>
      <select
        className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Choose one...</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
        <option value="__custom__">{customLabel}</option>
      </select>
      <span className="block text-xs leading-5 text-muted-foreground">{help}</span>
    </label>
  );
}

function ChecklistField({
  label,
  help,
  options,
  selected,
  onChange
}: {
  label: string;
  help: string;
  options: string[];
  selected: string[];
  onChange: (value: string[]) => void;
}) {
  function toggle(option: string) {
    onChange(selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option]);
  }

  return (
    <div className="space-y-2">
      <div>
        <div className="text-sm font-bold">{label}</div>
        <p className="text-xs leading-5 text-muted-foreground">{help}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            key={option}
            className={`flex h-9 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm font-semibold ${
              selected.includes(option) ? "border-primary bg-primary text-white" : "border-border bg-background text-muted-foreground"
            }`}
          >
            <input type="checkbox" className="sr-only" checked={selected.includes(option)} onChange={() => toggle(option)} />
            {option}
          </label>
        ))}
        {options.length === 0 ? <span className="text-sm text-muted-foreground">No known options yet.</span> : null}
      </div>
    </div>
  );
}

function SubmissionSuccess({ result }: { result: SubmissionResponse }) {
  const href = result.compareHref ?? (result.artifactId ? `/artifacts/${result.artifactId}` : "/artifacts");
  return (
    <div className="rounded-md border border-border bg-background p-4">
      <div className="flex gap-3">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div className="space-y-2">
          <p className="text-sm font-bold">{result.message}</p>
          <p className="text-xs leading-5 text-muted-foreground">
            Skill Dockyard found {result.trustNotes} trust note{result.trustNotes === 1 ? "" : "s"} to review before publishing.
          </p>
          <p className="text-xs leading-5 text-muted-foreground">Next, the skill owner can compare this change with the shared version and decide whether to publish it for the team.</p>
          <Button asChild variant="outline" size="sm">
            <Link href={href}>
              {result.compareHref ? "Compare Versions" : "Open Skill Library"}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function LocalDraftsPanel({ drafts, onClear }: { drafts: LocalDraftArtifact[]; onClear: () => void }) {
  return (
    <div className="mt-6 rounded-md border border-border bg-background p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-black">Local Drafts</h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">Saved in this browser only. Connect Supabase when these should be shared with teammates.</p>
        </div>
        {drafts.length ? (
          <Button type="button" variant="outline" size="sm" onClick={onClear}>
            Clear Drafts
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        ) : null}
      </div>
      <div className="mt-4 space-y-2">
        {drafts.length ? (
          drafts.map((draft) => (
            <div key={draft.id} className="rounded-md border border-border p-3">
              <div className="font-bold">{draft.name}</div>
              <div className="mt-1 text-xs leading-5 text-muted-foreground">
                {draft.repo_name} / {draft.owner ?? "Unassigned"}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No local drafts yet.</p>
        )}
      </div>
    </div>
  );
}
