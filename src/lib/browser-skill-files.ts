import { unzipSync } from "fflate";
import { getImportedSkillMetadata, isSkillInstructionPath, normalizeImportPath, type ImportedSkillMetadata } from "@/lib/skill-import";

export const BROWSER_IMPORT_LIMITS = {
  maxArchiveBytes: 20 * 1024 * 1024,
  maxExpandedBytes: 50 * 1024 * 1024,
  maxFiles: 5_000,
  maxSkills: 100,
  maxSelectedContentBytes: 1_500_000,
  maxSkillBytes: 256 * 1024
} as const;

export interface BrowserImportCandidate {
  id: string;
  path: string;
  content: string;
  metadata: ImportedSkillMetadata;
  supportingFiles: string[];
}

export interface BrowserImportParseResult {
  candidates: BrowserImportCandidate[];
  warnings: string[];
}

type VirtualFile = { path: string; bytes: Uint8Array };

export async function parseBrowserImport(files: File[]): Promise<BrowserImportParseResult> {
  if (!files.length) throw new Error("Choose a folder or ZIP file to continue.");
  if (files.length === 1 && files[0].name.toLowerCase().endsWith(".zip")) return parseVirtualFiles(Object.entries(await readZip(files[0])).map(([path, bytes]) => ({ path, bytes })));
  return parseVirtualFiles(await Promise.all(files.map(async (file) => ({
    path: file.webkitRelativePath || file.name,
    bytes: new Uint8Array(await file.arrayBuffer())
  }))));
}

async function readZip(file: File) {
  if (file.size > BROWSER_IMPORT_LIMITS.maxArchiveBytes) throw new Error("This ZIP file is too large. Choose one smaller than 20 MB.");
  try {
    return unzipSync(new Uint8Array(await file.arrayBuffer()));
  } catch {
    throw new Error("We could not read this ZIP file. Choose a standard, unencrypted ZIP.");
  }
}

function parseVirtualFiles(files: VirtualFile[]): BrowserImportParseResult {
  if (files.length > BROWSER_IMPORT_LIMITS.maxFiles) throw new Error("This selection contains too many files.");
  const sourceFiles = files.filter((file) => !file.path.endsWith("/"));
  const normalized = sourceFiles.flatMap((file) => {
    const path = normalizeImportPath(file.path);
    return path ? [{ ...file, path }] : [];
  });
  if (normalized.length !== sourceFiles.length) throw new Error("This selection includes an unsafe file path.");
  const seen = new Set<string>();
  if (normalized.some((file) => seen.has(file.path) || !seen.add(file.path))) throw new Error("This selection includes duplicate file paths.");
  const expandedBytes = normalized.reduce((total, file) => total + file.bytes.byteLength, 0);
  if (expandedBytes > BROWSER_IMPORT_LIMITS.maxExpandedBytes) throw new Error("This selection expands to more than 50 MB.");

  const candidates = normalized.filter((file) => isSkillInstructionPath(file.path)).map((file) => {
    if (file.bytes.byteLength > BROWSER_IMPORT_LIMITS.maxSkillBytes) throw new Error(`${file.path} is too large to import.`);
    let content: string;
    try { content = new TextDecoder("utf-8", { fatal: true }).decode(file.bytes); } catch { throw new Error(`${file.path} is not a readable UTF-8 skill file.`); }
    const folder = file.path.includes("/") ? file.path.slice(0, file.path.lastIndexOf("/")) : "";
    const supportingFiles = normalized.filter((other) => other.path !== file.path && !isSkillInstructionPath(other.path) && (folder ? other.path.startsWith(`${folder}/`) : !other.path.includes("/"))).map((other) => other.path);
    return { id: file.path, path: file.path, content, metadata: getImportedSkillMetadata(content, file.path), supportingFiles };
  });
  if (!candidates.length) throw new Error("No SKILL.md files were found. Choose a skill folder or ZIP file that contains one.");
  if (candidates.length > BROWSER_IMPORT_LIMITS.maxSkills) throw new Error("This selection contains more than 100 skills. Choose a smaller set.");
  return { candidates, warnings: normalized.some((file) => !isSkillInstructionPath(file.path)) ? ["Only SKILL.md instructions will be imported. Supporting files stay on your computer."] : [] };
}
