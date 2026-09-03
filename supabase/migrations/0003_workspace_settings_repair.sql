-- Repair a missing table from the recorded initial schema migration.
create table if not exists workspace_settings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  config_file text not null default 'skill-dockyard.yml',
  approved_mcp_servers text[] not null default '{}',
  high_impact_tools text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id)
);

alter table workspace_settings enable row level security;
grant select, insert, update, delete on workspace_settings to service_role;
create policy "service role full access workspace settings" on workspace_settings for all to service_role using (true) with check (true);
