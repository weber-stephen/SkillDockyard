create type public.user_account_type as enum ('free', 'paid');

create table public.user_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  account_type public.user_account_type not null default 'free',
  created_at timestamptz not null default now()
);

comment on table public.user_accounts is 'Server-managed account classification for each authenticated user.';
comment on column public.user_accounts.account_type is 'Billing classification; new and backfilled users default to free.';

alter table public.user_accounts enable row level security;

grant usage on schema public to service_role;
grant select, insert, update, delete on table public.user_accounts to service_role;

create policy "service role full access user_accounts"
on public.user_accounts
for all
to service_role
using (true)
with check (true);

create schema skill_dockyard_private;
revoke all on schema skill_dockyard_private from public, anon, authenticated;

create function skill_dockyard_private.handle_new_user_account()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_accounts (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke all on function skill_dockyard_private.handle_new_user_account() from public, anon, authenticated, service_role;

create trigger create_user_account_after_auth_user_insert
after insert on auth.users
for each row execute function skill_dockyard_private.handle_new_user_account();

insert into public.user_accounts (user_id)
select id
from auth.users
on conflict (user_id) do nothing;
