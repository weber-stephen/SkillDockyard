import crypto from "node:crypto";
import { expect, test, type APIRequestContext } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const localUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "test-only-placeholder";
const mailpitUrl = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";
const admin = createClient(localUrl, serviceRole, { auth: { persistSession: false } });

type MailMessage = { ID: string; To: Array<{ Address: string }>; From?: { Address?: string } | Array<{ Address: string }>; Subject?: string; Text?: string; HTML?: string };

async function confirmationFor(request: APIRequestContext, recipient: string) {
  let id = "";
  await expect.poll(async () => {
    const response = await request.get(`${mailpitUrl}/api/v1/messages?query=to:${encodeURIComponent(recipient)}`);
    const body = await response.json() as { messages?: MailMessage[] };
    return body.messages?.find((message) => message.To.some((item) => item.Address === recipient))?.ID ?? null;
  }, { timeout: 30_000, intervals: [250, 500, 1_000] }).not.toBeNull();
  const response = await request.get(`${mailpitUrl}/api/v1/messages?query=to:${encodeURIComponent(recipient)}`);
  const body = await response.json() as { messages: MailMessage[] };
  id = body.messages.find((message) => message.To.some((item) => item.Address === recipient))!.ID;
  const detail = await request.get(`${mailpitUrl}/api/v1/message/${id}`);
  return await detail.json() as MailMessage;
}

test("APP-001 signup sends a confirmation email and provisions one workspace @email", async ({ page, request }) => {
  const recipient = `signup-${crypto.randomUUID()}@example.test`;
  const password = "SkillDockyard-acceptance-2026";
  await page.goto("/signup");
  await page.getByLabel("Email").fill(recipient);
  await page.getByLabel("Password").fill(password);
  await page.locator('input[type="checkbox"]').nth(0).check();
  await page.locator('input[type="checkbox"]').nth(1).check();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("status")).toContainText("Check your email");

  const message = await confirmationFor(request, recipient);
  const from = Array.isArray(message.From) ? message.From[0]?.Address : message.From?.Address;
  const body = `${message.Text ?? ""}\n${message.HTML ?? ""}`;
  const link = body.match(/http:\/\/127\.0\.0\.1:4319\/auth\/confirm[^\s"<]+/i)?.[0];
  expect(message.To.some((item) => item.Address === recipient)).toBe(true);
  expect(from).toBe("noreply@skilldockyard.test");
  expect(message.Subject).toBe("Confirm your Skill Dockyard account");
  expect(link, "confirmation link should use the active local server origin").toBeTruthy();

  await page.goto(link!.replaceAll("&amp;", "&"));
  await expect(page).toHaveURL(/\/app/);
  const { data: user } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const account = user.users.find((item) => item.email === recipient)!;
  expect(account.email_confirmed_at).toBeTruthy();
  const [{ data: workspaces }, { data: memberships }] = await Promise.all([
    admin.from("workspaces").select("id").eq("owner_user_id", account.id),
    admin.from("workspace_members").select("workspace_id, role").eq("user_id", account.id).eq("role", "owner")
  ]);
  expect(workspaces).toHaveLength(1);
  expect(memberships).toEqual([{ workspace_id: workspaces![0].id, role: "owner" }]);
});
