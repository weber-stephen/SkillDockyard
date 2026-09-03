import crypto from "node:crypto";
import matter from "gray-matter";
import { detectRisks } from "@/lib/scan/risk";
import type { Artifact, ArtifactDetail, ArtifactType, ScanArtifactInput } from "@/lib/types";

export type SubmissionMode = "new" | "update";

export interface ManualSubmissionInput {
  mode: SubmissionMode;
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
  if (!owner) throw new Error("Add the person or team responsible for this skill.");

  const changeSummary = stringValue(input.changeSummary);
  if (!changeSummary) {
    throw new Error(mode === "update" ? "Tell reviewers what improved in this update." : "Tell reviewers why this skill should be shared.");
  }

  const repoName = mode === "update" && existing ? existing.repo_name : stringValue(input.repoName) || "manual-submissions";
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
        : "We saved this as a new skill proposal. Publish it when it should become part of your library."
  };
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
