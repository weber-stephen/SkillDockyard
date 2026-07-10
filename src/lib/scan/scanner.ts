import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import fg from "fast-glob";
import matter from "gray-matter";
import { defaultExcludes, defaultIncludes, type RepoConfig, type SkillDockyardConfig } from "@/lib/scan/config";
import { getBranch, getCommitSha, getLastModifier, getRepoName } from "@/lib/scan/git";
import { detectRisks } from "@/lib/scan/risk";
import type { ArtifactType, ScanArtifactInput } from "@/lib/types";

export interface ScanOptions {
  repo?: string;
  config: SkillDockyardConfig;
}

export async function scanRepos(options: ScanOptions): Promise<ScanArtifactInput[]> {
  const repos: RepoConfig[] = options.repo
    ? [{ path: options.repo }]
    : options.config.repos.length
      ? options.config.repos
      : [{ path: process.cwd() }];

  const results: ScanArtifactInput[] = [];
  for (const repo of repos) {
    results.push(...(await scanRepo(repo, options.config)));
  }
  return results;
}

export async function scanRepo(repo: RepoConfig, config: SkillDockyardConfig): Promise<ScanArtifactInput[]> {
  const root = path.resolve(repo.path);
  const include = repo.include?.length ? repo.include : defaultIncludes;
  const exclude = [...defaultExcludes, ...(repo.exclude ?? [])];
  const entries = await fg(include, {
    cwd: root,
    onlyFiles: true,
    dot: true,
    ignore: exclude,
    unique: true
  });
  const repoName = repo.name ?? getRepoName(root);
  const branch = getBranch(root);

  return entries.map((filePath) => buildArtifact(root, repoName, branch, filePath, config));
}

function buildArtifact(root: string, repoName: string, branch: string | null, filePath: string, config: SkillDockyardConfig): ScanArtifactInput {
  const absolute = path.join(root, filePath);
  const content = fs.readFileSync(absolute, "utf8");
  const parsed = matter(content);
  const type = inferArtifactType(filePath);
  const name = extractName(filePath, parsed.data.name, content);
  const description = extractDescription(parsed.data.description, parsed.content);
  const tools = extractList(parsed.data.tools, content, /tools?\s*[:=]\s*\[?([^\]\n]+)/gi);
  const mcpServers = [...new Set([
    ...extractList(parsed.data["mcp-servers"] ?? parsed.data.mcp_servers, content, /mcp[-_\s]?servers?\s*[:=]\s*\[?([^\]\n]+)/gi),
    ...extractMcpUrls(content)
  ])];
  const tags = extractList(parsed.data.tags, content, /tags?\s*[:=]\s*\[?([^\]\n]+)/gi);
  const owner = extractOwner(parsed.data.owner, root, filePath);
  const contentHash = `sha256:${crypto.createHash("sha256").update(content).digest("hex")}`;
  const risks = detectRisks({
    content,
    tools,
    mcpServers,
    owner,
    approvedMcpServers: config.riskRules?.approvedMcpServers ?? [],
    highImpactTools: config.riskRules?.highImpactTools ?? ["shell", "exec", "stripe", "github:write", "database:write"]
  });

  return {
    repo: {
      name: repoName,
      root_path: root,
      branch_ref: branch
    },
    artifact: {
      name,
      slug: slugify(`${repoName}-${filePath}`),
      type,
      path: filePath,
      description,
      owner
    },
    version: {
      commit_sha: getCommitSha(root, filePath),
      content_hash: contentHash,
      content_snapshot: content,
      summary: summarizeChange(name, description, tools, mcpServers, risks.length),
      tools,
      mcp_servers: mcpServers,
      tags
    },
    risks
  };
}

export function inferArtifactType(filePath: string): ArtifactType {
  if (filePath.endsWith(".github/agents") || filePath.includes(".github/agents/")) return "copilot_agent";
  if (filePath.includes(".cursor/rules/")) return "cursor_rule";
  if (filePath === "mcp.json" || filePath.includes(".mcp/")) return "mcp_config";
  if (filePath.endsWith("SKILL.md")) return "claude_skill";
  if (filePath.endsWith("AGENTS.md") || filePath.endsWith("CLAUDE.md")) return "agent_doc";
  if (filePath.includes("prompts/")) return "prompt_library";
  if (filePath.includes("skills/")) return "skill_folder";
  return "agent_doc";
}

function extractName(filePath: string, frontmatterName: unknown, content: string) {
  if (typeof frontmatterName === "string" && frontmatterName.trim()) return frontmatterName.trim();
  const heading = content.match(/^#\s+(.+)$/m)?.[1];
  if (heading) return heading.trim();
  return path.basename(filePath).replace(/\.(md|json|yaml|yml)$/i, "").replaceAll("-", " ");
}

function extractDescription(frontmatterDescription: unknown, markdown: string) {
  if (typeof frontmatterDescription === "string" && frontmatterDescription.trim()) return frontmatterDescription.trim();
  const paragraph = markdown
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .find((block) => block && !block.startsWith("#") && !block.startsWith("```"));
  return paragraph ? paragraph.replace(/\n/g, " ").slice(0, 240) : null;
}

function extractOwner(owner: unknown, root: string, filePath: string) {
  if (typeof owner === "string" && owner.trim()) return owner.trim();
  if (Array.isArray(owner) && owner.length) return String(owner[0]);
  return getLastModifier(root, filePath);
}

function extractList(value: unknown, content: string, pattern: RegExp) {
  const values = new Set<string>();
  const add = (item: string) => {
    const normalized = item
      .trim()
      .replace(/^-\s*/, "")
      .replace(/^["']|["']$/g, "")
      .trim();
    if (normalized) values.add(normalized);
  };

  if (Array.isArray(value)) value.forEach((item) => add(String(item)));
  if (typeof value === "string") value.split(",").forEach(add);

  for (const match of content.matchAll(pattern)) {
    match[1]
      ?.replace(/[\[\]"']/g, "")
      .split(",")
      .forEach(add);
  }
  return [...values].filter(Boolean);
}

function extractMcpUrls(content: string) {
  const matches = content.match(/(?:localhost:\d+|127\.0\.0\.1:\d+|https?:\/\/[^\s"')]+)/gi) ?? [];
  return [...new Set(matches)];
}

function summarizeChange(name: string, description: string | null, tools: string[], mcpServers: string[], riskCount: number) {
  const parts = [`${name} was scanned from Git and indexed for review.`];
  if (description) parts.push(description);
  if (tools.length) parts.push(`Detected tools: ${tools.join(", ")}.`);
  if (mcpServers.length) parts.push(`Detected MCP references: ${mcpServers.join(", ")}.`);
  if (riskCount) parts.push(`${riskCount} deterministic risk flag${riskCount === 1 ? "" : "s"} need reviewer attention.`);
  return parts.join(" ");
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
