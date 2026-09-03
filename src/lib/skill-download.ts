import { Buffer } from "node:buffer";
import matter from "gray-matter";
import type { ArtifactDetail, ArtifactVersion } from "@/lib/types";

export type DownloadTarget = "codex" | "claude-code";
export type DownloadOs = "mac" | "windows";

export interface PortableSkillResult {
  eligible: boolean;
  reason: string | null;
}

const portableFrontmatterKeys = new Set(["name", "description"]);

export function getPortableSkillStatus(artifact: Pick<ArtifactDetail, "type" | "approved_version">): PortableSkillResult {
  if (artifact.type !== "claude_skill" && artifact.type !== "skill_folder") {
    return { eligible: false, reason: "Only published skills in your library can be installed in Codex or Claude Code." };
  }
  if (!artifact.approved_version) {
    return { eligible: false, reason: "This skill has not been published yet." };
  }

  const parsed = matter(artifact.approved_version.content_snapshot);
  const keys = Object.keys(parsed.data);
  if (!parsed.data.name || typeof parsed.data.name !== "string" || !parsed.data.description || typeof parsed.data.description !== "string") {
    return { eligible: false, reason: "Add a name and description to the skill before publishing it for download." };
  }
  if (keys.some((key) => !portableFrontmatterKeys.has(key))) {
    return { eligible: false, reason: "This skill uses tool-specific settings, so it cannot be installed as one shared Codex and Claude skill." };
  }

  return { eligible: true, reason: null };
}

export function getDownloadFilename(slug: string, version: Pick<ArtifactVersion, "content_hash">) {
  return `${safeSegment(slug)}-${shortHash(version.content_hash)}.zip`;
}

export function createSkillDownload(input: {
  slug: string;
  name: string;
  version: Pick<ArtifactVersion, "content_hash" | "content_snapshot">;
  target: DownloadTarget;
  os: DownloadOs;
}) {
  const folder = safeSegment(input.slug);
  const files = [
    { name: `${folder}/SKILL.md`, content: input.version.content_snapshot },
    { name: "README.txt", content: buildInstallReadme({ ...input, folder }) }
  ];
  return {
    filename: getDownloadFilename(input.slug, input.version),
    content: createStoredZip(files)
  };
}

function buildInstallReadme(input: { name: string; folder: string; version: Pick<ArtifactVersion, "content_hash">; target: DownloadTarget; os: DownloadOs }) {
  const destination = getInstallDirectory(input.target, input.os);
  const appName = input.target === "codex" ? "Codex" : "Claude Code";
  const reopen = input.target === "codex"
    ? "Start a new Codex session after copying the folder."
    : "Claude Code notices changes to installed skills automatically.";

  return [
    `${input.name} — shared skill`,
    `Published version: ${input.version.content_hash}`,
    "",
    `Install in ${appName}`,
    "1. Double-click this ZIP file to extract it.",
    `2. Open ${destination}.`,
    `3. Drag the ${input.folder} folder into that location. Keep SKILL.md inside the folder.`,
    `4. ${reopen}`,
    "",
    "Updating safely",
    `If a ${input.folder} folder is already there, rename it to ${input.folder}-my-backup before copying this one. This keeps any personal edits safe.`
  ].join("\n");
}

export function getInstallDirectory(target: DownloadTarget, os: DownloadOs) {
  if (target === "codex") return os === "mac" ? "~/.codex/skills/" : "%USERPROFILE%\\.codex\\skills\\";
  return os === "mac" ? "~/.claude/skills/" : "%USERPROFILE%\\.claude\\skills\\";
}

function safeSegment(value: string) {
  const safe = value.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
  return safe || "shared-skill";
}

function shortHash(value: string) {
  return value.replace(/^sha256:/, "").replace(/[^a-z0-9]/gi, "").slice(0, 12) || "published";
}

function createStoredZip(files: Array<{ name: string; content: string }>) {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const name = Buffer.from(file.name, "utf8");
    const content = Buffer.from(file.content, "utf8");
    const crc = crc32(content);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(content.length, 18);
    local.writeUInt32LE(content.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    localParts.push(local, name, content);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(content.length, 20);
    central.writeUInt32LE(content.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, name);
    offset += local.length + name.length + content.length;
  }

  const central = Buffer.concat(centralParts);
  const footer = Buffer.alloc(22);
  footer.writeUInt32LE(0x06054b50, 0);
  footer.writeUInt16LE(files.length, 8);
  footer.writeUInt16LE(files.length, 10);
  footer.writeUInt32LE(central.length, 12);
  footer.writeUInt32LE(offset, 16);
  return Buffer.concat([...localParts, central, footer]);
}

function crc32(input: Buffer) {
  let crc = 0xffffffff;
  for (const byte of input) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
