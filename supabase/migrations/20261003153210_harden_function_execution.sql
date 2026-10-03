alter function public.promote_private_artifact(uuid, uuid, text) security invoker;
alter function public.promote_private_artifact(uuid, uuid, text) set search_path = public;
revoke all on function public.promote_private_artifact(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.promote_private_artifact(uuid, uuid, text) to service_role;

alter function public.decide_proposal(uuid, uuid, text, text, text) security invoker;
alter function public.decide_proposal(uuid, uuid, text, text, text) set search_path = public;
revoke all on function public.decide_proposal(uuid, uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.decide_proposal(uuid, uuid, text, text, text) to service_role;

revoke all on function public.invite_workspace_member(uuid, uuid, text, text, text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.accept_workspace_invite(text, uuid, text) from public, anon, authenticated;
revoke all on function public.revoke_workspace_invite(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.accept_workspace_invite_by_id(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.decline_workspace_invite(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.rename_workspace(uuid, uuid, text, text) from public, anon, authenticated;

create or replace function public.decide_legacy_artifact(
  p_artifact_id uuid,
  p_version_id uuid,
  p_actor_user_id uuid,
  p_actor_email text,
  p_decision text,
  p_note text
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  artifact_row public.artifacts%rowtype;
  next_status public.artifact_status;
begin
  if p_decision not in ('approved', 'deprecated') then raise exception 'Unsupported decision'; end if;
  select * into artifact_row from public.artifacts where id = p_artifact_id for update;
  if not found then raise exception 'Skill not found'; end if;
  if artifact_row.current_version_id is distinct from p_version_id then raise exception 'That version is no longer current'; end if;
  if not exists (select 1 from public.artifact_versions where id = p_version_id and artifact_id = p_artifact_id) then raise exception 'Version does not belong to this skill'; end if;
  if not exists (select 1 from public.workspace_members where workspace_id = artifact_row.workspace_id and user_id = p_actor_user_id and role in ('owner', 'reviewer')) then
    raise exception 'Only source workspace owners or reviewers can publish this skill';
  end if;

  next_status := p_decision::public.artifact_status;
  insert into public.approvals (artifact_id, artifact_version_id, reviewer_name, decision, note)
  values (p_artifact_id, p_version_id, p_actor_email, p_decision::public.approval_decision, nullif(trim(p_note), ''));
  update public.artifacts set status = next_status, current_version_id = p_version_id,
    approved_version_id = case when p_decision = 'approved' then p_version_id else approved_version_id end
  where id = p_artifact_id;
  update public.artifact_versions set status = next_status where id = p_version_id and artifact_id = p_artifact_id;
  insert into public.audit_events (workspace_id, artifact_id, actor_name, event_type, metadata)
  values (artifact_row.workspace_id, p_artifact_id, p_actor_email, p_decision, jsonb_build_object('versionId', p_version_id, 'note', p_note));
  return jsonb_build_object('artifactId', p_artifact_id, 'versionId', p_version_id, 'status', next_status);
end;
$$;

revoke all on function public.decide_legacy_artifact(uuid, uuid, uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.decide_legacy_artifact(uuid, uuid, uuid, text, text, text) to service_role;
