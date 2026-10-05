-- Skill Dockyard performs all production data access through server routes
-- using the service_role client. Browser clients use Supabase Auth only.
-- Keep RLS enabled as defense in depth and remove direct Data API table access
-- from the browser roles so an accidental policy or RLS change cannot expose
-- the application's server-managed tables.
revoke all privileges on all tables in schema public from anon, authenticated;

-- Preserve the same boundary for tables created by future migrations run by
-- the migration owner. Explicit service_role grants remain unchanged.
alter default privileges in schema public
  revoke all privileges on tables from anon, authenticated;
