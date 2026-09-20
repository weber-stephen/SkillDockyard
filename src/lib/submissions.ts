import crypto from "node:crypto";
import matter from "gray-matter";
import { detectRisks } from "@/lib/scan/risk";
import type { Artifact, ArtifactDetail, ArtifactType, ScanArtifactInput } from "@/lib/types";
import { INGEST_LIMITS, isSnapshotWithinLimit } from "@/lib/ingest-limits";

export type SubmissionMode = "new" | "update";

export interface ManualSubmissionInput {
  mode: SubmissionMode;
  visibility?: unknown;
  artifactId?: unknown;
  name?: unknown;
  owner?: unknown;
  repoName?: unknown;
  path?: unknown;
  skillText?: unknown;
  changeSummary?: unknown;
  tools?: unknown;
  mcpServers?: unknown;
}

export interface SubmissionRiskRules {
  approvedMcpServers: string[];
  highImpactTools: string[];
}

export interface ManualSubmissionResult {
  artifact: ScanArtifactInput;
  targetArtifactId: string | null;
  compareHref: string | null;
  successMessage: string;
}

export function buildManualSubmission(
  input: ManualSubmissionInput,
  options: {
    existingArtifact?: ArtifactDetail | Artifact | null;
    riskRules: SubmissionRiskRules;
  }
): ManualSubmissionResult {
  const inputError = validateManualSubmissionInput(input);
  if (inputError) throw new Error(inputError);
  const mode = input.mode === "update" ? "update" : "new";
  const existing = options.existingArtifact ?? null;
  if (mode === "update" && !existing) {
    throw new Error("Choose the shared skill you want to update.");
  }

  const skillText = stringValue(input.skillText);
  if (!skillText || skillText.length < 20) {
    throw new Error("Paste the full skill instructions before submitting.");
  }

  const parsed = matter(skillText);
  const fallbackName = mode === "update" && existing ? existing.name : "";
  const name = stringValue(input.name) || stringValue(parsed.data.name) || fallbackName;
  if (!name) throw new Error("Give this skill a clear name.");

  const owner = stringValue(input.owner) || (mode === "update" && existing ? existing.owner : null);

  const changeSummary = stringValue(input.changeSummary);
  if (!changeSummary) {
    throw new Error(mode === "update" ? "Tell reviewers what improved in this update." : "Tell reviewers why this skill should be shared.");
  }

  const repoName = mode === "update" && existing ? existing.repo_name : "manual-submissions";
  const path = mode === "update" && existing ? existing.path : cleanPath(stringValue(input.path)) || `submitted/${slugify(name)}.md`;
  const type: ArtifactType = mode === "update" && existing ? existing.type : inferSubmittedType(path);
  const tools = normalizeList(input.tools).length ? normalizeList(input.tools) : extractFrontmatterList(parsed.data.tools);
  const mcpServers = normalizeList(input.mcpServers).length
    ? normalizeList(input.mcpServers)
    : extractFrontmatterList(parsed.data["mcp-servers"] ?? parsed.data.mcp_servers);
  const contentHash = `sha256:${crypto.createHash("sha256").update(skillText).digest("hex")}`;
  const risks = detectRisks({
    content: skillText,
    tools,
    mcpServers,
    owner,
    approvedMcpServers: options.riskRules.approvedMcpServers,
    highImpactTools: options.riskRules.highImpactTools
  });

  return {
    artifact: {
      repo: {
        name: repoName,
        root_path: mode === "update" && existing ? existing.repo_name : "manual-submissions",
        branch_ref: "manual-submission"
      },
      artifact: {
        name,
        slug: mode === "update" && existing ? existing.slug : slugify(`${repoName}-${path}`),
        type,
        path,
        description: mode === "update" && existing ? existing.description : changeSummary,
        owner
      },
      version: {
        commit_sha: null,
        content_hash: contentHash,
        content_snapshot: skillText,
        summary:
          mode === "update"
            ? `Submitted update worth preserving: ${changeSummary}`
            : `Submitted new skill to your library: ${changeSummary}`,
        tools,
        mcp_servers: mcpServers,
        tags: ["manual-submission", mode]
      },
      risks
    },
    targetArtifactId: mode === "update" && existing ? existing.id : null,
    compareHref: mode === "update" && existing ? `/artifacts/${existing.id}/review` : null,
    successMessage:
      mode === "update"
        ? "We saved this as the current copy. Compare it with the published version before publishing."
        : "We saved this as a new skill submission. Publish it when it should become part of your library."
  };
}

export function validateManualSubmissionInput(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return "Request body must be an object.";
  const body = input as Record<string, unknown>;
  if (body.mode !== "new" && body.mode !== "update") return "Choose whether this is a new skill or an update.";
  if (body.visibility !== undefined && body.visibility !== "private" && body.visibility !== "workspace") return "Choose whether this skill is private or shared with the workspace.";
  if (body.mode === "update" && body.visibility === "private") return "Updates to shared skills must be submitted to the workspace review queue.";
  for (const field of ["name", "owner", "repoName", "path", "changeSummary", "artifactId"]) {
    const value = body[field];
    if (value !== undefined && value !== null && typeof value !== "string") return `The ${field} field must be text.`;
    if (typeof value === "string" && value.length > INGEST_LIMITS.maxStringLength) return `The ${field} field is too long.`;
  }
  if (typeof body.skillText !== "string" || !isSnapshotWithinLimit(body.skillText)) return "Skill instructions are missing or too large.";
  for (const field of ["tools", "mcpServers"]) {
    const value = body[field];
    if (Array.isArray(value) && (value.length > INGEST_LIMITS.maxListItems || value.some((item) => typeof item !== "string" || item.length > INGEST_LIMITS.maxListItemLength))) {
      return `The ${field} list is too large or contains an invalid item.`;
    }
    if (typeof value === "string" && value.length > INGEST_LIMITS.maxStringLength) return `The ${field} list is too long.`;
    if (value !== undefined && value !== null && !Array.isArray(value) && typeof value !== "string") return `The ${field} field must be a list or comma-separated text.`;
  }
  return null;
}

export function normalizeList(value: unknown) {
  if (Array.isArray(value)) return [...new Set(value.map((item) => String(item).trim()).filter(Boolean))];
  if (typeof value !== "string") return [];
  return [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))];
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function extractFrontmatterList(value: unknown) {
  return normalizeList(Array.isArray(value) ? value : typeof value === "string" ? value : []);
}

function cleanPath(value: string) {
  return value.replace(/^\/+/, "").replace(/\s+/g, "-");
}

function inferSubmittedType(filePath: string): ArtifactType {
  if (filePath.includes(".github/agents/")) return "copilot_agent";
  if (filePath.includes(".cursor/rules/")) return "cursor_rule";
  if (filePath === "mcp.json" || filePath.includes(".mcp/")) return "mcp_config";
  if (filePath.endsWith("SKILL.md")) return "claude_skill";
  if (filePath.endsWith("AGENTS.md") || filePath.endsWith("CLAUDE.md")) return "agent_doc";
  if (filePath.includes("prompts/")) return "prompt_library";
  if (filePath.includes("skills/")) return "skill_folder";
  return "claude_skill";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
