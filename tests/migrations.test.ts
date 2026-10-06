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

  it("provisions a personal workspace atomically and fails closed on inconsistent ownership", () => {
    const sql = fs.readFileSync(path.resolve("supabase/migrations/20261003151241_ensure_personal_workspace.sql"), "utf8");
    expect(sql).toContain("pg_advisory_xact_lock");
    expect(sql).toContain("owner_membership_count <> 1");
    expect(sql).toContain("raise exception 'Personal workspace ownership is inconsistent'");
    expect(sql).toContain("insert into public.workspace_members");
    expect(sql).toContain("insert into public.audit_events");
    expect(sql).toContain("revoke all on function public.ensure_personal_workspace(uuid, text, text) from public, anon, authenticated");
    expect(sql).toContain("grant execute on function public.ensure_personal_workspace(uuid, text, text) to service_role");
  });

  it("guards duplicate and rollback paths during personal workspace provisioning", () => {
    const sql = fs.readFileSync(path.resolve("supabase/migrations/20261003151241_ensure_personal_workspace.sql"), "utf8");
    expect(sql).toContain("pg_advisory_xact_lock");
    expect(sql).toContain("owner_membership_count <> 1");
    expect(sql).toContain("insert into public.workspaces (name, owner_user_id)");
    expect(sql).toContain("insert into public.workspace_members (workspace_id, user_id, email, role)");
    expect(sql).toContain("insert into public.audit_events");
    expect(sql).toContain("return workspace_row.id;");
  });

  it("keeps share lifecycle mutations and their audit events in one transaction", () => {
    const sql = fs.readFileSync(path.resolve("supabase/migrations/20261003152854_atomic_share_lifecycle.sql"), "utf8");
    for (const fn of ["create_artifact_share", "respond_to_artifact_share", "revoke_artifact_share"]) {
      expect(sql).toContain(`function public.${fn}`);
      expect(sql).toContain(`revoke all on function public.${fn}`);
    }
    expect(sql.match(/insert into public\.audit_events/g)?.length).toBe(3);
    expect(sql).toContain("email_confirmed_at is not null");
    expect(sql).toContain("role in ('owner', 'reviewer')");
  });

  it("makes legacy workflow function security and execute grants explicit", () => {
    const sql = fs.readFileSync(path.resolve("supabase/migrations/20261003153210_harden_function_execution.sql"), "utf8");
    expect(sql).toContain("alter function public.promote_private_artifact(uuid, uuid, text) security invoker");
    expect(sql).toContain("alter function public.decide_proposal(uuid, uuid, text, text, text) security invoker");
    expect(sql).toContain("function public.decide_legacy_artifact");
    expect(sql).toContain("insert into public.approvals");
    expect(sql).toContain("insert into public.audit_events");
    expect(sql).toContain("from public, anon, authenticated");
  });

  it("removes redundant service-role policies while leaving RLS enabled", () => {
    const sql = fs.readFileSync(path.resolve("supabase/migrations/20261003154937_remove_redundant_service_role_policies.sql"), "utf8");
    expect(sql).toContain("service_role has BYPASSRLS");
    expect(sql.match(/drop policy if exists/g)?.length).toBeGreaterThanOrEqual(24);
    expect(sql).not.toContain("disable row level security");
  });

  it("removes direct browser table grants while preserving server-side access", () => {
    const sql = fs.readFileSync(path.resolve("supabase/migrations/20261005220703_revoke_browser_table_grants.sql"), "utf8");
    expect(sql).toContain("revoke all privileges on all tables in schema public from anon, authenticated");
    expect(sql).toContain("alter default privileges in schema public");
    expect(sql).toContain("revoke all privileges on tables from anon, authenticated");
    expect(sql).not.toContain("revoke all privileges on all tables in schema public from service_role");
  });

  it("adds covering indexes for the unindexed production foreign keys", () => {
    const sql = fs.readFileSync(path.resolve("supabase/migrations/20261005221243_add_foreign_key_indexes.sql"), "utf8");
    expect(sql.match(/create index if not exists/g)?.length).toBe(31);
    expect(sql).toContain("approvals_artifact_id_fkey_index");
    expect(sql).toContain("proposals_supersedes_proposal_id_fkey_index");
    expect(sql).toContain("workspace_invites_invited_by_user_id_fkey_index");
  });

  it("keeps legal acceptance records append-only and inaccessible to browser roles", () => {
    const sql = fs.readFileSync(path.resolve("supabase/migrations/20261006044659_legal_acceptances.sql"), "utf8");
    expect(sql).toContain("create table public.legal_acceptances");
    expect(sql).toContain("user_id uuid not null references auth.users(id) on delete cascade");
    expect(sql).toContain("terms_version text not null");
    expect(sql).toContain("privacy_version text not null");
    expect(sql).toContain("alter table public.legal_acceptances enable row level security");
    expect(sql).toContain("revoke all on table public.legal_acceptances from anon, authenticated");
    expect(sql).not.toMatch(/create policy/i);
  });
});
