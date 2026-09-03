create table workspace_onboarding (
  workspace_id uuid primary key references workspaces(id) on delete cascade,
  selected_path text check (selected_path in ('share', 'explore', 'scan')),
  explored_demo_at timestamptz,
  first_submission_at timestamptz,
  first_scan_at timestamptz,
  dismissed_at timestamptz,
  updated_at timestamptz not null default now()
);

create table workspace_scan_tokens (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  token_hash text not null unique,
  token_hint text not null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index workspace_scan_tokens_active_workspace_index on workspace_scan_tokens(workspace_id) where revoked_at is null;

alter table workspace_onboarding enable row level security;
alter table workspace_scan_tokens enable row level security;

grant select, insert, update, delete on workspace_onboarding to service_role;
grant select, insert, update, delete on workspace_scan_tokens to service_role;

create policy "service role full access workspace onboarding" on workspace_onboarding for all to service_role using (true) with check (true);
create policy "service role full access workspace scan tokens" on workspace_scan_tokens for all to service_role using (true) with check (true);
