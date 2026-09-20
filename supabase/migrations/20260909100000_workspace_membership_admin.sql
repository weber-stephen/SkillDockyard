create type workspace_invite_status as enum ('pending', 'accepted', 'declined', 'revoked', 'expired');

create table workspace_invites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  email text not null,
  role text not null default 'viewer',
  token_hash text not null unique,
  invited_by_user_id uuid not null references auth.users(id) on delete restrict,
  status workspace_invite_status not null default 'pending',
  expires_at timestamptz not null,
  accepted_by_user_id uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workspace_invites_role_check check (role in ('viewer', 'editor', 'reviewer')),
  constraint workspace_invites_email_check check (email = lower(trim(email))),
  constraint workspace_invites_expiry_check check (expires_at > created_at)
);

create unique index workspace_invites_pending_email_unique
  on workspace_invites(workspace_id, email)
  where status = 'pending';
create index workspace_invites_email_status_index
  on workspace_invites(email, status);
create index workspace_invites_workspace_status_index
  on workspace_invites(workspace_id, status, created_at desc);

alter table workspace_invites enable row level security;
grant select, insert, update, delete on workspace_invites to service_role;
create policy "service role full access workspace invites" on workspace_invites for all to service_role using (true) with check (true);

create or replace function invite_workspace_member(
  p_workspace_id uuid,
  p_actor_user_id uuid,
  p_actor_email text,
  p_email text,
  p_role text,
  p_token_hash text,
  p_expires_at timestamptz
) returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  workspace_row workspaces%rowtype;
  invite_row workspace_invites%rowtype;
  normalized_email text := lower(trim(p_email));
begin
  select * into workspace_row from workspaces where id = p_workspace_id for update;
  if not found then raise exception 'Workspace not found'; end if;
  if workspace_row.owner_user_id is distinct from p_actor_user_id then raise exception 'Only the workspace owner can invite members'; end if;
  if not exists (select 1 from workspace_members where workspace_id = p_workspace_id and user_id = p_actor_user_id and role = 'owner') then
    raise exception 'Only the workspace owner can invite members';
  end if;
  if normalized_email = lower(trim(p_actor_email)) then raise exception 'You cannot invite yourself'; end if;
  if p_role not in ('viewer', 'editor', 'reviewer') then raise exception 'Choose a valid workspace role'; end if;
  if exists (select 1 from workspace_members where workspace_id = p_workspace_id and lower(coalesce(email, '')) = normalized_email and user_id is not null) then
    raise exception 'That person is already a workspace member';
  end if;
  if exists (select 1 from workspace_invites where workspace_id = p_workspace_id and email = normalized_email and status = 'pending') then
    raise exception 'A pending invitation already exists for that email';
  end if;

  insert into workspace_invites (workspace_id, email, role, token_hash, invited_by_user_id, expires_at)
  values (p_workspace_id, normalized_email, p_role, p_token_hash, p_actor_user_id, p_expires_at)
  returning * into invite_row;

  insert into audit_events (workspace_id, actor_name, event_type, metadata)
  values (p_workspace_id, p_actor_email, 'workspace_invite_created', jsonb_build_object('inviteId', invite_row.id, 'email', normalized_email, 'role', p_role));

  return jsonb_build_object('id', invite_row.id, 'workspaceId', p_workspace_id, 'email', normalized_email, 'role', p_role, 'expiresAt', invite_row.expires_at);
end;
$$;

create or replace function accept_workspace_invite(
  p_token_hash text,
  p_actor_user_id uuid,
  p_actor_email text
) returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  invite_row workspace_invites%rowtype;
  member_row workspace_members%rowtype;
  normalized_email text := lower(trim(p_actor_email));
begin
  select * into invite_row from workspace_invites where token_hash = p_token_hash for update;
  if not found then raise exception 'Invitation not found'; end if;
  if invite_row.status <> 'pending' then raise exception 'This invitation is no longer pending'; end if;
  if invite_row.expires_at <= now() then
    update workspace_invites set status = 'expired', updated_at = now() where id = invite_row.id;
    raise exception 'This invitation has expired';
  end if;
  if invite_row.email <> normalized_email then raise exception 'This invitation is addressed to another email'; end if;

  select * into member_row from workspace_members where workspace_id = invite_row.workspace_id and user_id = p_actor_user_id for update;
  if found then
    update workspace_invites set status = 'accepted', accepted_by_user_id = p_actor_user_id, accepted_at = now(), updated_at = now() where id = invite_row.id;
  else
    insert into workspace_members (workspace_id, user_id, email, role)
    values (invite_row.workspace_id, p_actor_user_id, normalized_email, invite_row.role)
    returning * into member_row;
    update workspace_invites set status = 'accepted', accepted_by_user_id = p_actor_user_id, accepted_at = now(), updated_at = now() where id = invite_row.id;
  end if;

  insert into audit_events (workspace_id, actor_name, event_type, metadata)
  values (invite_row.workspace_id, p_actor_email, 'workspace_invite_accepted', jsonb_build_object('inviteId', invite_row.id, 'role', invite_row.role));

  return jsonb_build_object('inviteId', invite_row.id, 'workspaceId', invite_row.workspace_id, 'role', coalesce(member_row.role, invite_row.role));
end;
$$;

create or replace function revoke_workspace_invite(
  p_invite_id uuid,
  p_actor_user_id uuid,
  p_actor_email text
) returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  invite_row workspace_invites%rowtype;
begin
  select wi.* into invite_row
  from workspace_invites wi
  join workspaces w on w.id = wi.workspace_id
  where wi.id = p_invite_id and w.owner_user_id = p_actor_user_id
  for update;
  if not found then raise exception 'Invitation not found or owner access is required'; end if;
  if not exists (select 1 from workspace_members where workspace_id = invite_row.workspace_id and user_id = p_actor_user_id and role = 'owner') then
    raise exception 'Only the workspace owner can revoke invitations';
  end if;
  if invite_row.status <> 'pending' then raise exception 'Only pending invitations can be revoked'; end if;

  update workspace_invites set status = 'revoked', revoked_at = now(), updated_at = now() where id = invite_row.id;
  insert into audit_events (workspace_id, actor_name, event_type, metadata)
  values (invite_row.workspace_id, p_actor_email, 'workspace_invite_revoked', jsonb_build_object('inviteId', invite_row.id, 'email', invite_row.email));
  return jsonb_build_object('id', invite_row.id, 'status', 'revoked');
end;
$$;

create or replace function accept_workspace_invite_by_id(
  p_invite_id uuid,
  p_actor_user_id uuid,
  p_actor_email text
) returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  invite_row workspace_invites%rowtype;
  member_row workspace_members%rowtype;
  normalized_email text := lower(trim(p_actor_email));
begin
  select * into invite_row from workspace_invites where id = p_invite_id for update;
  if not found then raise exception 'Invitation not found'; end if;
  if invite_row.status <> 'pending' then raise exception 'This invitation is no longer pending'; end if;
  if invite_row.expires_at <= now() then
    update workspace_invites set status = 'expired', updated_at = now() where id = invite_row.id;
    raise exception 'This invitation has expired';
  end if;
  if invite_row.email <> normalized_email then raise exception 'This invitation is addressed to another email'; end if;

  select * into member_row from workspace_members where workspace_id = invite_row.workspace_id and user_id = p_actor_user_id for update;
  if not found then
    insert into workspace_members (workspace_id, user_id, email, role)
    values (invite_row.workspace_id, p_actor_user_id, normalized_email, invite_row.role)
    returning * into member_row;
  end if;
  update workspace_invites set status = 'accepted', accepted_by_user_id = p_actor_user_id, accepted_at = now(), updated_at = now() where id = invite_row.id;
  insert into audit_events (workspace_id, actor_name, event_type, metadata)
  values (invite_row.workspace_id, p_actor_email, 'workspace_invite_accepted', jsonb_build_object('inviteId', invite_row.id, 'role', invite_row.role));
  return jsonb_build_object('inviteId', invite_row.id, 'workspaceId', invite_row.workspace_id, 'role', coalesce(member_row.role, invite_row.role));
end;
$$;

create or replace function decline_workspace_invite(
  p_invite_id uuid,
  p_actor_user_id uuid,
  p_actor_email text
) returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  invite_row workspace_invites%rowtype;
begin
  select * into invite_row from workspace_invites where id = p_invite_id for update;
  if not found then raise exception 'Invitation not found'; end if;
  if invite_row.status <> 'pending' then raise exception 'This invitation is no longer pending'; end if;
  if invite_row.email <> lower(trim(p_actor_email)) then raise exception 'This invitation is addressed to another email'; end if;
  update workspace_invites set status = 'declined', updated_at = now() where id = invite_row.id;
  insert into audit_events (workspace_id, actor_name, event_type, metadata)
  values (invite_row.workspace_id, p_actor_email, 'workspace_invite_declined', jsonb_build_object('inviteId', invite_row.id));
  return jsonb_build_object('id', invite_row.id, 'status', 'declined');
end;
$$;

create or replace function rename_workspace(
  p_workspace_id uuid,
  p_actor_user_id uuid,
  p_actor_email text,
  p_name text
) returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  workspace_row workspaces%rowtype;
  normalized_name text := trim(p_name);
  previous_name text;
begin
  select * into workspace_row from workspaces where id = p_workspace_id for update;
  if not found then raise exception 'Workspace not found'; end if;
  if workspace_row.owner_user_id is distinct from p_actor_user_id then raise exception 'Only the workspace owner can rename it'; end if;
  if not exists (select 1 from workspace_members where workspace_id = p_workspace_id and user_id = p_actor_user_id and role = 'owner') then
    raise exception 'Only the workspace owner can rename it';
  end if;
  if char_length(normalized_name) < 1 or char_length(normalized_name) > 80 then raise exception 'Workspace name must be between 1 and 80 characters'; end if;

  previous_name := workspace_row.name;
  update workspaces set name = normalized_name where id = p_workspace_id;
  insert into audit_events (workspace_id, actor_name, event_type, metadata)
  values (p_workspace_id, p_actor_email, 'workspace_renamed', jsonb_build_object('previousName', previous_name, 'name', normalized_name));
  return jsonb_build_object('id', p_workspace_id, 'name', normalized_name);
end;
$$;

revoke all on function invite_workspace_member(uuid, uuid, text, text, text, text, timestamptz) from public;
revoke all on function accept_workspace_invite(text, uuid, text) from public;
revoke all on function revoke_workspace_invite(uuid, uuid, text) from public;
revoke all on function accept_workspace_invite_by_id(uuid, uuid, text) from public;
revoke all on function decline_workspace_invite(uuid, uuid, text) from public;
revoke all on function rename_workspace(uuid, uuid, text, text) from public;
grant execute on function invite_workspace_member(uuid, uuid, text, text, text, text, timestamptz) to service_role;
grant execute on function accept_workspace_invite(text, uuid, text) to service_role;
grant execute on function revoke_workspace_invite(uuid, uuid, text) to service_role;
grant execute on function accept_workspace_invite_by_id(uuid, uuid, text) to service_role;
grant execute on function decline_workspace_invite(uuid, uuid, text) to service_role;
grant execute on function rename_workspace(uuid, uuid, text, text) to service_role;
