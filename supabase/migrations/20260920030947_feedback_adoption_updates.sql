alter table artifacts
  add column if not exists source_template_key text;

alter table workspace_onboarding drop constraint if exists workspace_onboarding_selected_path_check;
alter table workspace_onboarding add constraint workspace_onboarding_selected_path_check
  check (selected_path in ('share', 'explore', 'scan', 'starter'));
alter table workspace_onboarding add column if not exists first_starter_at timestamptz;

create unique index if not exists artifacts_creator_template_unique
  on artifacts(created_by_user_id, source_template_key)
  where source_template_key is not null and created_by_user_id is not null;

create table cli_pairing_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  code_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index cli_pairing_codes_active_index
  on cli_pairing_codes(code_hash, expires_at)
  where used_at is null;

create table cli_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  token_hash text not null unique,
  token_hint text not null,
  expires_at timestamptz not null,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index cli_tokens_active_index
  on cli_tokens(token_hash, expires_at)
  where revoked_at is null;
create index cli_tokens_user_index on cli_tokens(user_id, created_at desc);

create table skill_downloads (
  id uuid primary key default gen_random_uuid(),
  artifact_id uuid not null references artifacts(id) on delete cascade,
  artifact_version_id uuid not null references artifact_versions(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  target text not null check (target in ('codex', 'claude-code')),
  source text not null check (source in ('browser', 'cli')),
  created_at timestamptz not null default now()
);

create index skill_downloads_artifact_index on skill_downloads(artifact_id, created_at desc);
create index skill_downloads_user_version_index on skill_downloads(user_id, artifact_id, artifact_version_id)
  where user_id is not null;

create table skill_installations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  artifact_id uuid not null references artifacts(id) on delete cascade,
  artifact_version_id uuid not null references artifact_versions(id) on delete cascade,
  device_id text not null,
  target text not null check (target in ('codex', 'claude-code')),
  content_hash text not null,
  installed_at timestamptz not null default now(),
  checked_at timestamptz not null default now(),
  unique(user_id, artifact_id, device_id, target)
);

create index skill_installations_artifact_version_index
  on skill_installations(artifact_id, artifact_version_id);
create index skill_installations_user_index on skill_installations(user_id, checked_at desc);

alter table notifications add column if not exists artifact_id uuid references artifacts(id) on delete cascade;
alter table notifications add column if not exists artifact_version_id uuid references artifact_versions(id) on delete cascade;
alter table notifications add column if not exists href text;
alter table notifications drop constraint if exists notifications_type_check;
alter table notifications add constraint notifications_type_check check (
  type in ('proposal_submitted', 'changes_requested', 'proposal_rejected', 'proposal_published', 'skill_update_available')
);
create unique index notifications_skill_update_unique
  on notifications(user_id, artifact_id, artifact_version_id, type);

alter table cli_pairing_codes enable row level security;
alter table cli_tokens enable row level security;
alter table skill_downloads enable row level security;
alter table skill_installations enable row level security;

grant select, insert, update, delete on cli_pairing_codes, cli_tokens, skill_downloads, skill_installations to service_role;

create policy "service role full access cli pairing codes" on cli_pairing_codes for all to service_role using (true) with check (true);
create policy "service role full access cli tokens" on cli_tokens for all to service_role using (true) with check (true);
create policy "service role full access skill downloads" on skill_downloads for all to service_role using (true) with check (true);
create policy "service role full access skill installations" on skill_installations for all to service_role using (true) with check (true);
