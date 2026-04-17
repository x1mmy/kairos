create table if not exists public.settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.settings enable row level security;

create policy "admin_all_settings" on public.settings
  for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy "staff_read_settings" on public.settings
  for select
  using (public.current_user_role() in ('admin', 'staff'));
