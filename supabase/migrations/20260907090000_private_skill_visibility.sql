do $$
begin
  create type artifact_visibility as enum ('private', 'workspace');
exception
  when duplicate_object then null;
end
$$;

alter table artifacts
  add column if not exists visibility artifact_visibility not null default 'workspace',
  add column if not exists created_by_user_id uuid references auth.users(id) on delete set null;

create index if not exists artifacts_private_owner_index
  on artifacts(created_by_user_id)
  where visibility = 'private';

create or replace view artifact_catalog
with (security_invoker = true) as
select
  a.id,
  a.workspace_id,
  a.repo_id,
  a.name,
  a.slug,
  a.type,
  r.name as repo_name,
  a.path,
  a.description,
  a.owner,
  a.status,
  a.current_version_id,
  a.approved_version_id,
  count(rf.id)::int as risk_count,
  a.updated_at,
  a.visibility,
  a.created_by_user_id
from artifacts a
join repos r on r.id = a.repo_id
left join risk_flags rf on rf.artifact_id = a.id and rf.artifact_version_id = a.current_version_id
group by a.id, r.name;

create or replace function promote_private_artifact(
  p_artifact_id uuid,
  p_user_id uuid,
  p_submitter_email text
)
returns jsonb
language plpgsql
as $$
declare
  artifact_row artifacts%rowtype;
  proposal_id uuid;
begin
  select * into artifact_row from artifacts where id = p_artifact_id for update;
  if not found then raise exception 'Skill not found'; end if;
  if artifact_row.visibility <> 'private' then raise exception 'This skill is already in the workspace review flow'; end if;
  if artifact_row.created_by_user_id is distinct from p_user_id then raise exception 'Only the private draft owner can submit it for review'; end if;
  if artifact_row.current_version_id is null then raise exception 'This private draft has no version to submit'; end if;

  insert into proposals(
    artifact_id,
    candidate_version_id,
    base_version_id,
    workspace_id,
    submitted_by_user_id,
    submitter_email,
    kind,
    status
  ) values (
    artifact_row.id,
    artifact_row.current_version_id,
    null,
    artifact_row.workspace_id,
    p_user_id,
    p_submitter_email,
    'new',
    'pending_review'
  ) returning id into proposal_id;

  update artifacts
  set visibility = 'workspace', updated_at = now()
  where id = artifact_row.id;

  return jsonb_build_object(
    'proposalId', proposal_id,
    'artifactId', artifact_row.id,
    'workspaceId', artifact_row.workspace_id,
    'versionId', artifact_row.current_version_id
  );
end;
$$;

revoke all on function promote_private_artifact(uuid, uuid, text) from public;
grant execute on function promote_private_artifact(uuid, uuid, text) to service_role;
