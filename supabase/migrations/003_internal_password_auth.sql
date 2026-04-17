-- Decouple profiles from auth.users for internal password-only mode.

-- 1) Drop FK from profiles.id -> auth.users(id)
do $$
declare
  fk_name text;
begin
  select conname
  into fk_name
  from pg_constraint
  where conrelid = 'public.profiles'::regclass
    and confrelid = 'auth.users'::regclass
    and contype = 'f'
  limit 1;

  if fk_name is not null then
    execute format('alter table public.profiles drop constraint %I', fk_name);
  end if;
end $$;

-- 2) Disable auth.users signup trigger (not needed in password-only mode)
drop trigger if exists on_auth_user_created on auth.users;

-- 3) Keep helper/trigger function but make it harmless if ever called manually
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  return new;
end;
$$;
