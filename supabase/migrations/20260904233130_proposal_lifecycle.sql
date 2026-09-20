create type proposal_kind as enum ('new', 'update');
create type proposal_status as enum ('pending_review', 'changes_requested', 'rejected', 'published', 'superseded', 'withdrawn');

create table proposals (
  id uuid primary key default gen_random_uuid(),
  artifact_id uuid not null references artifacts(id) on delete cascade,
  candidate_version_id uuid not null references artifact_versions(id) on delete cascade,
  base_version_id uuid references artifact_versions(id) on delete set null,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  submitted_by_user_id uuid references auth.users(id) on delete set null,
  submitter_email text,
  source_share_id uuid references artifact_shares(id) on delete set null,
  supersedes_proposal_id uuid references proposals(id) on delete set null,
  kind proposal_kind not null,
  status proposal_status not null default 'pending_review',
  resolved_by_user_id uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  resolution_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(candidate_version_id)
);

create unique index proposals_one_pending_per_artifact
  on proposals(artifact_id)
  where status = 'pending_review';
create index proposals_workspace_status_index on proposals(workspace_id, status, created_at desc);
create index proposals_submitter_index on proposals(submitted_by_user_id, created_at desc);
create index proposals_artifact_index on proposals(artifact_id, created_at desc);

create table proposal_reviews (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references proposals(id) on delete cascade,
  reviewer_user_id uuid references auth.users(id) on delete set null,
  reviewer_name text not null,
  decision text not null check (decision in ('published', 'changes_requested', 'rejected')),
  note text,
  created_at timestamptz not null default now()
);

create index proposal_reviews_proposal_index on proposal_reviews(proposal_id, created_at desc);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  proposal_id uuid references proposals(id) on delete cascade,
  type text not null check (type in ('proposal_submitted', 'changes_requested', 'proposal_rejected', 'proposal_published')),
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_index on notifications(user_id, read_at, created_at desc);

alter table proposals enable row level security;
alter table proposal_reviews enable row level security;
alter table notifications enable row level security;

grant select, insert, update, delete on proposals to service_role;
grant select, insert, update, delete on proposal_reviews to service_role;
grant select, insert, update, delete on notifications to service_role;

create policy "service role full access proposals" on proposals for all to service_role using (true) with check (true);
create policy "service role full access proposal reviews" on proposal_reviews for all to service_role using (true) with check (true);
create policy "service role full access notifications" on notifications for all to service_role using (true) with check (true);

create or replace function decide_proposal(
  p_proposal_id uuid,
  p_reviewer_user_id uuid,
  p_reviewer_name text,
  p_decision text,
  p_note text default null
)
returns jsonb
language plpgsql
as $$
declare
  proposal_row proposals%rowtype;
  artifact_row artifacts%rowtype;
begin
  if p_decision not in ('published', 'changes_requested', 'rejected') then
    raise exception 'Unsupported proposal decision';
  end if;

  select * into proposal_row from proposals where id = p_proposal_id for update;
  if not found then raise exception 'Proposal not found'; end if;
  if proposal_row.status <> 'pending_review' then raise exception 'Proposal has already been resolved'; end if;

  select * into artifact_row from artifacts where id = proposal_row.artifact_id for update;
  if not found then raise exception 'Artifact not found'; end if;
  if artifact_row.current_version_id <> proposal_row.candidate_version_id then raise exception 'A newer proposal is available'; end if;
  if artifact_row.approved_version_id is distinct from proposal_row.base_version_id then raise exception 'The published version changed'; end if;

  update proposals
  set status = p_decision::proposal_status,
      resolved_by_user_id = p_reviewer_user_id,
      resolved_at = now(),
      resolution_note = nullif(trim(p_note), ''),
      updated_at = now()
  where id = p_proposal_id;

  insert into proposal_reviews(proposal_id, reviewer_user_id, reviewer_name, decision, note)
  values (p_proposal_id, p_reviewer_user_id, p_reviewer_name, p_decision, nullif(trim(p_note), ''));

  if p_decision = 'published' then
    update artifacts
    set status = 'approved', current_version_id = proposal_row.candidate_version_id, approved_version_id = proposal_row.candidate_version_id
    where id = proposal_row.artifact_id;
    update artifact_versions set status = 'approved' where id = proposal_row.candidate_version_id;
  elsif p_decision = 'rejected' and proposal_row.base_version_id is not null then
    update artifacts
    set status = 'approved', current_version_id = proposal_row.base_version_id
    where id = proposal_row.artifact_id;
  end if;

  insert into audit_events(workspace_id, artifact_id, actor_name, event_type, metadata)
  values (proposal_row.workspace_id, proposal_row.artifact_id, p_reviewer_name, 'proposal_' || p_decision, jsonb_build_object('proposalId', p_proposal_id, 'versionId', proposal_row.candidate_version_id, 'note', p_note));

  return jsonb_build_object('proposalId', p_proposal_id, 'status', p_decision);
end;
$$;

revoke all on function decide_proposal(uuid, uuid, text, text, text) from public;
grant execute on function decide_proposal(uuid, uuid, text, text, text) to service_role;
