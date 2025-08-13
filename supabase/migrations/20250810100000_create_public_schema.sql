-- Base public schema for GameHub (users, wallets, rooms, etc.)
create extension if not exists "uuid-ossp";

-- Users
create table if not exists public.users (
  id uuid primary key default uuid_generate_v4(),
  telegram_id bigint unique not null,
  username varchar(255),
  first_name varchar(255),
  last_name varchar(255),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  is_active boolean default true,
  last_seen timestamptz default now()
);

-- Wallets
create table if not exists public.wallets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  balance numeric(15,2) default 0.00,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

-- Rooms
create table if not exists public.rooms (
  id uuid primary key default uuid_generate_v4(),
  name varchar(255) not null,
  game_type varchar(50) not null,
  status varchar(50) default 'waiting',
  created_by uuid references public.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  max_players integer default 2,
  current_players integer default 0,
  stake_amount numeric(15,2) default 0.00,
  settings jsonb default '{}',
  is_private boolean default false,
  last_chat_id bigint
);

-- Room players
create table if not exists public.room_players (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid references public.rooms(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  joined_at timestamptz default now(),
  left_at timestamptz,
  is_ready boolean default false,
  player_data jsonb default '{}',
  unique(room_id, user_id)
);

-- Indexes
create index if not exists idx_users_telegram_id on public.users(telegram_id);
create index if not exists idx_rooms_game_type on public.rooms(game_type);
create index if not exists idx_rooms_status on public.rooms(status);
create index if not exists idx_room_players_room_id on public.room_players(room_id);
create index if not exists idx_room_players_user_id on public.room_players(user_id);

-- updated_at trigger
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language 'plpgsql';

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'update_users_updated_at') then
    create trigger update_users_updated_at before update on public.users for each row execute function public.update_updated_at_column();
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'update_rooms_updated_at') then
    create trigger update_rooms_updated_at before update on public.rooms for each row execute function public.update_updated_at_column();
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'update_wallets_updated_at') then
    create trigger update_wallets_updated_at before update on public.wallets for each row execute function public.update_updated_at_column();
  end if;
end $$;


