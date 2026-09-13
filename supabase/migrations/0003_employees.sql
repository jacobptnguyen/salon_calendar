-- Per-employee calendar filter: a lightweight tagging/filtering layer, not a
-- login system — everyone still connects with the one shared PIN (see
-- src/lib/auth.js).

create table if not exists employees (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  created_at timestamptz not null default now()
);

alter table employees enable row level security;

-- Same shared-shop-identity shape as appointments' policy — see
-- 0001_init.sql for why this is safe with no per-row ownership check.
drop policy if exists "authenticated_full_access" on employees;
create policy "authenticated_full_access" on employees
for all
to authenticated
using (true)
with check (true);

alter publication supabase_realtime add table employees;

-- Nullable, and set null on delete: an unassigned or orphaned appointment
-- always falls back to showing under "All" — never becomes invisible.
alter table appointments
  add column if not exists employee_id uuid references employees(id) on delete set null;

create index if not exists appointments_employee_id_idx
  on appointments (employee_id);
