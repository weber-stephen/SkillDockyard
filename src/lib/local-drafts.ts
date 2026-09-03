import type { Artifact, ArtifactType } from "@/lib/types";

export const localDraftsStorageKey = "skill-dockyard.local-drafts.v1";
export const localDraftWorkspaceId = "local-browser";

export interface LocalDraftInput {
  mode: "new" | "update";
  existingArtifact?: Pick<Artifact, "id" | "name" | "repo_name" | "path" | "type" | "owner"> | null;
  name: string;
  owner: string;
  libraryArea: string;
  path: string;
  changeSummary: string;
  trustNotes: number;
}

export type LocalDraftArtifact = Artifact & {
  localDraft: true;
  changeSummary: string;
};

export function isLocalDraftArtifact(artifact: Pick<Artifact, "workspace_id">) {
  return artifact.workspace_id === localDraftWorkspaceId;
}

export function readLocalDrafts(storage: Storage): LocalDraftArtifact[] {
  try {
    const parsed = JSON.parse(storage.getItem(localDraftsStorageKey) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isLocalDraftShape);
  } catch {
    return [];
  }
}

export function writeLocalDraft(storage: Storage, input: LocalDraftInput) {
  const drafts = readLocalDrafts(storage);
  const draft = createLocalDraft(input);
  const next = [draft, ...drafts.filter((item) => item.id !== draft.id)].slice(0, 25);
  storage.setItem(localDraftsStorageKey, JSON.stringify(next));
  notifyDraftListeners();
  return draft;
}

export function clearLocalDrafts(storage: Storage) {
  storage.removeItem(localDraftsStorageKey);
  notifyDraftListeners();
}

function createLocalDraft(input: LocalDraftInput): LocalDraftArtifact {
  const id = `local_draft_${input.mode}_${slugify(input.existingArtifact?.id ?? input.name)}_${Date.now()}`;
  const name = input.mode === "update" && input.existingArtifact ? input.existingArtifact.name : input.name;
  const repoName = input.mode === "update" && input.existingArtifact ? input.existingArtifact.repo_name : input.libraryArea || "General Skills";
  const path = input.mode === "update" && input.existingArtifact ? input.existingArtifact.path : input.path || `submitted/${slugify(name)}.md`;
  const type: ArtifactType = input.mode === "update" && input.existingArtifact ? input.existingArtifact.type : inferType(path);

  return {
    id,
    workspace_id: localDraftWorkspaceId,
    repo_id: "local-drafts",
    name,
    slug: slugify(`${repoName}-${path}`),
    type,
    repo_name: repoName,
    path,
    description: input.changeSummary,
    owner: input.owner || input.existingArtifact?.owner || null,
    status: input.mode === "update" ? "needs_reapproval" : "unreviewed",
    current_version_id: id,
    approved_version_id: input.mode === "update" ? `published_${input.existingArtifact?.id ?? id}` : null,
    risk_count: input.trustNotes,
    updated_at: new Date().toISOString(),
    localDraft: true,
    changeSummary: input.changeSummary
  };
}

function notifyDraftListeners() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("skill-dockyard-local-drafts"));
}

function isLocalDraftShape(value: unknown): value is LocalDraftArtifact {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<LocalDraftArtifact>;
  return item.localDraft === true && typeof item.id === "string" && typeof item.name === "string" && item.workspace_id === localDraftWorkspaceId;
}

function inferType(path: string): ArtifactType {
  if (path.includes(".github/agents/")) return "copilot_agent";
  if (path.includes(".cursor/rules/")) return "cursor_rule";
  if (path === "mcp.json" || path.includes(".mcp/")) return "mcp_config";
  if (path.endsWith("AGENTS.md") || path.endsWith("CLAUDE.md")) return "agent_doc";
  if (path.includes("prompts/")) return "prompt_library";
  if (path.includes("skills/")) return "skill_folder";
  return "claude_skill";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
