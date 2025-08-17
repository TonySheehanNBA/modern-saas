create extension if not exists "uuid-ossp";

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create type public.org_role as enum ('owner','admin','member');

create table if not exists public.memberships (
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.org_role not null default 'owner',
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

alter table public.organizations enable row level security;
alter table public.memberships enable row level security;

create policy "orgs_select_if_member" on public.organizations
for select using (exists (select 1 from public.memberships m where m.org_id = organizations.id and m.user_id = auth.uid()));

create policy "memberships_select_if_member" on public.memberships
for select using (exists (select 1 from public.memberships m2 where m2.org_id = memberships.org_id and m2.user_id = auth.uid()));
