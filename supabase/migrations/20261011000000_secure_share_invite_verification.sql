-- The server-authenticated service role is the only caller of this function.
-- It must verify the addressed account against auth.users, which service_role
-- cannot read when the function runs with invoker privileges.
alter function public.respond_to_artifact_share(uuid, uuid, text, boolean)
  security definer
  set search_path = '';

revoke all on function public.respond_to_artifact_share(uuid, uuid, text, boolean) from public, anon, authenticated;
grant execute on function public.respond_to_artifact_share(uuid, uuid, text, boolean) to service_role;
