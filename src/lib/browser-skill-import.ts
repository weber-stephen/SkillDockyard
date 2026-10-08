import crypto from "node:crypto";
import { detectRisks } from "@/lib/scan/risk";
import { getImportedSkillMetadata, normalizeImportPath } from "@/lib/skill-import";
import { INGEST_LIMITS, isSnapshotWithinLimit } from "@/lib/ingest-limits";
import type { ArtifactVisibility, ScanArtifactInput } from "@/lib/types";

export const MAX_BROWSER_IMPORT_BYTES = 1_500_000;

export interface BrowserSkillImportInput {
  visibility: ArtifactVisibility;
  summary?: unknown;
  skills: unknown;
}

export interface BrowserImportSkillInput { path: string; content: string }

export function validateBrowserSkillImport(input: unknown): string | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return "Request body must be an object.";
  const body = input as Record<string, unknown>;
  if (body.visibility !== "private" && body.visibility !== "workspace") return "Choose where to import these skills.";
  if (body.summary !== undefined && (typeof body.summary !== "string" || body.summary.length > INGEST_LIMITS.maxStringLength)) return "The shared explanation is too long.";
  if (body.visibility === "workspace" && (typeof body.summary !== "string" || !body.summary.trim())) return "Explain why these skills should be shared with your workspace.";
  if (!Array.isArray(body.skills) || !body.skills.length || body.skills.length > INGEST_LIMITS.maxArtifacts) return "Choose between 1 and 100 skills to import.";
  let total = 0;
  for (const item of body.skills) {
    if (!item || typeof item !== "object" || Array.isArray(item)) return "Each imported skill must include a path and instructions.";
    const skill = item as Record<string, unknown>;
    if (typeof skill.path !== "string" || !normalizeImportPath(skill.path) || skill.path.length > INGEST_LIMITS.maxStringLength) return "An imported skill has an invalid path.";
    if (typeof skill.content !== "string" || !isSnapshotWithinLimit(skill.content)) return "Skill instructions are missing or too large.";
    total += new TextEncoder().encode(skill.content).byteLength;
  }
  return total > MAX_BROWSER_IMPORT_BYTES ? "Choose fewer skills so the selected instructions are under 1.5 MB." : null;
}

export function buildBrowserImportArtifacts(skills: BrowserImportSkillInput[], riskRules: { approvedMcpServers: string[]; highImpactTools: string[] }, summary?: string): ScanArtifactInput[] {
  return skills.map((skill) => {
    const path = normalizeImportPath(skill.path);
    if (!path) throw new Error("An imported skill has an invalid path.");
    const metadata = getImportedSkillMetadata(skill.content, path);
    const contentHash = `sha256:${crypto.createHash("sha256").update(skill.content).digest("hex")}`;
    const risks = detectRisks({
      content: skill.content,
      tools: metadata.tools,
      mcpServers: metadata.mcpServers,
      owner: metadata.owner,
      approvedMcpServers: riskRules.approvedMcpServers,
      highImpactTools: riskRules.highImpactTools
    });
    return {
      repo: { name: "Browser imports", root_path: "browser://skill-import", branch_ref: null },
      artifact: {
        name: metadata.name,
        slug: `browser-import-${slugify(path)}`,
        type: metadata.type,
        path: `imports/${path}`,
        description: metadata.description,
        owner: metadata.owner
      },
      version: {
        commit_sha: null,
        content_hash: contentHash,
        content_snapshot: skill.content,
        summary: summary?.trim() ? `Imported from your computer: ${summary.trim()}` : "Imported from your computer.",
        tools: metadata.tools,
        mcp_servers: metadata.mcpServers,
        tags: [...new Set(["browser-import", ...metadata.tags])]
      },
      risks
    };
  });
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
