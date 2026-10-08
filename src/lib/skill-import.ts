import { parseFrontmatter } from "@/lib/frontmatter";
import type { ArtifactType } from "@/lib/types";

export interface ImportedSkillMetadata {
  name: string;
  description: string | null;
  owner: string | null;
  tools: string[];
  mcpServers: string[];
  tags: string[];
  type: ArtifactType;
}

/** Browser-safe metadata extraction for a standalone SKILL.md file. */
export function getImportedSkillMetadata(content: string, filePath: string): ImportedSkillMetadata {
  const parsed = parseFrontmatter(content);
  const name = stringValue(parsed.data.name) || heading(content) || filePath.split("/").at(-2) || "Untitled skill";
  const description = stringValue(parsed.data.description) || firstParagraph(parsed.content);
  const tools = extractList(parsed.data.tools, content, /tools?\s*[:=]\s*\[?([^\]\n]+)/gi);
  const mcpServers = [...new Set([
    ...extractList(parsed.data["mcp-servers"] ?? parsed.data.mcp_servers, content, /mcp[-_\s]?servers?\s*[:=]\s*\[?([^\]\n]+)/gi),
    ...(content.match(/(?:localhost:\d+|127\.0\.0\.1:\d+|https?:\/\/[^\s"')]+)/gi) ?? [])
  ])];
  return {
    name,
    description: description || null,
    owner: stringValue(parsed.data.owner) || null,
    tools,
    mcpServers,
    tags: extractList(parsed.data.tags, content, /tags?\s*[:=]\s*\[?([^\]\n]+)/gi),
    type: "claude_skill"
  };
}

export function normalizeImportPath(value: string) {
  const normalized = value.replaceAll("\\", "/").replace(/^\.\//, "").replace(/\/+/g, "/");
  if (!normalized || normalized.startsWith("/") || normalized.split("/").some((part) => !part || part === "." || part === "..")) return null;
  return normalized;
}

export function isSkillInstructionPath(value: string) {
  return value === "SKILL.md" || value.endsWith("/SKILL.md");
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function heading(content: string) {
  return content.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? "";
}

function firstParagraph(content: string) {
  return content.split(/\n{2,}/).map((block) => block.trim()).find((block) => block && !block.startsWith("#") && !block.startsWith("```"))?.replace(/\n/g, " ").slice(0, 240) ?? "";
}

function extractList(value: unknown, content: string, pattern: RegExp) {
  const values = new Set<string>();
  const add = (item: string) => {
    const normalized = item.trim().replace(/^-\s*/, "").replace(/^["']|["']$/g, "").trim();
    if (normalized) values.add(normalized);
  };
  if (Array.isArray(value)) value.forEach((item) => add(String(item)));
  if (typeof value === "string") value.split(",").forEach(add);
  for (const match of content.matchAll(pattern)) match[1]?.replace(/[\[\]"']/g, "").split(",").forEach(add);
  return [...values];
}
