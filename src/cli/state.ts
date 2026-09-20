import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export interface CliInstall { artifactId: string; versionId: string; slug: string; target: "codex" | "claude-code"; path: string; contentHash: string }
export interface CliState { endpoint: string; token: string; deviceId: string; installs: CliInstall[] }

export function statePath() {
  const root = process.platform === "win32" ? process.env.APPDATA ?? path.join(os.homedir(), "AppData", "Roaming") : path.join(os.homedir(), ".config");
  return path.join(root, "skill-dockyard", "config.json");
}

export function readState(): CliState {
  const location = statePath();
  if (!fs.existsSync(location)) throw new Error("Run `skill-dockyard connect` first.");
  return JSON.parse(fs.readFileSync(location, "utf8")) as CliState;
}

export function writeState(state: CliState) {
  const location = statePath();
  fs.mkdirSync(path.dirname(location), { recursive: true, mode: 0o700 });
  fs.writeFileSync(location, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 });
  try { fs.chmodSync(location, 0o600); } catch { /* Windows permissions are managed by the OS. */ }
}

export function newDeviceId() { return crypto.randomUUID(); }
export function hashContent(content: string) { return `sha256:${crypto.createHash("sha256").update(content).digest("hex")}`; }
export function installRoot(target: "codex" | "claude-code") { return path.join(os.homedir(), target === "codex" ? ".codex" : ".claude", "skills"); }

export async function api<T>(state: Pick<CliState, "endpoint" | "token">, pathname: string, init: RequestInit = {}) {
  const response = await fetch(`${state.endpoint.replace(/\/$/, "")}${pathname}`, { ...init, headers: { "Content-Type": "application/json", Authorization: `Bearer ${state.token}`, ...(init.headers ?? {}) } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error ?? `Skill Dockyard returned ${response.status}.`);
  return body as T;
}
