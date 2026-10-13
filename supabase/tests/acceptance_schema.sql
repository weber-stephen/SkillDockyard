begin;
select plan(6);

select has_table('public', 'workspaces', 'workspaces is present');
select has_table('public', 'workspace_members', 'workspace membership is present');
select has_table('public', 'artifact_shares', 'artifact sharing is present');
select has_table('public', 'proposals', 'submission lifecycle is present');
select has_function('public', 'ensure_personal_workspace', array['uuid', 'text', 'text'], 'personal workspace RPC is present');
select has_function('public', 'decide_proposal', array['uuid', 'uuid', 'text', 'text', 'text'], 'publication RPC is present');

select * from finish();
rollback;
