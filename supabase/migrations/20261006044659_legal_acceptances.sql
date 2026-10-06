-- Acceptance records are server-managed evidence of a user's acknowledgement
-- of the active public documents. Browser roles have no direct table access.
create table public.legal_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  terms_version text not null check (char_length(terms_version) <= 64),
  privacy_version text not null check (char_length(privacy_version) <= 64),
  source text not null check (source in ('signup', 'reacceptance')),
  accepted_at timestamptz not null default now()
);

create index legal_acceptances_current_version_lookup
  on public.legal_acceptances (user_id, terms_version, privacy_version, accepted_at desc);

alter table public.legal_acceptances enable row level security;
revoke all on table public.legal_acceptances from anon, authenticated;
