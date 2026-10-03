create or replace function public.create_artifact_share(
  p_artifact_id uuid,
  p_actor_user_id uuid,
  p_actor_email text,
  p_target_type public.share_target_type,
  p_target_email text,
  p_target_workspace_id uuid,
  p_target_workspace_name text,
  p_permission text,
  p_activate boolean
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  artifact_row public.artifacts%rowtype;
  share_row public.artifact_shares%rowtype;
begin
  select * into artifact_row from public.artifacts where id = p_artifact_id for share;
  if not found then raise exception 'Skill not found'; end if;
  if p_permission not in ('view', 'propose') then raise exception 'Invalid sharing permission'; end if;
  if not exists (
    select 1 from public.workspace_members
    where workspace_id = artifact_row.workspace_id and user_id = p_actor_user_id and role in ('owner', 'reviewer')
  ) then raise exception 'Only source workspace owners or reviewers can share this skill'; end if;
  if p_target_type = 'user' and nullif(lower(trim(p_target_email)), '') is null then raise exception 'Recipient email is required'; end if;
  if p_target_type = 'workspace' and p_target_workspace_id is null and nullif(lower(trim(p_target_email)), '') is null then raise exception 'Choose a workspace or enter the workspace owner email'; end if;

  insert into public.artifact_shares (
    artifact_id, source_workspace_id, target_type, target_email, permission, status,
    created_by_user_id, target_workspace_id, target_workspace_name, activated_at
  ) values (
    artifact_row.id, artifact_row.workspace_id, p_target_type, nullif(lower(trim(p_target_email)), ''), p_permission,
    case when p_activate then 'active'::public.share_status else 'pending'::public.share_status end,
    p_actor_user_id, case when p_target_type = 'workspace' then p_target_workspace_id else null end,
    case when p_target_type = 'workspace' then nullif(trim(p_target_workspace_name), '') else null end,
    case when p_activate then now() else null end
  ) returning * into share_row;

  insert into public.audit_events (workspace_id, artifact_id, actor_name, event_type, metadata)
  values (artifact_row.workspace_id, artifact_row.id, p_actor_email, 'skill_shared', jsonb_build_object('shareId', share_row.id, 'targetType', p_target_type, 'targetEmail', share_row.target_email, 'targetWorkspaceId', share_row.target_workspace_id));
  return to_jsonb(share_row);
end;
$$;

create or replace function public.respond_to_artifact_share(
  p_share_id uuid,
  p_actor_user_id uuid,
  p_actor_email text,
  p_accept boolean
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  share_row public.artifact_shares%rowtype;
begin
  select * into share_row from public.artifact_shares where id = p_share_id for update;
  if not found then raise exception 'Invitation not found'; end if;
  if share_row.status <> 'pending' then raise exception 'This invitation is no longer pending'; end if;
  if lower(coalesce(share_row.target_email, '')) <> lower(trim(p_actor_email)) then raise exception 'This invitation is not addressed to your account'; end if;
  if not exists (select 1 from auth.users where id = p_actor_user_id and email_confirmed_at is not null and lower(email) = lower(trim(p_actor_email))) then
    raise exception 'A verified matching email is required';
  end if;

  if p_accept and share_row.target_type = 'workspace' and not exists (
    select 1 from public.workspace_members wm
    join public.workspaces w on w.id = wm.workspace_id
    where wm.workspace_id = share_row.target_workspace_id and wm.user_id = p_actor_user_id and wm.role = 'owner' and w.owner_user_id = p_actor_user_id
  ) then raise exception 'You must be the workspace owner to accept this share'; end if;

  update public.artifact_shares
  set status = case when p_accept then 'active'::public.share_status else 'declined'::public.share_status end,
      target_user_id = case when p_accept and target_type = 'user' then p_actor_user_id else target_user_id end,
      activated_at = case when p_accept then now() else activated_at end,
      declined_at = case when not p_accept then now() else declined_at end
  where id = share_row.id
  returning * into share_row;

  insert into public.audit_events (workspace_id, artifact_id, actor_name, event_type, metadata)
  values (share_row.source_workspace_id, share_row.artifact_id, p_actor_email, case when p_accept then 'share_accepted' else 'share_declined' end, jsonb_build_object('shareId', share_row.id));
  return to_jsonb(share_row);
end;
$$;

create or replace function public.revoke_artifact_share(
  p_share_id uuid,
  p_actor_user_id uuid,
  p_actor_email text
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  share_row public.artifact_shares%rowtype;
begin
  select * into share_row from public.artifact_shares where id = p_share_id for update;
  if not found then raise exception 'Share not found'; end if;
  if not exists (
    select 1 from public.workspace_members
    where workspace_id = share_row.source_workspace_id and user_id = p_actor_user_id and role in ('owner', 'reviewer')
  ) then raise exception 'Only source workspace owners or reviewers can revoke a share'; end if;

  update public.artifact_shares set status = 'revoked', revoked_at = now() where id = share_row.id returning * into share_row;
  insert into public.audit_events (workspace_id, artifact_id, actor_name, event_type, metadata)
  values (share_row.source_workspace_id, share_row.artifact_id, p_actor_email, 'share_revoked', jsonb_build_object('shareId', share_row.id));
  return to_jsonb(share_row);
end;
$$;

revoke all on function public.create_artifact_share(uuid, uuid, text, public.share_target_type, text, uuid, text, text, boolean) from public, anon, authenticated;
revoke all on function public.respond_to_artifact_share(uuid, uuid, text, boolean) from public, anon, authenticated;
revoke all on function public.revoke_artifact_share(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.create_artifact_share(uuid, uuid, text, public.share_target_type, text, uuid, text, text, boolean) to service_role;
grant execute on function public.respond_to_artifact_share(uuid, uuid, text, boolean) to service_role;
grant execute on function public.revoke_artifact_share(uuid, uuid, text) to service_role;
