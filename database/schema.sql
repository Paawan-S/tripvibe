-- TripVibe database schema (Supabase / PostgreSQL)

-- Clean start (safe: our old trips table is empty)
drop trigger if exists on_auth_user_created on auth.users;
drop table if exists history cascade;
drop table if exists saved_places cascade;
drop table if exists itineraries cascade;
drop table if exists preferences cascade;
drop table if exists trips cascade;
drop table if exists users cascade;

-- 1. users: profile info, linked to Supabase Auth
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  created_at timestamptz default now()
);

-- 2. preferences: each user's default travel preferences
create table preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  vibe text,
  budget text,
  interests text[],
  travel_style text,
  updated_at timestamptz default now()
);

-- 3. trips: the details entered in the trip form
create table trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  destination text not null,
  start_date date,
  end_date date,
  budget text,
  vibe text,
  interests text[],
  travelers int default 1,
  created_at timestamptz default now()
);

-- 4. itineraries: the AI-generated plan for a trip
create table itineraries (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content jsonb not null,
  version int default 1,
  created_at timestamptz default now()
);

-- 5. saved_places: places a user bookmarks
create table saved_places (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id uuid references trips(id) on delete cascade,
  name text not null,
  category text,
  notes text,
  image_url text,
  created_at timestamptz default now()
);

-- 6. history: a log of what the user did
create table history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  details jsonb,
  created_at timestamptz default now()
);

-- Security: each user can only touch their own rows
alter table users enable row level security;
create policy "own profile" on users
  for all using (auth.uid() = id) with check (auth.uid() = id);

do $$
declare t text;
begin
  foreach t in array array['preferences','trips','itineraries','saved_places','history']
  loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy "own rows" on %I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
  end loop;
end $$;

-- Auto-create a users row whenever someone signs up
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, name)
  values (new.id, new.email, new.raw_user_meta_data->>'name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

  -- Epic 3: extra fields for the preference form
alter table trips rename column vibe to travel_style;
alter table trips rename column travelers to group_size;
alter table trips drop column budget;
alter table trips add column budget_per_day numeric;
alter table trips add column pace text default 'moderate';
alter table trips add column dietary_restrictions text[];
alter table trips add column mobility_concerns text;

-- Epic 4: store the user's feedback when they regenerate
alter table itineraries add column feedback text;