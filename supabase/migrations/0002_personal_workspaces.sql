-- New signups receive a personal workspace. Existing records remain unassigned.
alter table workspaces add column if not exists owner_user_id uuid references auth.users(id) on delete set null;
create unique index if not exists workspaces_owner_user_id_unique on workspaces(owner_user_id) where owner_user_id is not null;
create unique index if not exists workspace_members_workspace_user_unique on workspace_members(workspace_id, user_id);
create index if not exists workspace_members_user_id_index on workspace_members(user_id) where user_id is not null;
