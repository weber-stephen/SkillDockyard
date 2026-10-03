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

    for (const relation of ["artifact_catalog", "artifact_shares", "workspace_onboarding", "workspace_scan_tokens", "workspace_settings", "proposals", "proposal_reviews", "notifications"]) {
      expect(migrationSql).toContain(relation);
    }
  });

  it("declares proposal lifecycle states and one pending proposal per artifact", () => {
    const migrationDirectory = path.resolve("supabase/migrations");
    const migrationSql = fs.readdirSync(migrationDirectory).filter((file) => file.endsWith(".sql")).sort().map((file) => fs.readFileSync(path.join(migrationDirectory, file), "utf8")).join("\n");
    expect(migrationSql).toContain("create type proposal_status");
    expect(migrationSql).toContain("proposals_one_pending_per_artifact");
    expect(migrationSql).toContain("changes_requested");
  });

  it("adds private artifact ownership and promotion support", () => {
    const migrationDirectory = path.resolve("supabase/migrations");
    const migrationSql = fs.readdirSync(migrationDirectory).filter((file) => file.endsWith(".sql")).sort().map((file) => fs.readFileSync(path.join(migrationDirectory, file), "utf8")).join("\n");
    expect(migrationSql).toContain("create type artifact_visibility");
    expect(migrationSql).toContain("created_by_user_id");
    expect(migrationSql).toContain("promote_private_artifact");
  });

  it("adds private CLI adoption tracking with indexed access paths", () => {
    const sql = fs.readFileSync(path.resolve("supabase/migrations/20260920030947_feedback_adoption_updates.sql"), "utf8");
    for (const relation of ["cli_pairing_codes", "cli_tokens", "skill_downloads", "skill_installations"]) {
      expect(sql).toContain(`create table ${relation}`);
      expect(sql).toContain(`alter table ${relation} enable row level security`);
    }
    expect(sql).toContain("notifications_skill_update_unique");
    expect(sql).toContain("artifacts_creator_template_unique");
  });

  it("declares secure workspace membership administration", () => {
    const migrationDirectory = path.resolve("supabase/migrations");
    const migrationSql = fs.readdirSync(migrationDirectory).filter((file) => file.endsWith(".sql")).sort().map((file) => fs.readFileSync(path.join(migrationDirectory, file), "utf8")).join("\n");
    expect(migrationSql).toContain("workspace_invites");
    expect(migrationSql).toContain("invite_workspace_member");
    expect(migrationSql).toContain("accept_workspace_invite");
    expect(migrationSql).toContain("rename_workspace");
    expect(migrationSql).toContain("workspace_invites_pending_email_unique");
  });

  it("creates a server-managed free account for every auth user", () => {
    const sql = fs.readFileSync(path.resolve("supabase/migrations/20260922042204_add_user_accounts.sql"), "utf8");
    const accessSql = fs.readFileSync(path.resolve("supabase/migrations/20260922042509_restrict_user_account_access.sql"), "utf8");
    const serviceRoleSql = fs.readFileSync(path.resolve("supabase/migrations/20260922042825_grant_service_role_user_account_type.sql"), "utf8");

    expect(sql).toContain("create type public.user_account_type as enum ('free', 'paid')");
    expect(sql).toContain("user_id uuid primary key references auth.users(id) on delete cascade");
    expect(sql).toContain("account_type public.user_account_type not null default 'free'");
    expect(sql).toContain("alter table public.user_accounts enable row level security");
    expect(sql).toContain("to service_role");
    expect(sql).toContain("create schema skill_dockyard_private");
    expect(sql).toContain("create function skill_dockyard_private.handle_new_user_account()");
    expect(sql).toContain("create trigger create_user_account_after_auth_user_insert");
    expect(sql).toContain("insert into public.user_accounts (user_id)\nselect id\nfrom auth.users");
    expect(accessSql).toContain("revoke all privileges on table public.user_accounts from public, anon, authenticated");
    expect(accessSql).toContain("revoke all privileges on type public.user_account_type from public, anon, authenticated");
    expect(serviceRoleSql).toContain("grant usage on type public.user_account_type to service_role");
  });
});
