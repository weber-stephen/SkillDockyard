-- Security-relevant state changes that promise audit history must commit together.
-- PostgreSQL runs each function invocation in the caller's transaction, so an audit
-- failure rolls back the corresponding mutation and no successful result is returned.

create or replace function public.promote_private_artifact(
  p_artifact_id uuid,
  p_user_id uuid,
  p_submitter_email text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  artifact_row public.artifacts%rowtype;
  proposal_id uuid;
begin
  select * into artifact_row
  from public.artifacts
  where id = p_artifact_id
  for update;

  if not found then raise exception 'Skill not found'; end if;
  if artifact_row.visibility <> 'private' then raise exception 'This skill is already in the workspace review flow'; end if;
  if artifact_row.created_by_user_id is distinct from p_user_id then raise exception 'Only the private draft owner can submit it for review'; end if;
  if artifact_row.current_version_id is null then raise exception 'This private draft has no version to submit'; end if;

  insert into public.proposals (
    artifact_id, candidate_version_id, base_version_id, workspace_id,
    submitted_by_user_id, submitter_email, kind, status
  ) values (
    artifact_row.id, artifact_row.current_version_id, null, artifact_row.workspace_id,
    p_user_id, p_submitter_email, 'new', 'pending_review'
  ) returning id into proposal_id;

  update public.artifacts
  set visibility = 'workspace', updated_at = now()
  where id = artifact_row.id;

  insert into public.audit_events (workspace_id, artifact_id, actor_name, event_type, metadata)
  values (
    artifact_row.workspace_id,
    artifact_row.id,
    coalesce(nullif(trim(p_submitter_email), ''), 'Workspace member'),
    'skill_submitted',
    jsonb_build_object('proposalId', proposal_id, 'versionId', artifact_row.current_version_id, 'source', 'private_draft')
  );

  return jsonb_build_object(
    'proposalId', proposal_id,
    'artifactId', artifact_row.id,
    'workspaceId', artifact_row.workspace_id,
    'versionId', artifact_row.current_version_id
  );
end;
$$;

create or replace function public.record_skill_download(
  p_workspace_id uuid,
  p_artifact_id uuid,
  p_artifact_version_id uuid,
  p_user_id uuid,
  p_target text,
  p_source text,
  p_os text default null
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  artifact_row public.artifacts%rowtype;
begin
  if p_target not in ('codex', 'claude-code') then raise exception 'Invalid download target'; end if;
  if p_source not in ('browser', 'cli') then raise exception 'Invalid download source'; end if;

  select * into artifact_row
  from public.artifacts
  where id = p_artifact_id and workspace_id = p_workspace_id
  for share;
  if not found then raise exception 'Skill not found'; end if;
  if not exists (
    select 1 from public.artifact_versions
    where id = p_artifact_version_id and artifact_id = artifact_row.id
  ) then raise exception 'Skill version does not belong to this skill'; end if;

  insert into public.skill_downloads (artifact_id, artifact_version_id, user_id, target, source)
  values (artifact_row.id, p_artifact_version_id, p_user_id, p_target, p_source);

  insert into public.audit_events (workspace_id, artifact_id, actor_name, event_type, metadata)
  values (
    artifact_row.workspace_id,
    artifact_row.id,
    null,
    'skill_downloaded',
    jsonb_strip_nulls(jsonb_build_object(
      'artifact_version_id', p_artifact_version_id,
      'target', p_target,
      'source', p_source,
      'os', p_os
    ))
  );
end;
$$;

create or replace function public.revoke_cli_token(
  p_token_id uuid,
  p_user_id uuid
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  token_row public.cli_tokens%rowtype;
begin
  select * into token_row
  from public.cli_tokens
  where id = p_token_id and user_id = p_user_id and revoked_at is null
  for update;
  if not found then raise exception 'Connection not found or already revoked'; end if;

  update public.cli_tokens set revoked_at = now() where id = token_row.id;
  insert into public.audit_events (workspace_id, actor_name, event_type, metadata)
  values (token_row.workspace_id, null, 'connected_computer_revoked', jsonb_build_object('tokenId', token_row.id));
end;
$$;

revoke all on function public.promote_private_artifact(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.record_skill_download(uuid, uuid, uuid, uuid, text, text, text) from public, anon, authenticated;
revoke all on function public.revoke_cli_token(uuid, uuid) from public, anon, authenticated;
grant execute on function public.promote_private_artifact(uuid, uuid, text) to service_role;
grant execute on function public.record_skill_download(uuid, uuid, uuid, uuid, text, text, text) to service_role;
grant execute on function public.revoke_cli_token(uuid, uuid) to service_role;
