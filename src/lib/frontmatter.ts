import { dump, load } from "js-yaml";

export interface ParsedFrontmatter {
  data: Record<string, unknown>;
  content: string;
}

export function parseFrontmatter(source: string): ParsedFrontmatter {
  if (!source.startsWith("---")) return { data: {}, content: source };
  const match = source.match(/^---[\t ]*\r?\n([\s\S]*?)\r?\n---[\t ]*(?:\r?\n|$)/);
  if (!match) return { data: {}, content: source };
  const value = load(match[1]);
  const data = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  return { data, content: source.slice(match[0].length) };
}

export function stringifyFrontmatter(content: string, data: Record<string, unknown>) {
  const yaml = dump(data, { lineWidth: -1, noRefs: true, sortKeys: false }).trimEnd();
  return `---\n${yaml}\n---\n\n${content.replace(/^\s+/, "")}`;
}
