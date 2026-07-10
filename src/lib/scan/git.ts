import { execFileSync } from "node:child_process";
import path from "node:path";

function runGit(repoRoot: string, args: string[]) {
  try {
    return execFileSync("git", args, {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
  } catch {
    return null;
  }
}

export function getCommitSha(repoRoot: string, filePath?: string) {
  const args = filePath ? ["log", "-n", "1", "--pretty=format:%H", "--", filePath] : ["rev-parse", "HEAD"];
  return runGit(repoRoot, args);
}

export function getBranch(repoRoot: string) {
  return runGit(repoRoot, ["rev-parse", "--abbrev-ref", "HEAD"]);
}

export function getLastModifier(repoRoot: string, filePath: string) {
  return runGit(repoRoot, ["log", "-n", "1", "--pretty=format:%an <%ae>", "--", filePath]);
}

export function getRepoName(repoRoot: string) {
  const remote = runGit(repoRoot, ["config", "--get", "remote.origin.url"]);
  if (!remote) return path.basename(repoRoot);
  return remote.replace(/\.git$/, "").split(/[/:]/).pop() ?? path.basename(repoRoot);
}
