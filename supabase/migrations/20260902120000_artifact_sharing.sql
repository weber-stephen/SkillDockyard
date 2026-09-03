create type share_target_type as enum ('user', 'workspace');
create type share_status as enum ('pending', 'active', 'revoked', 'declined');

create table artifact_shares (
  id uuid primary key default gen_random_uuid(),
  artifact_id uuid not null references artifacts(id) on delete cascade,
  source_workspace_id uuid not null references workspaces(id) on delete cascade,
  target_type share_target_type not null,
  target_user_id uuid references auth.users(id) on delete cascade,
  target_workspace_id uuid references workspaces(id) on delete cascade,
  target_email text,
  target_workspace_name text,
  permission text not null default 'propose',
  status share_status not null default 'pending',
  created_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  activated_at timestamptz,
  revoked_at timestamptz,
  declined_at timestamptz,
  check (
    (target_type = 'user' and target_workspace_id is null)
    or
    (target_type = 'workspace' and target_user_id is null)
  )
);

create index artifact_shares_artifact_id_index on artifact_shares(artifact_id);
create index artifact_shares_target_user_id_index on artifact_shares(target_user_id) where target_user_id is not null;
create index artifact_shares_target_workspace_id_index on artifact_shares(target_workspace_id) where target_workspace_id is not null;
create index artifact_shares_target_email_index on artifact_shares(lower(target_email)) where target_email is not null;

alter table artifact_versions add column if not exists created_by_user_id uuid references auth.users(id) on delete set null;
alter table artifact_versions add column if not exists source_share_id uuid references artifact_shares(id) on delete set null;

alter table artifact_shares enable row level security;
grant select, insert, update, delete on artifact_shares to service_role;
create policy "service role full access artifact shares" on artifact_shares for all to service_role using (true) with check (true);
