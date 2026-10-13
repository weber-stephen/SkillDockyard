begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

insert into auth.users (id, email, email_confirmed_at)
values
  ('10000000-0000-0000-0000-000000000001', 'owner.acceptance@example.test', now()),
  ('10000000-0000-0000-0000-000000000002', 'recipient.acceptance@example.test', now()),
  ('10000000-0000-0000-0000-000000000003', 'outsider.acceptance@example.test', now());

select lives_ok(
  $$ select public.ensure_personal_workspace('10000000-0000-0000-0000-000000000001', 'owner.acceptance@example.test', 'Owner acceptance workspace') $$,
  'personal workspace provisioning succeeds'
);
select is(
  (select count(*)::integer from public.workspaces where owner_user_id = '10000000-0000-0000-0000-000000000001'),
  1,
  'one personal workspace exists'
);
select is(
  (select count(*)::integer from public.workspace_members where user_id = '10000000-0000-0000-0000-000000000001' and role = 'owner'),
  1,
  'one owner membership exists'
);
select is(
  (select count(*)::integer from public.audit_events where event_type = 'personal_workspace_created'),
  1,
  'personal workspace creation records one audit event'
);

insert into public.repos (id, workspace_id, name, root_path)
select '20000000-0000-0000-0000-000000000001', id, 'acceptance-repo', '/acceptance'
from public.workspaces where owner_user_id = '10000000-0000-0000-0000-000000000001';
insert into public.artifacts (id, workspace_id, repo_id, name, slug, type, path, status)
select '30000000-0000-0000-0000-000000000001', workspace_id, id, 'Acceptance skill', 'acceptance-skill', 'claude_skill', 'skills/acceptance/SKILL.md', 'approved'
from public.repos where id = '20000000-0000-0000-0000-000000000001';

select throws_ok(
  $$ select public.create_artifact_share('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'outsider.acceptance@example.test', 'user', 'recipient.acceptance@example.test', null, null, 'view', false) $$,
  '.*owners or reviewers can share.*',
  'an unrelated user cannot create a share'
);
select lives_ok(
  $$ select public.create_artifact_share('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'owner.acceptance@example.test', 'user', 'recipient.acceptance@example.test', null, null, 'view', false) $$,
  'the source owner can create a pending share'
);
select is(
  (select count(*)::integer from public.artifact_shares where artifact_id = '30000000-0000-0000-0000-000000000001' and status = 'pending'),
  1,
  'the share is pending before recipient acceptance'
);
select lives_ok(
  $$ select public.respond_to_artifact_share((select id from public.artifact_shares where artifact_id = '30000000-0000-0000-0000-000000000001'), '10000000-0000-0000-0000-000000000002', 'recipient.acceptance@example.test', true) $$,
  'the named confirmed recipient can accept the share'
);
select is(
  (select count(*)::integer from public.audit_events where artifact_id = '30000000-0000-0000-0000-000000000001' and event_type in ('skill_shared', 'share_accepted')),
  2,
  'share creation and acceptance retain audit history'
);

select * from finish();
rollback;
