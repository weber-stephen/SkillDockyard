import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migration = () => fs.readFileSync(path.resolve("supabase/migrations/20261013090000_data_007_008_authorization_and_atomic_audits.sql"), "utf8");

describe("DATA-007 / DATA-008 server boundaries", () => {
  it("moves proposal submission, withdrawal, and export recording behind server-only transactional RPCs", () => {
    const sql = migration();
    for (const fn of ["submit_artifact_proposal", "withdraw_proposal", "record_workspace_export", "decide_proposal"]) {
      expect(sql).toContain(`function public.${fn}`);
      expect(sql).toContain(`revoke all on function public.${fn}`);
      expect(sql).toContain(`grant execute on function public.${fn}`);
    }
    expect(sql).toContain("insert into public.audit_events");
    expect(sql).toContain("for update");
    expect(sql).toContain("assert_workspace_owner_consistency");
  });

  it("keeps direct HTTP entry points behind the transactional write functions", () => {
    const submissionRoute = fs.readFileSync(path.resolve("src/app/api/submissions/route.ts"), "utf8");
    const withdrawalRoute = fs.readFileSync(path.resolve("src/app/api/proposals/[id]/withdraw/route.ts"), "utf8");
    const exportRoute = fs.readFileSync(path.resolve("src/app/api/export/route.ts"), "utf8");
    expect(submissionRoute).toContain('rpc("submit_artifact_proposal"');
    expect(withdrawalRoute).toContain('rpc("withdraw_proposal"');
    expect(exportRoute).toContain('rpc("record_workspace_export"');
    expect(withdrawalRoute).not.toContain('.from("proposals")');
  });
});
