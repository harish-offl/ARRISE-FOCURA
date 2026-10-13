create table if not exists public.focura_user_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{"sessions":[],"folders":[],"libraryMaterials":[],"focusRecords":[],"isDark":false}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.focura_focus_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.focura_focus_state enable row level security;

drop policy if exists "Users can read their own FOCURA focus state" on public.focura_focus_state;
create policy "Users can read their own FOCURA focus state"
  on public.focura_focus_state for select
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own FOCURA focus state" on public.focura_focus_state;
create policy "Users can insert their own FOCURA focus state"
  on public.focura_focus_state for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own FOCURA focus state" on public.focura_focus_state;
create policy "Users can update their own FOCURA focus state"
  on public.focura_focus_state for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter table public.focura_user_data enable row level security;

drop policy if exists "Users can read their own FOCURA data" on public.focura_user_data;
create policy "Users can read their own FOCURA data"
  on public.focura_user_data for select
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own FOCURA data" on public.focura_user_data;
create policy "Users can insert their own FOCURA data"
  on public.focura_user_data for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own FOCURA data" on public.focura_user_data;
create policy "Users can update their own FOCURA data"
  on public.focura_user_data for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create table if not exists public.focura_friend_invites (
  id uuid primary key default gen_random_uuid(),
  inviter_id uuid not null references auth.users (id) on delete cascade,
  inviter_name text not null,
  invitee_email text not null,
  invitee_id uuid references auth.users (id) on delete set null,
  invite_token text not null unique default encode(gen_random_bytes(24), 'hex'),
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now()
);

create index if not exists focura_friend_invites_inviter_id_idx
  on public.focura_friend_invites (inviter_id);
create index if not exists focura_friend_invites_invitee_email_idx
  on public.focura_friend_invites (lower(invitee_email));

alter table public.focura_friend_invites enable row level security;

drop policy if exists "Users can read invites they sent or received" on public.focura_friend_invites;
create policy "Users can read invites they sent or received"
  on public.focura_friend_invites for select
  using (
    (select auth.uid()) = inviter_id
    or lower(invitee_email) = lower((select auth.jwt() ->> 'email'))
  );

drop policy if exists "Users can create their own invites" on public.focura_friend_invites;
create policy "Users can create their own invites"
  on public.focura_friend_invites for insert
  with check (
    (select auth.uid()) = inviter_id
    and lower(invitee_email) <> lower(coalesce((select auth.jwt() ->> 'email'), ''))
    and status = 'pending'
    and invitee_id is null
  );

create or replace function public.accept_focura_friend_invite()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  supplied_token text;
begin
  supplied_token := new.raw_user_meta_data ->> 'friend_invite_token';

  if supplied_token is not null and new.email is not null then
    update public.focura_friend_invites
      set invitee_id = new.id,
          status = 'accepted'
      where invite_token = supplied_token
        and lower(invitee_email) = lower(new.email)
        and inviter_id <> new.id
        and status = 'pending';
  end if;

  return new;
end;
$$;

drop trigger if exists on_focura_auth_user_created on auth.users;
create trigger on_focura_auth_user_created
  after insert on auth.users
  for each row execute function public.accept_focura_friend_invite();

insert into storage.buckets (id, name, public, file_size_limit)
values ('study-materials', 'study-materials', false, 10485760)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit;

drop policy if exists "Users can read their own study material files" on storage.objects;
create policy "Users can read their own study material files"
  on storage.objects for select
  using (
    bucket_id = 'study-materials'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users can upload their own study material files" on storage.objects;
create policy "Users can upload their own study material files"
  on storage.objects for insert
  with check (
    bucket_id = 'study-materials'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users can delete their own study material files" on storage.objects;
create policy "Users can delete their own study material files"
  on storage.objects for delete
  using (
    bucket_id = 'study-materials'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'focura_user_data'
  ) then
    alter publication supabase_realtime add table public.focura_user_data;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'focura_friend_invites'
  ) then
    alter publication supabase_realtime add table public.focura_friend_invites;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'focura_focus_state'
  ) then
    alter publication supabase_realtime add table public.focura_focus_state;
  end if;
end;
$$;
