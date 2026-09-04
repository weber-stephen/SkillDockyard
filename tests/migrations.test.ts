import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Supabase migration coverage", () => {
  it("declares every feature relation used by the live data layer", () => {
    const migrationDirectory = path.resolve("supabase/migrations");
    const migrationSql = fs
      .readdirSync(migrationDirectory)
      .filter((file) => file.endsWith(".sql"))
      .sort()
      .map((file) => fs.readFileSync(path.join(migrationDirectory, file), "utf8"))
      .join("\n");

    for (const relation of ["artifact_catalog", "artifact_shares", "workspace_onboarding", "workspace_scan_tokens", "workspace_settings"]) {
      expect(migrationSql).toContain(relation);
    }
  });
});
