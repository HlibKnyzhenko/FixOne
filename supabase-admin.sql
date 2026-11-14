-- Run this once in Supabase SQL Editor.
-- First create an admin user in Authentication > Users.
-- Then replace the UUID below with that user's id.

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
revoke all on public.admin_users from anon;
grant select on public.admin_users to authenticated;

create policy "Admins can view their own admin record"
on public.admin_users for select to authenticated
using ((select auth.uid()) = user_id);

insert into public.admin_users (user_id)
values ('PASTE_ADMIN_USER_UUID_HERE')
on conflict (user_id) do nothing;

grant select, update on public.bookings to authenticated;

create policy "Admins can view all bookings"
on public.bookings for select to authenticated
using (exists (select 1 from public.admin_users where user_id = (select auth.uid())));

create policy "Admins can update bookings"
on public.bookings for update to authenticated
using (exists (select 1 from public.admin_users where user_id = (select auth.uid())))
with check (exists (select 1 from public.admin_users where user_id = (select auth.uid())));
