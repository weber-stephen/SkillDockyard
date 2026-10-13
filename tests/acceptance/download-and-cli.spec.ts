import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { unzipSync, strFromU8 } from "fflate";
import { CURRENT_LEGAL_DOCUMENTS } from "@/lib/legal-documents";

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321", process.env.SUPABASE_SERVICE_ROLE_KEY ?? "test-only-placeholder", { auth: { persistSession: false } });
const password = "SkillDockyard-acceptance-2026";

async function createConfirmedUser(label: string) {
  const email = `${label}-${crypto.randomUUID()}@example.test`;
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) throw new Error(error?.message ?? "Could not create test user");
  const { error: legalError } = await admin.from("legal_acceptances").insert({
    user_id: data.user.id,
    terms_version: CURRENT_LEGAL_DOCUMENTS.termsVersion,
    privacy_version: CURRENT_LEGAL_DOCUMENTS.privacyVersion,
    source: "signup"
  });
  if (legalError) throw new Error(legalError.message);
  return { id: data.user.id, email };
}

async function createPrivateSkill(user: Awaited<ReturnType<typeof createConfirmedUser>>) {
  const { data: workspaceId, error: workspaceError } = await admin.rpc("ensure_personal_workspace", { p_user_id: user.id, p_user_email: user.email, p_workspace_name: `Private ${user.id}` });
  if (workspaceError || !workspaceId) throw new Error(workspaceError?.message ?? "No workspace");
  const { data: repo, error: repoError } = await admin.from("repos").insert({ workspace_id: workspaceId, name: `private-${user.id}`, root_path: `/private/${user.id}` }).select("id").single();
  if (repoError || !repo) throw new Error(repoError?.message ?? "No repository");
  const { data: artifact, error: artifactError } = await admin.from("artifacts").insert({ workspace_id: workspaceId, repo_id: repo.id, name: "Private acceptance skill", slug: `private-${crypto.randomUUID()}`, type: "claude_skill", path: "skills/private/SKILL.md", description: "Private fixture", status: "unreviewed", visibility: "private", created_by_user_id: user.id }).select("id").single();
  if (artifactError || !artifact) throw new Error(artifactError?.message ?? "No artifact");
  const content = "---\nname: private-acceptance\ndescription: A private acceptance skill.\n---\n\nPrivate current content.";
  const hash = `sha256:${crypto.createHash("sha256").update(content).digest("hex")}`;
  const { data: version, error: versionError } = await admin.from("artifact_versions").insert({ artifact_id: artifact.id, content_hash: hash, content_snapshot: content, status: "unreviewed", tools: [], mcp_servers: [], tags: [] }).select("id").single();
  if (versionError || !version) throw new Error(versionError?.message ?? "No version");
  const { error: updateError } = await admin.from("artifacts").update({ current_version_id: version.id }).eq("id", artifact.id);
  if (updateError) throw new Error(updateError.message);
  return { id: artifact.id, content };
}

async function login(page: Page, email: string) {
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (error || !data.properties.hashed_token) throw new Error(error?.message ?? "Could not create a local browser session");
  await page.goto(`/auth/confirm?token_hash=${encodeURIComponent(data.properties.hashed_token)}&type=magiclink&next=/app`);
  await expect(page).toHaveURL(/\/app/);
}

test("APP-002 and APP-011 only let a private-draft creator download current ZIP content", async ({ page }) => {
  const creator = await createConfirmedUser("private-creator");
  const outsider = await createConfirmedUser("private-outsider");
  const skill = await createPrivateSkill(creator);
  await login(page, creator.email);
  const ownerDownload = await page.evaluate(async (id) => {
    const response = await fetch(`/api/artifacts/${id}/download?target=codex&os=mac`);
    return { status: response.status, body: Array.from(new Uint8Array(await response.arrayBuffer())) };
  }, skill.id);
  expect(ownerDownload.status).toBe(200);
  const contents = Object.values(unzipSync(Uint8Array.from(ownerDownload.body))).map((entry) => strFromU8(entry));
  expect(contents).toContain("---\nname: private-acceptance\ndescription: A private acceptance skill.\n---\n\nPrivate current content.");

  await page.getByRole("button", { name: "Log out" }).click();
  await login(page, outsider.email);
  const denied = await page.evaluate(async (id) => (await fetch(`/api/artifacts/${id}/download?target=codex&os=mac`)).status, skill.id);
  expect(denied).toBe(404);
});

test("APP-012 packaged connected-computer update leaves local SKILL.md untouched @connected-computer", async () => {
  const user = await createConfirmedUser("cli-user");
  const { data: workspaceId, error } = await admin.rpc("ensure_personal_workspace", { p_user_id: user.id, p_user_email: user.email, p_workspace_name: "CLI acceptance workspace" });
  if (error || !workspaceId) throw new Error(error?.message ?? "No workspace");
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const { error: tokenError } = await admin.from("cli_tokens").insert({ user_id: user.id, workspace_id: workspaceId, token_hash: tokenHash, token_hint: token.slice(-6), expires_at: new Date(Date.now() + 3_600_000).toISOString() });
  if (tokenError) throw new Error(tokenError.message);

  const root = fs.mkdtempSync(path.join(os.tmpdir(), "skill-dockyard-cli-"));
  try {
    const home = path.join(root, "home");
    const artifactId = crypto.randomUUID();
    const slug = "local-change";
    const skillPath = path.join(home, ".codex", "skills", slug, "SKILL.md");
    fs.mkdirSync(path.dirname(skillPath), { recursive: true });
    fs.writeFileSync(skillPath, "# locally modified\n", "utf8");
    const originalHash = `sha256:${crypto.createHash("sha256").update("# original\n").digest("hex")}`;
    const configPath = path.join(home, ".config", "skill-dockyard", "config.json");
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify({ endpoint: "http://127.0.0.1:4319", token, deviceId: crypto.randomUUID(), installs: [{ artifactId, versionId: crypto.randomUUID(), slug, target: "codex", path: skillPath, contentHash: originalHash }] }), "utf8");
    const npmEnv = { ...process.env, NPM_CONFIG_CACHE: path.join(root, "npm-cache") };
    const packed = spawnSync("npm", ["pack", "--pack-destination", root], { cwd: process.cwd(), env: npmEnv, encoding: "utf8" });
    expect(packed.status, packed.stderr).toBe(0);
    const archive = fs.readdirSync(root).find((file) => file.endsWith(".tgz"))!;
    const installed = path.join(root, "installed");
    const npmInstall = spawnSync("npm", ["install", "--ignore-scripts", "--prefix", installed, path.join(root, archive)], { cwd: process.cwd(), env: npmEnv, encoding: "utf8" });
    expect(npmInstall.status, npmInstall.stderr).toBe(0);
    const command = path.join(installed, "node_modules", "skill-dockyard", "bin", "run.js");
    const result = spawnSync(process.execPath, [command, "update", artifactId, "--target", "codex"], { env: { ...process.env, HOME: home }, encoding: "utf8" });
    expect(result.status).toBe(0);
    expect(`${result.stdout}${result.stderr}`).toContain("has local changes");
    expect(fs.readFileSync(skillPath, "utf8")).toBe("# locally modified\n");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
