update artifact_shares
set permission = 'propose'
where permission is null or permission not in ('view', 'propose');

alter table artifact_shares
  add constraint artifact_shares_permission_check
  check (permission in ('view', 'propose'));
