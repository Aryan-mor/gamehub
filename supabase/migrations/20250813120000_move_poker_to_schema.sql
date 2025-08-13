-- Move poker tables from public schema to dedicated schema `poker`
-- Also create tables in `poker` if they don't exist

-- Create schema
create schema if not exists poker;

-- Move existing public tables if present
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'poker_hands') then
    execute 'alter table public.poker_hands set schema poker';
    -- rename to generic name
    if exists (select 1 from information_schema.tables where table_schema = 'poker' and table_name = 'poker_hands') then
      execute 'alter table poker.poker_hands rename to hands';
    end if;
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'poker_seats') then
    execute 'alter table public.poker_seats set schema poker';
    if exists (select 1 from information_schema.tables where table_schema = 'poker' and table_name = 'poker_seats') then
      execute 'alter table poker.poker_seats rename to seats';
    end if;
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'poker_actions') then
    execute 'alter table public.poker_actions set schema poker';
    if exists (select 1 from information_schema.tables where table_schema = 'poker' and table_name = 'poker_actions') then
      execute 'alter table poker.poker_actions rename to actions';
    end if;
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'poker_pots') then
    execute 'alter table public.poker_pots set schema poker';
    if exists (select 1 from information_schema.tables where table_schema = 'poker' and table_name = 'poker_pots') then
      execute 'alter table poker.poker_pots rename to pots';
    end if;
  end if;
end $$;

-- Create tables in poker schema if they do not exist (idempotent)
create table if not exists poker.hands (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid not null,
  button_pos smallint not null,
  street text not null check (street in ('preflop','flop','turn','river','showdown')),
  board text[] not null default '{}',
  acting_pos smallint not null,
  min_raise numeric not null default 0,
  current_bet numeric not null default 0,
  deck_seed text not null,
  version integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  finished_at timestamptz,
  constraint hands_room_fk foreign key (room_id) references public.rooms (id) on delete cascade
);

create index if not exists idx_hands_room on poker.hands (room_id);

create table if not exists poker.seats (
  hand_id uuid not null,
  seat_pos smallint not null,
  user_id uuid not null,
  stack numeric not null,
  bet numeric not null default 0,
  in_hand boolean not null default true,
  is_all_in boolean not null default false,
  hole text[] default null,
  primary key (hand_id, seat_pos),
  constraint seats_hand_fk foreign key (hand_id) references poker.hands (id) on delete cascade
);

create index if not exists idx_seats_user on poker.seats (user_id);

create table if not exists poker.actions (
  id uuid primary key default uuid_generate_v4(),
  hand_id uuid not null,
  seq integer not null,
  actor_pos smallint not null,
  type text not null check (type in ('CHECK','CALL','FOLD','RAISE','ALL_IN','POST_SB','POST_BB','DEAL','REVEAL','AWARD')),
  amount numeric,
  resulting_version integer not null,
  created_at timestamptz not null default now(),
  constraint actions_hand_fk foreign key (hand_id) references poker.hands (id) on delete cascade,
  constraint actions_seq_unique unique (hand_id, seq)
);

create index if not exists idx_actions_hand on poker.actions (hand_id);

create table if not exists poker.pots (
  id uuid primary key default uuid_generate_v4(),
  hand_id uuid not null,
  amount numeric not null default 0,
  eligible_seats smallint[] not null,
  constraint pots_hand_fk foreign key (hand_id) references poker.hands (id) on delete cascade
);

create index if not exists idx_pots_hand on poker.pots (hand_id);

-- Ensure updated_at trigger exists on poker.hands
do $$
begin
  if not exists (
    select 1 from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where t.tgname = 'trg_poker_hands_updated' and n.nspname = 'poker'
  ) then
    execute 'create trigger trg_poker_hands_updated before update on poker.hands for each row execute function public.set_updated_at()';
  end if;
end $$;


