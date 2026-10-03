-- The service_role has BYPASSRLS. These permissive policies are redundant and
-- cause every service-role query to be flagged by the RLS init-plan advisor.
-- Keep RLS enabled and retain the explicit table grants.
drop policy if exists "service role full access workspaces" on public.workspaces;
drop policy if exists "service role full access workspace_members" on public.workspace_members;
drop policy if exists "service role full access workspace_settings" on public.workspace_settings;
drop policy if exists "service role full access workspace settings" on public.workspace_settings;
drop policy if exists "service role full access repos" on public.repos;
drop policy if exists "service role full access scan_runs" on public.scan_runs;
drop policy if exists "service role full access artifacts" on public.artifacts;
drop policy if exists "service role full access artifact_versions" on public.artifact_versions;
drop policy if exists "service role full access risk_flags" on public.risk_flags;
drop policy if exists "service role full access approvals" on public.approvals;
drop policy if exists "service role full access export_runs" on public.export_runs;
drop policy if exists "service role full access audit_events" on public.audit_events;
drop policy if exists "service role full access workspace onboarding" on public.workspace_onboarding;
drop policy if exists "service role full access workspace scan tokens" on public.workspace_scan_tokens;
drop policy if exists "service role full access artifact shares" on public.artifact_shares;
drop policy if exists "service role full access proposals" on public.proposals;
drop policy if exists "service role full access proposal reviews" on public.proposal_reviews;
drop policy if exists "service role full access notifications" on public.notifications;
drop policy if exists "service role full access workspace invites" on public.workspace_invites;
drop policy if exists "service role full access cli pairing codes" on public.cli_pairing_codes;
drop policy if exists "service role full access cli tokens" on public.cli_tokens;
drop policy if exists "service role full access skill downloads" on public.skill_downloads;
drop policy if exists "service role full access skill installations" on public.skill_installations;
drop policy if exists "service role full access user_accounts" on public.user_accounts;
