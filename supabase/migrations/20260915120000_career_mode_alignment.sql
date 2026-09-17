-- Alinhamento do estado persistido com as Fases 2, 3, 4 e Modo Carreira.
alter table public.simulation_states
  add column if not exists current_tick integer not null default 1,
  add column if not exists simulated_date date not null default '2026-01-01',
  add column if not exists macro_indicators jsonb not null default '{
    "usd_exchange_rate": 857.5,
    "inflation_rate": 15.2,
    "bna_interest_rate": 18.0,
    "forex_scarcity_level": 0.2
  }'::jsonb,
  add column if not exists state_payload jsonb not null default '{}'::jsonb,
  add column if not exists auto_pilot_settings jsonb not null default '{
    "enabled": false,
    "aggression": "balanced",
    "emergency_stop": true
  }'::jsonb;

alter table public.ai_events drop constraint if exists ai_events_provider_check;
alter table public.ai_events add constraint ai_events_provider_check
  check (provider in ('gemini', 'groq', 'deterministic', 'custom'));

create table if not exists public.simulation_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tick_number integer not null,
  simulated_date date not null,
  event_type text not null,
  title text not null,
  description text,
  impact_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.simulation_logs enable row level security;

drop policy if exists "simulation_logs_select_own" on public.simulation_logs;
create policy "simulation_logs_select_own" on public.simulation_logs for select
using (auth.uid() = user_id);

drop policy if exists "simulation_logs_insert_own" on public.simulation_logs;
create policy "simulation_logs_insert_own" on public.simulation_logs for insert
with check (auth.uid() = user_id);

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

  insert into public.simulation_states (user_id, current_tick, simulated_date)
  values (new.id, 1, '2026-01-01')
  on conflict (user_id) do nothing;

  return new;
end;
$$;