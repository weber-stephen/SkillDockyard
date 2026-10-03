create or replace function public.ensure_personal_workspace(
  p_user_id uuid,
  p_user_email text,
  p_workspace_name text
) returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  workspace_row public.workspaces%rowtype;
  owner_membership_count integer;
begin
  if p_user_id is null then
    raise exception 'A user is required';
  end if;

  -- Serialize first-use provisioning for this user without blocking other users.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text, 0));

  select *
  into workspace_row
  from public.workspaces
  where owner_user_id = p_user_id;

  if found then
    select count(*)
    into owner_membership_count
    from public.workspace_members
    where workspace_id = workspace_row.id
      and user_id = p_user_id
      and role = 'owner';

    if owner_membership_count <> 1 then
      raise exception 'Personal workspace ownership is inconsistent';
    end if;

    return workspace_row.id;
  end if;

  insert into public.workspaces (name, owner_user_id)
  values (left(nullif(trim(p_workspace_name), ''), 120), p_user_id)
  returning * into workspace_row;

  if workspace_row.name is null then
    raise exception 'A workspace name is required';
  end if;

  insert into public.workspace_members (workspace_id, user_id, email, role)
  values (workspace_row.id, p_user_id, lower(trim(p_user_email)), 'owner');

  insert into public.audit_events (workspace_id, actor_name, event_type, metadata)
  values (
    workspace_row.id,
    lower(trim(p_user_email)),
    'personal_workspace_created',
    jsonb_build_object('ownerUserId', p_user_id)
  );

  return workspace_row.id;
end;
$$;

revoke all on function public.ensure_personal_workspace(uuid, text, text) from public, anon, authenticated;
grant execute on function public.ensure_personal_workspace(uuid, text, text) to service_role;
