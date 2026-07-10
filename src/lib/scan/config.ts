import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

export interface RepoConfig {
  name?: string;
  path: string;
  include?: string[];
  exclude?: string[];
}

export interface SkillDockyardConfig {
  workspace?: {
    name?: string;
    reviewer?: string;
  };
  repos: RepoConfig[];
  riskRules?: {
    approvedMcpServers?: string[];
    highImpactTools?: string[];
  };
}

export const defaultIncludes = [
  "**/AGENTS.md",
  "**/CLAUDE.md",
  "**/SKILL.md",
  ".github/agents/*.md",
  "skills/**",
  "prompts/**",
  "ai/**",
  ".cursor/rules/**",
  "mcp.json",
  ".mcp/**"
];

export const defaultExcludes = ["**/node_modules/**", "**/.git/**", "**/dist/**", "**/.next/**"];

export function loadConfig(configPath = "skill-dockyard.yml"): SkillDockyardConfig {
  const absolutePath = path.resolve(configPath);
  if (!fs.existsSync(absolutePath)) {
    return {
      repos: [],
      riskRules: {
        approvedMcpServers: [],
        highImpactTools: ["shell", "exec", "stripe", "github:write", "database:write"]
      }
    };
  }

  const raw = fs.readFileSync(absolutePath, "utf8");
  const parsed = yaml.load(raw) as SkillDockyardConfig;
  return {
    ...parsed,
    repos: parsed.repos ?? []
  };
}

export function validateConfig(config: SkillDockyardConfig) {
  const errors: string[] = [];
  if (!Array.isArray(config.repos)) errors.push("repos must be an array.");
  for (const [index, repo] of (config.repos ?? []).entries()) {
    if (!repo.path) errors.push(`repos[${index}].path is required.`);
  }
  return errors;
}
