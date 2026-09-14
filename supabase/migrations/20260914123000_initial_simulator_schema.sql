create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'Empreendedor',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.simulation_states (
  user_id uuid primary key references auth.users(id) on delete cascade,
  selected_province_id text,
  selected_municipality_id text,
  selected_business_location jsonb,
  business_type text not null default 'Loja / Comércio',
  cash_balance numeric not null default 2840000,
  today_revenue numeric not null default 1260000,
  today_expenses numeric not null default 980000,
  today_profit numeric not null default 280000,
  progress integer not null default 12 check (progress between 0 and 100),
  metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('gemini', 'groq')),
  prompt text not null,
  response text not null,
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists simulation_states_set_updated_at on public.simulation_states;
create trigger simulation_states_set_updated_at
before update on public.simulation_states
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;

  insert into public.simulation_states (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.simulation_states enable row level security;
alter table public.ai_events enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "simulation_states_select_own" on public.simulation_states;
create policy "simulation_states_select_own"
on public.simulation_states for select
using (auth.uid() = user_id);

drop policy if exists "simulation_states_insert_own" on public.simulation_states;
create policy "simulation_states_insert_own"
on public.simulation_states for insert
with check (auth.uid() = user_id);

drop policy if exists "simulation_states_update_own" on public.simulation_states;
create policy "simulation_states_update_own"
on public.simulation_states for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "ai_events_select_own" on public.ai_events;
create policy "ai_events_select_own"
on public.ai_events for select
using (auth.uid() = user_id);

drop policy if exists "ai_events_insert_own" on public.ai_events;
create policy "ai_events_insert_own"
on public.ai_events for insert
with check (auth.uid() = user_id);
