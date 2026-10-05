-- Cover every production foreign key that is not already covered by the
-- leading columns of an existing index. These indexes support joins,
-- deletes/updates of referenced rows, and the server-side access paths used by
-- the application. Keep the intentionally low-traffic product indexes from
-- earlier migrations; Supabase's unused-index advisor is not actionable while
-- the production dataset is still empty.

create index if not exists approvals_artifact_id_fkey_index on public.approvals (artifact_id);
create index if not exists approvals_artifact_version_id_fkey_index on public.approvals (artifact_version_id);

create index if not exists artifact_shares_created_by_user_id_fkey_index on public.artifact_shares (created_by_user_id);
create index if not exists artifact_shares_source_workspace_id_fkey_index on public.artifact_shares (source_workspace_id);

create index if not exists artifact_versions_created_by_user_id_fkey_index on public.artifact_versions (created_by_user_id);
create index if not exists artifact_versions_scan_run_id_fkey_index on public.artifact_versions (scan_run_id);
create index if not exists artifact_versions_source_share_id_fkey_index on public.artifact_versions (source_share_id);

create index if not exists artifacts_approved_version_id_fkey_index on public.artifacts (approved_version_id);
create index if not exists artifacts_current_version_id_fkey_index on public.artifacts (current_version_id);
create index if not exists artifacts_repo_id_fkey_index on public.artifacts (repo_id);

create index if not exists audit_events_artifact_id_fkey_index on public.audit_events (artifact_id);
create index if not exists audit_events_workspace_id_fkey_index on public.audit_events (workspace_id);

create index if not exists cli_pairing_codes_user_id_fkey_index on public.cli_pairing_codes (user_id);
create index if not exists cli_pairing_codes_workspace_id_fkey_index on public.cli_pairing_codes (workspace_id);
create index if not exists cli_tokens_workspace_id_fkey_index on public.cli_tokens (workspace_id);
create index if not exists export_runs_workspace_id_fkey_index on public.export_runs (workspace_id);

create index if not exists notifications_artifact_id_fkey_index on public.notifications (artifact_id);
create index if not exists notifications_artifact_version_id_fkey_index on public.notifications (artifact_version_id);
create index if not exists notifications_proposal_id_fkey_index on public.notifications (proposal_id);

create index if not exists proposal_reviews_reviewer_user_id_fkey_index on public.proposal_reviews (reviewer_user_id);

create index if not exists proposals_base_version_id_fkey_index on public.proposals (base_version_id);
create index if not exists proposals_resolved_by_user_id_fkey_index on public.proposals (resolved_by_user_id);
create index if not exists proposals_source_share_id_fkey_index on public.proposals (source_share_id);
create index if not exists proposals_supersedes_proposal_id_fkey_index on public.proposals (supersedes_proposal_id);

create index if not exists risk_flags_artifact_id_fkey_index on public.risk_flags (artifact_id);
create index if not exists risk_flags_artifact_version_id_fkey_index on public.risk_flags (artifact_version_id);
create index if not exists scan_runs_workspace_id_fkey_index on public.scan_runs (workspace_id);
create index if not exists skill_downloads_artifact_version_id_fkey_index on public.skill_downloads (artifact_version_id);
create index if not exists skill_installations_artifact_version_id_fkey_index on public.skill_installations (artifact_version_id);

create index if not exists workspace_invites_accepted_by_user_id_fkey_index on public.workspace_invites (accepted_by_user_id);
create index if not exists workspace_invites_invited_by_user_id_fkey_index on public.workspace_invites (invited_by_user_id);
