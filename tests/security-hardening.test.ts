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
});
