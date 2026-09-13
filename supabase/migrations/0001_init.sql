-- Salon appointment calendar: schema, RLS, and realtime wiring.
-- Run this once against your Supabase project (SQL Editor, or `supabase db push`).

create extension if not exists pgcrypto;

create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null check (char_length(trim(customer_name)) > 0),
  -- Naive local date/time, not timestamptz: single physical location, and
  -- timestamptz invites "shifted to the wrong day" bugs via UTC conversion.
  appointment_date date not null,
  appointment_time time not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists appointments_date_idx
  on appointments (appointment_date, appointment_time);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists appointments_set_updated_at on appointments;
create trigger appointments_set_updated_at
before update on appointments
for each row execute function set_updated_at();

alter table appointments enable row level security;

-- One shared Supabase Auth user represents "the shop" — no per-row
-- ownership logic needed, since there is exactly one identity that ever
-- holds a valid session (see src/lib/auth.js — signUp() is never exposed).
drop policy if exists "authenticated_full_access" on appointments;
create policy "authenticated_full_access" on appointments
for all
to authenticated
using (true)
with check (true);

-- Required for src/lib/appointments.js's realtime subscription — easy to
-- forget, and without it postgres_changes silently delivers nothing.
alter publication supabase_realtime add table appointments;
