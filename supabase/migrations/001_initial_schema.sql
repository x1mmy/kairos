-- Kairos Phase 2: Initial schema
-- Run in Supabase SQL migrations.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'staff' check (role in ('admin', 'staff')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payees (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  address text,
  abn text,
  default_category text,
  rate_type text not null default 'hourly' check (rate_type in ('hourly', 'fixed')),
  default_rate numeric(12,2) not null default 0,
  payment_terms text,
  apply_gst boolean not null default true,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.budget_periods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  period_type text not null default 'monthly' check (period_type in ('weekly', 'monthly', 'quarterly', 'yearly', 'custom')),
  start_date date not null,
  end_date date not null,
  budget_amount numeric(14,2) not null,
  currency text not null default 'AUD',
  gst_rate numeric(5,4) not null default 0.10,
  is_current boolean not null default false,
  is_closed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create table if not exists public.log_entries (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references public.budget_periods(id) on delete restrict,
  payee_id uuid not null references public.payees(id) on delete restrict,
  created_by uuid not null references public.profiles(id) on delete restrict,
  title text not null,
  category text not null,
  entry_date date not null,
  description text,
  notes text,
  quantity numeric(12,2) not null default 0,
  unit_cost numeric(12,2) not null default 0,
  line_total numeric(14,2) generated always as (quantity * unit_cost) stored,
  status text not null default 'draft' check (status in ('draft', 'ready', 'invoiced')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  log_entry_id uuid not null references public.log_entries(id) on delete cascade,
  storage_bucket text not null default 'attachments',
  storage_path text not null,
  file_name text not null,
  content_type text,
  file_size_bytes bigint,
  uploaded_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.payee_invoices (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references public.budget_periods(id) on delete restrict,
  payee_id uuid not null references public.payees(id) on delete restrict,
  invoice_number text not null unique,
  issued_date date,
  due_date date,
  subtotal_amount numeric(14,2) not null default 0,
  gst_amount numeric(14,2) not null default 0,
  total_amount numeric(14,2) not null default 0,
  status text not null default 'draft' check (status in ('draft', 'issued', 'paid', 'cancelled')),
  notes text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoice_line_items (
  id uuid primary key default gen_random_uuid(),
  payee_invoice_id uuid not null references public.payee_invoices(id) on delete cascade,
  log_entry_id uuid not null references public.log_entries(id) on delete restrict,
  description text not null,
  quantity numeric(12,2) not null default 0,
  unit_cost numeric(12,2) not null default 0,
  line_total numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  unique (payee_invoice_id, log_entry_id)
);

create table if not exists public.internal_summaries (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references public.budget_periods(id) on delete restrict,
  summary_number text not null unique,
  total_spend numeric(14,2) not null default 0,
  budget_amount numeric(14,2) not null default 0,
  variance_amount numeric(14,2) not null default 0,
  percent_of_budget numeric(8,4) not null default 0,
  status text not null default 'draft' check (status in ('draft', 'finalised')),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS helper
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.role
  from public.profiles p
  where p.id = auth.uid()
$$;

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.payees enable row level security;
alter table public.budget_periods enable row level security;
alter table public.log_entries enable row level security;
alter table public.attachments enable row level security;
alter table public.payee_invoices enable row level security;
alter table public.invoice_line_items enable row level security;
alter table public.internal_summaries enable row level security;

-- Admin can read/write everything
create policy "admin_all_profiles" on public.profiles
  for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy "admin_all_payees" on public.payees
  for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy "admin_all_budget_periods" on public.budget_periods
  for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy "admin_all_log_entries" on public.log_entries
  for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy "admin_all_attachments" on public.attachments
  for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy "admin_all_payee_invoices" on public.payee_invoices
  for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy "admin_all_invoice_line_items" on public.invoice_line_items
  for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy "admin_all_internal_summaries" on public.internal_summaries
  for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- Staff can read everything
create policy "staff_read_profiles" on public.profiles
  for select
  using (public.current_user_role() in ('admin', 'staff'));

create policy "staff_read_payees" on public.payees
  for select
  using (public.current_user_role() in ('admin', 'staff'));

create policy "staff_read_budget_periods" on public.budget_periods
  for select
  using (public.current_user_role() in ('admin', 'staff'));

create policy "staff_read_log_entries" on public.log_entries
  for select
  using (public.current_user_role() in ('admin', 'staff'));

create policy "staff_read_attachments" on public.attachments
  for select
  using (public.current_user_role() in ('admin', 'staff'));

create policy "staff_read_payee_invoices" on public.payee_invoices
  for select
  using (public.current_user_role() in ('admin', 'staff'));

create policy "staff_read_invoice_line_items" on public.invoice_line_items
  for select
  using (public.current_user_role() in ('admin', 'staff'));

create policy "staff_read_internal_summaries" on public.internal_summaries
  for select
  using (public.current_user_role() in ('admin', 'staff'));

-- Staff can insert/update log_entries and attachments only
create policy "staff_insert_log_entries" on public.log_entries
  for insert
  with check (public.current_user_role() in ('admin', 'staff'));

create policy "staff_update_log_entries" on public.log_entries
  for update
  using (public.current_user_role() in ('admin', 'staff'))
  with check (public.current_user_role() in ('admin', 'staff'));

create policy "staff_insert_attachments" on public.attachments
  for insert
  with check (public.current_user_role() in ('admin', 'staff'));

create policy "staff_update_attachments" on public.attachments
  for update
  using (public.current_user_role() in ('admin', 'staff'))
  with check (public.current_user_role() in ('admin', 'staff'));

-- Auto-create profiles row on auth user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    'staff'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Requested indexes
create index if not exists idx_log_entries_period_id on public.log_entries(period_id);
create index if not exists idx_log_entries_payee_id on public.log_entries(payee_id);
create index if not exists idx_log_entries_status on public.log_entries(status);
create index if not exists idx_payee_invoices_period_id on public.payee_invoices(period_id);
