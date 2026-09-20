import type { ScanArtifactInput } from "@/lib/types";

export const INGEST_LIMITS = {
  maxArtifacts: 100,
  maxRisksPerArtifact: 50,
  maxSnapshotBytes: 256 * 1024,
  maxStringLength: 8 * 1024,
  maxListItems: 50,
  maxListItemLength: 512
} as const;

const ARTIFACT_TYPES = new Set(["agent_doc", "claude_skill", "copilot_agent", "cursor_rule", "mcp_config", "prompt_library", "skill_folder"]);
const RISK_KINDS = new Set(["inline_credentials", "local_mcp", "unapproved_mcp", "high_impact_tool", "missing_owner"]);
const RISK_SEVERITIES = new Set(["low", "medium", "high"]);

export function validateIngestBatch(value: unknown): value is ScanArtifactInput[] {
  if (!Array.isArray(value) || value.length > INGEST_LIMITS.maxArtifacts) return false;
  return value.every((item) => validateIngestItemShape(item));
}

export function validateIngestItemShape(item: unknown): item is ScanArtifactInput {
  if (!isRecord(item) || !isRecord(item.repo) || !isRecord(item.artifact) || !isRecord(item.version)) return false;
  if (!isBoundedString(item.repo.name) || !isBoundedString(item.repo.root_path) || !isNullableBoundedString(item.repo.branch_ref)) return false;
  if (!isBoundedString(item.artifact.name) || !isBoundedString(item.artifact.slug) || !isBoundedString(item.artifact.path) || typeof item.artifact.type !== "string" || !ARTIFACT_TYPES.has(item.artifact.type)) return false;
  if (!isNullableBoundedString(item.artifact.description) || !isNullableBoundedString(item.artifact.owner)) return false;
  if (!isBoundedString(item.version.content_hash) || typeof item.version.content_snapshot !== "string" || !isSnapshotWithinLimit(item.version.content_snapshot)) return false;
  if (!isNullableBoundedString(item.version.commit_sha) || !isNullableBoundedString(item.version.summary)) return false;
  if (!isBoundedStringList(item.version.tools) || !isBoundedStringList(item.version.mcp_servers) || !isBoundedStringList(item.version.tags)) return false;
  if (!Array.isArray(item.risks) || item.risks.length > INGEST_LIMITS.maxRisksPerArtifact) return false;
  return item.risks.every((risk) => isRecord(risk)
    && typeof risk.kind === "string" && RISK_KINDS.has(risk.kind)
    && typeof risk.severity === "string" && RISK_SEVERITIES.has(risk.severity)
    && isBoundedString(risk.message)
    && isNullableBoundedString(risk.evidence));
}

export function isSnapshotWithinLimit(value: string) {
  return new TextEncoder().encode(value).byteLength <= INGEST_LIMITS.maxSnapshotBytes;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isBoundedString(value: unknown, maxLength = INGEST_LIMITS.maxStringLength): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= maxLength;
}

function isNullableBoundedString(value: unknown, maxLength = INGEST_LIMITS.maxStringLength): value is string | null {
  return value === null || (typeof value === "string" && value.length <= maxLength);
}

function isBoundedStringList(value: unknown): value is string[] {
  return Array.isArray(value)
    && value.length <= INGEST_LIMITS.maxListItems
    && value.every((item) => typeof item === "string" && item.length <= INGEST_LIMITS.maxListItemLength);
}
