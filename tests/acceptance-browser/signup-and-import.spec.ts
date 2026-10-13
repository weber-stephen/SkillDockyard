import crypto from "node:crypto";
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { strToU8, zipSync } from "fflate";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false } });
const password = "SkillDockyard-acceptance-2026";

function email(label: string) {
  return `${label}-${crypto.randomUUID()}@example.com`;
}

async function createConfirmedAccount() {
  const accountEmail = email("browser-import");
  const { data, error } = await supabase.auth.admin.createUser({ email: accountEmail, password, email_confirm: true });
  if (error || !data.user) throw new Error(error?.message ?? "Could not create browser acceptance user.");
  const user = data.user;
  const { error: workspaceError } = await supabase.rpc("ensure_personal_workspace", {
    p_user_id: user.id,
    p_user_email: accountEmail,
    p_workspace_name: "Browser acceptance workspace"
  });
  if (workspaceError) throw new Error(workspaceError.message);
  const { error: legalError } = await supabase.from("legal_acceptances").insert({
    user_id: user.id,
    terms_version: "October 6, 2026",
    privacy_version: "October 6, 2026",
    source: "signup"
  });
  if (legalError) throw new Error(legalError.message);
  return { email: accountEmail };
}

async function signIn(page: Page, accountEmail: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(accountEmail);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/app(?:$|\?)/);
}

async function confirmationLink(request: APIRequestContext, recipient: string) {
  let messageId: string | null = null;
  await expect.poll(async () => {
    const response = await request.get(`http://127.0.0.1:54324/api/v1/messages?query=to:${encodeURIComponent(recipient)}`);
    const body = await response.json() as { messages?: Array<{ ID?: string; To?: Array<{ Address?: string }> }> };
    messageId = body.messages?.find((message) => message.To?.some((address) => address.Address === recipient))?.ID ?? null;
    return messageId;
  }, { timeout: 30_000, intervals: [250, 500, 1_000] }).not.toBeNull();

  const response = await request.get(`http://127.0.0.1:54324/api/v1/message/${messageId}`);
  const message = await response.json() as { Subject?: string; From?: { Address?: string }; Text?: string; HTML?: string };
  expect(message.Subject).toMatch(/confirm/i);
  expect(message.From?.Address).toBeTruthy();
  const link = `${message.Text ?? ""}\n${message.HTML ?? ""}`.match(/https?:\/\/[^\s"'<]+/i)?.[0];
  if (!link) throw new Error("Confirmation email did not include a link.");
  const decoded = link.replace(/&amp;/g, "&");
  expect(new URL(decoded).pathname).toBe("/auth/confirm");
  return decoded;
}

test("a signup confirmation email creates a usable personal workspace", async ({ page, request }) => {
  const accountEmail = email("signup");
  await page.goto("/signup");
  await page.getByLabel("Email").fill(accountEmail);
  await page.getByLabel("Password").fill(password);
  await page.locator('input[type="checkbox"]').nth(0).check();
  await page.locator('input[type="checkbox"]').nth(1).check();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("status")).toContainText("Check your email");

  await page.goto(await confirmationLink(request, accountEmail));
  await expect(page).toHaveURL(/\/app(?:$|\?)/);
  await expect(page.getByRole("link", { name: "Skills", exact: true })).toBeVisible();
});

test("an authenticated user imports a ZIP as a private draft", async ({ page }) => {
  const account = await createConfirmedAccount();
  await signIn(page, account.email);
  await page.goto("/import");
  const archive = zipSync({
    "release-captain/SKILL.md": strToU8("---\nname: Release Captain\ndescription: Prepare a safe release.\n---\n\n# Release Captain\n\nVerify the rollback plan.")
  });
  await page.locator('input[accept=".zip,application/zip"]').setInputFiles({ name: "release-captain.zip", mimeType: "application/zip", buffer: Buffer.from(archive) });
  await expect(page.getByText("Release Captain", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Save 1 private draft/ }).click();
  await expect(page.getByRole("status")).toContainText("saved as private draft");
});
