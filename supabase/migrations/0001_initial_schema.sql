create extension if not exists "pgcrypto";

create type artifact_status as enum ('unreviewed', 'approved', 'needs_reapproval', 'deprecated');
create type artifact_type as enum ('agent_doc', 'claude_skill', 'copilot_agent', 'cursor_rule', 'mcp_config', 'prompt_library', 'skill_folder');
create type risk_kind as enum ('inline_credentials', 'local_mcp', 'unapproved_mcp', 'high_impact_tool', 'missing_owner');
create type risk_severity as enum ('low', 'medium', 'high');
create type approval_decision as enum ('approved', 'deprecated');

create table workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid,
  email text,
  role text not null default 'reviewer',
  created_at timestamptz not null default now()
);

create table workspace_settings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  config_file text not null default 'skill-dockyard.yml',
  approved_mcp_servers text[] not null default '{}',
  high_impact_tools text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id)
);

create table repos (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  root_path text not null,
  default_branch text,
  created_at timestamptz not null default now(),
  unique(workspace_id, name)
);

create table scan_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  status text not null default 'completed',
  artifact_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table artifacts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  repo_id uuid not null references repos(id) on delete cascade,
  name text not null,
  slug text not null,
  type artifact_type not null,
  path text not null,
  description text,
  owner text,
  status artifact_status not null default 'unreviewed',
  current_version_id uuid,
  approved_version_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id, repo_id, path)
);

create table artifact_versions (
  id uuid primary key default gen_random_uuid(),
  artifact_id uuid not null references artifacts(id) on delete cascade,
  scan_run_id uuid references scan_runs(id) on delete set null,
  commit_sha text,
  branch_ref text,
  content_hash text not null,
  content_snapshot text not null,
  summary text,
  tools text[] not null default '{}',
  mcp_servers text[] not null default '{}',
  tags text[] not null default '{}',
  status artifact_status not null default 'unreviewed',
  created_at timestamptz not null default now(),
  unique(artifact_id, content_hash)
);

alter table artifacts
  add constraint artifacts_current_version_fk foreign key (current_version_id) references artifact_versions(id) on delete set null,
  add constraint artifacts_approved_version_fk foreign key (approved_version_id) references artifact_versions(id) on delete set null;

create table risk_flags (
  id uuid primary key default gen_random_uuid(),
  artifact_id uuid not null references artifacts(id) on delete cascade,
  artifact_version_id uuid not null references artifact_versions(id) on delete cascade,
  kind risk_kind not null,
  severity risk_severity not null,
  message text not null,
  evidence text,
  created_at timestamptz not null default now()
);

create table approvals (
  id uuid primary key default gen_random_uuid(),
  artifact_id uuid not null references artifacts(id) on delete cascade,
  artifact_version_id uuid not null references artifact_versions(id) on delete cascade,
  reviewer_name text not null,
  decision approval_decision not null,
  note text,
  created_at timestamptz not null default now()
);

create table export_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  format text not null,
  artifact_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table audit_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  artifact_id uuid references artifacts(id) on delete cascade,
  actor_name text,
  event_type text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create view artifact_catalog
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
  a.updated_at
from artifacts a
join repos r on r.id = a.repo_id
left join risk_flags rf on rf.artifact_id = a.id and rf.artifact_version_id = a.current_version_id
group by a.id, r.name;

alter table workspaces enable row level security;
alter table workspace_members enable row level security;
alter table workspace_settings enable row level security;
alter table repos enable row level security;
alter table scan_runs enable row level security;
alter table artifacts enable row level security;
alter table artifact_versions enable row level security;
alter table risk_flags enable row level security;
alter table approvals enable row level security;
alter table export_runs enable row level security;
alter table audit_events enable row level security;

grant usage on schema public to service_role;
grant select, insert, update, delete on all tables in schema public to service_role;
grant select on artifact_catalog to service_role;

create policy "service role full access workspaces" on workspaces for all to service_role using (true) with check (true);
create policy "service role full access workspace_members" on workspace_members for all to service_role using (true) with check (true);
create policy "service role full access workspace_settings" on workspace_settings for all to service_role using (true) with check (true);
create policy "service role full access repos" on repos for all to service_role using (true) with check (true);
create policy "service role full access scan_runs" on scan_runs for all to service_role using (true) with check (true);
create policy "service role full access artifacts" on artifacts for all to service_role using (true) with check (true);
create policy "service role full access artifact_versions" on artifact_versions for all to service_role using (true) with check (true);
create policy "service role full access risk_flags" on risk_flags for all to service_role using (true) with check (true);
create policy "service role full access approvals" on approvals for all to service_role using (true) with check (true);
create policy "service role full access export_runs" on export_runs for all to service_role using (true) with check (true);
create policy "service role full access audit_events" on audit_events for all to service_role using (true) with check (true);
