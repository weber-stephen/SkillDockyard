-- DATA-007 / DATA-008: keep object authorization and mandatory audit history
-- inside the same database transaction. These functions are called only by the
-- server service role; the actor is still checked against authoritative rows.

create or replace function public.assert_workspace_owner_consistency(p_workspace_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  workspace_row public.workspaces%rowtype;
  owner_count integer;
begin
  select * into workspace_row from public.workspaces where id = p_workspace_id for share;
  if not found or workspace_row.owner_user_id is null then
    raise exception 'Workspace ownership is inconsistent';
  end if;
  select count(*) into owner_count
  from public.workspace_members
  where workspace_id = p_workspace_id and user_id = workspace_row.owner_user_id and role = 'owner';
  if owner_count <> 1 or (select count(*) from public.workspace_members where workspace_id = p_workspace_id and role = 'owner') <> 1 then
    raise exception 'Workspace ownership is inconsistent';
  end if;
end;
$$;

create or replace function public.submit_artifact_proposal(
  p_artifact_id uuid,
  p_candidate_version_id uuid,
  p_actor_user_id uuid,
  p_actor_email text,
  p_kind public.proposal_kind,
  p_source_share_id uuid default null
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  artifact_row public.artifacts%rowtype;
  prior_proposal public.proposals%rowtype;
  proposal_row public.proposals%rowtype;
  actor_can_submit boolean := false;
begin
  select * into artifact_row from public.artifacts where id = p_artifact_id for update;
  if not found or artifact_row.visibility <> 'workspace' then raise exception 'Skill not found'; end if;
  perform public.assert_workspace_owner_consistency(artifact_row.workspace_id);
  if not exists (select 1 from public.artifact_versions where id = p_candidate_version_id and artifact_id = artifact_row.id) then
    raise exception 'Submitted version does not belong to this skill';
  end if;

  select exists(
    select 1 from public.workspace_members
    where workspace_id = artifact_row.workspace_id and user_id = p_actor_user_id and role in ('owner', 'reviewer', 'editor')
  ) into actor_can_submit;
  if not actor_can_submit and p_source_share_id is not null then
    select exists(
      select 1 from public.artifact_shares share
      where share.id = p_source_share_id and share.artifact_id = artifact_row.id and share.status = 'active' and share.permission = 'propose'
      and (
        share.target_user_id = p_actor_user_id or
        (share.target_workspace_id is not null and exists (
          select 1 from public.workspace_members where workspace_id = share.target_workspace_id and user_id = p_actor_user_id
        ))
      )
    ) into actor_can_submit;
  end if;
  if not actor_can_submit then raise exception 'You are not allowed to submit an update for this skill'; end if;

  select * into prior_proposal from public.proposals
  where artifact_id = artifact_row.id and status = 'pending_review' for update;
  if found and prior_proposal.candidate_version_id = p_candidate_version_id then
    return jsonb_build_object('proposalId', prior_proposal.id, 'status', prior_proposal.status, 'idempotent', true);
  end if;
  if found then
    update public.proposals set status = 'superseded', resolved_by_user_id = p_actor_user_id,
      resolved_at = now(), resolution_note = 'Superseded by a newer submission.', updated_at = now()
    where id = prior_proposal.id;
  end if;

  insert into public.proposals (artifact_id, candidate_version_id, base_version_id, workspace_id, submitted_by_user_id, submitter_email, source_share_id, supersedes_proposal_id, kind, status)
  values (artifact_row.id, p_candidate_version_id, artifact_row.approved_version_id, artifact_row.workspace_id, p_actor_user_id,
    nullif(lower(trim(p_actor_email)), ''), p_source_share_id, case when found then prior_proposal.id else null end, p_kind, 'pending_review')
  returning * into proposal_row;
  insert into public.audit_events (workspace_id, artifact_id, actor_name, event_type, metadata)
  values (artifact_row.workspace_id, artifact_row.id, nullif(lower(trim(p_actor_email)), ''), 'skill_submitted',
    jsonb_strip_nulls(jsonb_build_object('proposalId', proposal_row.id, 'versionId', proposal_row.candidate_version_id, 'supersedesProposalId', prior_proposal.id, 'sourceShareId', p_source_share_id)));
  return jsonb_build_object('proposalId', proposal_row.id, 'status', proposal_row.status, 'idempotent', false);
end;
$$;

create or replace function public.withdraw_proposal(p_proposal_id uuid, p_actor_user_id uuid, p_actor_email text)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare proposal_row public.proposals%rowtype;
begin
  select * into proposal_row from public.proposals where id = p_proposal_id for update;
  if not found or proposal_row.status <> 'pending_review' or proposal_row.submitted_by_user_id is distinct from p_actor_user_id then
    raise exception 'Only awaiting-review submissions you created can be withdrawn';
  end if;
  perform public.assert_workspace_owner_consistency(proposal_row.workspace_id);
  if not exists (select 1 from public.artifacts where id = proposal_row.artifact_id and workspace_id = proposal_row.workspace_id) then
    raise exception 'Submission does not belong to its workspace';
  end if;
  update public.proposals set status = 'withdrawn', resolved_by_user_id = p_actor_user_id, resolved_at = now(),
    resolution_note = 'Withdrawn by submitter.', updated_at = now() where id = proposal_row.id;
  insert into public.audit_events (workspace_id, artifact_id, actor_name, event_type, metadata)
  values (proposal_row.workspace_id, proposal_row.artifact_id, nullif(lower(trim(p_actor_email)), ''), 'proposal_withdrawn', jsonb_build_object('proposalId', proposal_row.id, 'versionId', proposal_row.candidate_version_id));
  return jsonb_build_object('proposalId', proposal_row.id, 'status', 'withdrawn');
end;
$$;

create or replace function public.record_workspace_export(p_workspace_id uuid, p_actor_user_id uuid, p_actor_email text, p_format text, p_artifact_count integer)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if p_format not in ('json', 'csv') or p_artifact_count < 0 then raise exception 'Invalid export request'; end if;
  perform public.assert_workspace_owner_consistency(p_workspace_id);
  if not exists (select 1 from public.workspace_members where workspace_id = p_workspace_id and user_id = p_actor_user_id) then
    raise exception 'Workspace access is required';
  end if;
  insert into public.export_runs (workspace_id, format, artifact_count) values (p_workspace_id, p_format, p_artifact_count);
  insert into public.audit_events (workspace_id, actor_name, event_type, metadata)
  values (p_workspace_id, nullif(lower(trim(p_actor_email)), ''), 'skill_list_exported', jsonb_build_object('format', p_format, 'artifactCount', p_artifact_count));
end;
$$;

create or replace function public.accept_workspace_invite_by_id(p_invite_id uuid, p_actor_user_id uuid, p_actor_email text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare invite_row public.workspace_invites%rowtype; member_row public.workspace_members%rowtype; normalized_email text := lower(trim(p_actor_email));
begin
  if not exists (select 1 from auth.users where id = p_actor_user_id and email_confirmed_at is not null and lower(email) = normalized_email) then raise exception 'A verified matching email is required'; end if;
  select * into invite_row from public.workspace_invites where id = p_invite_id for update;
  if not found then raise exception 'Invitation not found'; end if;
  perform public.assert_workspace_owner_consistency(invite_row.workspace_id);
  if invite_row.status <> 'pending' then raise exception 'This invitation is no longer pending'; end if;
  if invite_row.expires_at <= now() then update public.workspace_invites set status = 'expired', updated_at = now() where id = invite_row.id; raise exception 'This invitation has expired'; end if;
  if invite_row.email <> normalized_email then raise exception 'This invitation is addressed to another email'; end if;
  select * into member_row from public.workspace_members where workspace_id = invite_row.workspace_id and user_id = p_actor_user_id for update;
  if not found then insert into public.workspace_members (workspace_id, user_id, email, role) values (invite_row.workspace_id, p_actor_user_id, normalized_email, invite_row.role) returning * into member_row; end if;
  update public.workspace_invites set status = 'accepted', accepted_by_user_id = p_actor_user_id, accepted_at = now(), updated_at = now() where id = invite_row.id;
  insert into public.audit_events (workspace_id, actor_name, event_type, metadata) values (invite_row.workspace_id, normalized_email, 'workspace_invite_accepted', jsonb_build_object('inviteId', invite_row.id, 'role', invite_row.role));
  return jsonb_build_object('inviteId', invite_row.id, 'workspaceId', invite_row.workspace_id, 'role', coalesce(member_row.role, invite_row.role));
end;
$$;

create or replace function public.accept_workspace_invite(p_token_hash text, p_actor_user_id uuid, p_actor_email text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare invite_row public.workspace_invites%rowtype;
begin
  select * into invite_row from public.workspace_invites where token_hash = p_token_hash for update;
  if not found then raise exception 'Invitation not found'; end if;
  return public.accept_workspace_invite_by_id(invite_row.id, p_actor_user_id, p_actor_email);
end;
$$;

create or replace function public.decline_workspace_invite(p_invite_id uuid, p_actor_user_id uuid, p_actor_email text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare invite_row public.workspace_invites%rowtype; normalized_email text := lower(trim(p_actor_email));
begin
  if not exists (select 1 from auth.users where id = p_actor_user_id and email_confirmed_at is not null and lower(email) = normalized_email) then raise exception 'A verified matching email is required'; end if;
  select * into invite_row from public.workspace_invites where id = p_invite_id for update;
  if not found then raise exception 'Invitation not found'; end if;
  perform public.assert_workspace_owner_consistency(invite_row.workspace_id);
  if invite_row.status <> 'pending' then raise exception 'This invitation is no longer pending'; end if;
  if invite_row.email <> normalized_email then raise exception 'This invitation is addressed to another email'; end if;
  update public.workspace_invites set status = 'declined', updated_at = now() where id = invite_row.id;
  insert into public.audit_events (workspace_id, actor_name, event_type, metadata) values (invite_row.workspace_id, normalized_email, 'workspace_invite_declined', jsonb_build_object('inviteId', invite_row.id));
  return jsonb_build_object('id', invite_row.id, 'status', 'declined');
end;
$$;

create or replace function public.invite_workspace_member(p_workspace_id uuid, p_actor_user_id uuid, p_actor_email text, p_email text, p_role text, p_token_hash text, p_expires_at timestamptz)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare invite_row public.workspace_invites%rowtype; normalized_email text := lower(trim(p_email));
begin
  perform public.assert_workspace_owner_consistency(p_workspace_id);
  if not exists (select 1 from public.workspaces w join public.workspace_members wm on wm.workspace_id = w.id where w.id = p_workspace_id and w.owner_user_id = p_actor_user_id and wm.user_id = p_actor_user_id and wm.role = 'owner') then raise exception 'Only the workspace owner can invite members'; end if;
  if normalized_email = lower(trim(p_actor_email)) then raise exception 'You cannot invite yourself'; end if;
  if p_role not in ('viewer', 'editor', 'reviewer') or p_expires_at <= now() then raise exception 'Choose a valid workspace invitation'; end if;
  if exists (select 1 from public.workspace_members where workspace_id = p_workspace_id and lower(coalesce(email, '')) = normalized_email and user_id is not null) then raise exception 'That person is already a workspace member'; end if;
  if exists (select 1 from public.workspace_invites where workspace_id = p_workspace_id and email = normalized_email and status = 'pending') then raise exception 'A pending invitation already exists for that email'; end if;
  insert into public.workspace_invites (workspace_id, email, role, token_hash, invited_by_user_id, expires_at) values (p_workspace_id, normalized_email, p_role, p_token_hash, p_actor_user_id, p_expires_at) returning * into invite_row;
  insert into public.audit_events (workspace_id, actor_name, event_type, metadata) values (p_workspace_id, lower(trim(p_actor_email)), 'workspace_invite_created', jsonb_build_object('inviteId', invite_row.id, 'role', p_role));
  return jsonb_build_object('id', invite_row.id, 'workspaceId', p_workspace_id, 'email', normalized_email, 'role', p_role, 'expiresAt', invite_row.expires_at);
end;
$$;

create or replace function public.revoke_workspace_invite(p_invite_id uuid, p_actor_user_id uuid, p_actor_email text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare invite_row public.workspace_invites%rowtype;
begin
  select * into invite_row from public.workspace_invites where id = p_invite_id for update;
  if not found then raise exception 'Invitation not found'; end if;
  perform public.assert_workspace_owner_consistency(invite_row.workspace_id);
  if not exists (select 1 from public.workspaces w join public.workspace_members wm on wm.workspace_id = w.id where w.id = invite_row.workspace_id and w.owner_user_id = p_actor_user_id and wm.user_id = p_actor_user_id and wm.role = 'owner') then raise exception 'Only the workspace owner can revoke invitations'; end if;
  if invite_row.status <> 'pending' then raise exception 'Only pending invitations can be revoked'; end if;
  update public.workspace_invites set status = 'revoked', revoked_at = now(), updated_at = now() where id = invite_row.id;
  insert into public.audit_events (workspace_id, actor_name, event_type, metadata) values (invite_row.workspace_id, lower(trim(p_actor_email)), 'workspace_invite_revoked', jsonb_build_object('inviteId', invite_row.id));
  return jsonb_build_object('id', invite_row.id, 'status', 'revoked');
end;
$$;

create or replace function public.rename_workspace(p_workspace_id uuid, p_actor_user_id uuid, p_actor_email text, p_name text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare workspace_row public.workspaces%rowtype; normalized_name text := trim(p_name);
begin
  select * into workspace_row from public.workspaces where id = p_workspace_id for update;
  if not found then raise exception 'Workspace not found'; end if;
  perform public.assert_workspace_owner_consistency(p_workspace_id);
  if workspace_row.owner_user_id is distinct from p_actor_user_id then raise exception 'Only the workspace owner can rename it'; end if;
  if char_length(normalized_name) not between 1 and 80 then raise exception 'Workspace name must be between 1 and 80 characters'; end if;
  update public.workspaces set name = normalized_name where id = p_workspace_id;
  insert into public.audit_events (workspace_id, actor_name, event_type, metadata) values (p_workspace_id, lower(trim(p_actor_email)), 'workspace_renamed', jsonb_build_object('name', normalized_name));
  return jsonb_build_object('id', p_workspace_id, 'name', normalized_name);
end;
$$;

-- Reassert workspace integrity and actor authority at the write boundary. The
-- function body remains transactional, so every required audit insert rolls
-- back its parent mutation if it fails.
create or replace function public.decide_proposal(p_proposal_id uuid, p_reviewer_user_id uuid, p_reviewer_name text, p_decision text, p_note text default null)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare proposal_row public.proposals%rowtype; artifact_row public.artifacts%rowtype;
begin
  if p_decision not in ('published', 'changes_requested', 'rejected') then raise exception 'Unsupported proposal decision'; end if;
  select * into proposal_row from public.proposals where id = p_proposal_id for update;
  if not found or proposal_row.status <> 'pending_review' then raise exception 'Proposal has already been resolved'; end if;
  select * into artifact_row from public.artifacts where id = proposal_row.artifact_id for update;
  if not found or artifact_row.workspace_id <> proposal_row.workspace_id then raise exception 'Submission does not belong to its workspace'; end if;
  perform public.assert_workspace_owner_consistency(proposal_row.workspace_id);
  if not exists (select 1 from public.workspace_members where workspace_id = proposal_row.workspace_id and user_id = p_reviewer_user_id and role in ('owner', 'reviewer')) then raise exception 'Only source workspace owners or reviewers can decide submissions'; end if;
  if artifact_row.current_version_id <> proposal_row.candidate_version_id then raise exception 'A newer proposal is available'; end if;
  if artifact_row.approved_version_id is distinct from proposal_row.base_version_id then raise exception 'The published version changed'; end if;
  update public.proposals set status = p_decision::public.proposal_status, resolved_by_user_id = p_reviewer_user_id, resolved_at = now(), resolution_note = nullif(trim(p_note), ''), updated_at = now() where id = proposal_row.id;
  insert into public.proposal_reviews(proposal_id, reviewer_user_id, reviewer_name, decision, note) values (proposal_row.id, p_reviewer_user_id, p_reviewer_name, p_decision, nullif(trim(p_note), ''));
  if p_decision = 'published' then update public.artifacts set status = 'approved', current_version_id = proposal_row.candidate_version_id, approved_version_id = proposal_row.candidate_version_id where id = proposal_row.artifact_id; update public.artifact_versions set status = 'approved' where id = proposal_row.candidate_version_id; elsif p_decision = 'rejected' and proposal_row.base_version_id is not null then update public.artifacts set status = 'approved', current_version_id = proposal_row.base_version_id where id = proposal_row.artifact_id; end if;
  insert into public.audit_events(workspace_id, artifact_id, actor_name, event_type, metadata) values (proposal_row.workspace_id, proposal_row.artifact_id, nullif(trim(p_reviewer_name), ''), 'proposal_' || p_decision, jsonb_build_object('proposalId', proposal_row.id, 'versionId', proposal_row.candidate_version_id, 'note', p_note));
  return jsonb_build_object('proposalId', proposal_row.id, 'status', p_decision);
end;
$$;

revoke all on function public.assert_workspace_owner_consistency(uuid) from public, anon, authenticated;
revoke all on function public.submit_artifact_proposal(uuid, uuid, uuid, text, public.proposal_kind, uuid) from public, anon, authenticated;
revoke all on function public.withdraw_proposal(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.record_workspace_export(uuid, uuid, text, text, integer) from public, anon, authenticated;
revoke all on function public.decide_proposal(uuid, uuid, text, text, text) from public, anon, authenticated;
revoke all on function public.accept_workspace_invite(text, uuid, text) from public, anon, authenticated;
revoke all on function public.accept_workspace_invite_by_id(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.decline_workspace_invite(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.invite_workspace_member(uuid, uuid, text, text, text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.revoke_workspace_invite(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.rename_workspace(uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.assert_workspace_owner_consistency(uuid) to service_role;
grant execute on function public.submit_artifact_proposal(uuid, uuid, uuid, text, public.proposal_kind, uuid) to service_role;
grant execute on function public.withdraw_proposal(uuid, uuid, text) to service_role;
grant execute on function public.record_workspace_export(uuid, uuid, text, text, integer) to service_role;
grant execute on function public.decide_proposal(uuid, uuid, text, text, text) to service_role;
grant execute on function public.accept_workspace_invite(text, uuid, text) to service_role;
grant execute on function public.accept_workspace_invite_by_id(uuid, uuid, text) to service_role;
grant execute on function public.decline_workspace_invite(uuid, uuid, text) to service_role;
grant execute on function public.invite_workspace_member(uuid, uuid, text, text, text, text, timestamptz) to service_role;
grant execute on function public.revoke_workspace_invite(uuid, uuid, text) to service_role;
grant execute on function public.rename_workspace(uuid, uuid, text, text) to service_role;
