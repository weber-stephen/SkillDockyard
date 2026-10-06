import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { safeLocalPath } from "@/lib/safe-redirect";

describe("production security controls", () => {
  it("rejects external and ambiguous continuation paths", () => {
    expect(safeLocalPath("/app/artifacts")).toBe("/app/artifacts");
    for (const unsafe of ["https://evil.example", "//evil.example", "/\\evil.example", null]) {
      expect(safeLocalPath(unsafe)).toBe("/app");
    }
  });

  it("sets the required browser security policies and checks mutation origins", () => {
    const source = fs.readFileSync(path.resolve("src/proxy.ts"), "utf8");
    for (const header of ["Content-Security-Policy", "Strict-Transport-Security", "Referrer-Policy", "X-Content-Type-Options", "X-Frame-Options", "Permissions-Policy"]) {
      expect(source).toContain(header);
    }
    expect(source).toContain("isCrossOriginMutation");
    expect(source).toContain("sec-fetch-site");
    expect(source).toContain("allowed.has(origin)");
  });

  it("keeps server credentials out of public environment names", () => {
    const files = [".env.example", "src/lib/supabase/server.ts", "src/lib/rate-limit.ts"];
    for (const file of files) {
      const source = fs.readFileSync(path.resolve(file), "utf8");
      expect(source).not.toMatch(/NEXT_PUBLIC_(?:SUPABASE_SERVICE_ROLE_KEY|UPSTASH_REDIS_REST_TOKEN|SENTRY_AUTH_TOKEN)/);
    }
  });

  it("keeps non-essential performance tracing disabled while retaining error scrubbing", () => {
    const source = fs.readFileSync(path.resolve("src/lib/sentry-options.ts"), "utf8");
    expect(source).toMatch(/tracesSampleRate:\s*0/);
    expect(source).toContain("beforeSend(event)");
    expect(source).toContain("delete event.request.cookies");
    expect(source).toContain("delete event.request.data");
    expect(source).toContain("delete event.request.headers");
  });

  it("routes public signup through server-side controls", () => {
    const source = fs.readFileSync(path.resolve("src/components/auth-form.tsx"), "utf8");
    const route = fs.readFileSync(path.resolve("src/app/api/signup/route.ts"), "utf8");
    const operations = fs.readFileSync(path.resolve("docs/public-beta-owner-runbook.md"), "utf8");
    expect(source).not.toContain("client.auth.signUp(");
    expect(route).toContain("isSelfServiceSignupEnabled");
    expect(route).toContain("acceptedTerms: z.literal(true)");
    expect(route).toContain("acceptedPrivacy: z.literal(true)");
    expect(route).toContain("captchaToken");
    expect(route).toContain("actionRateLimit(\"signup\"");
    expect(operations).toContain("SELF_SERVICE_SIGNUP_ENABLED=true");
    expect(operations).toContain("Allow new users to sign up");
  });

  it("keeps legal acceptance server-managed and gates application access", () => {
    const migration = fs.readFileSync(path.resolve("supabase/migrations/20261006044659_legal_acceptances.sql"), "utf8");
    const acceptance = fs.readFileSync(path.resolve("src/lib/legal-acceptance.ts"), "utf8");
    const layout = fs.readFileSync(path.resolve("src/app/app/layout.tsx"), "utf8");
    expect(migration).toContain("alter table public.legal_acceptances enable row level security");
    expect(migration).toContain("revoke all on table public.legal_acceptances from anon, authenticated");
    expect(migration).toContain("source in ('signup', 'reacceptance')");
    expect(acceptance).toContain("createServerSupabase");
    expect(layout).toContain("hasCurrentLegalAcceptance(user.id)");
    expect(layout).toContain("isSelfServiceSignupEnabled()");
    expect(layout).toContain('redirect("/legal/accept?next=/app"');
  });
});
