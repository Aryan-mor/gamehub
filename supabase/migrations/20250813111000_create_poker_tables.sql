-- Poker core tables: hands, seats, actions, pots
-- This migration creates the minimal schema to persist hand lifecycle safely

-- Enable UUID extension if not already
create extension if not exists "uuid-ossp";

-- Hands
create table if not exists public.poker_hands (
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
  constraint poker_hands_room_fk foreign key (room_id) references public.rooms (id) on delete cascade
);

create index if not exists idx_poker_hands_room on public.poker_hands (room_id);

-- Seats per hand
create table if not exists public.poker_seats (
  hand_id uuid not null,
  seat_pos smallint not null,
  user_id uuid not null,
  stack numeric not null,
  bet numeric not null default 0,
  in_hand boolean not null default true,
  is_all_in boolean not null default false,
  hole text[] default null,
  primary key (hand_id, seat_pos),
  constraint poker_seats_hand_fk foreign key (hand_id) references public.poker_hands (id) on delete cascade
);

create index if not exists idx_poker_seats_user on public.poker_seats (user_id);

-- Actions applied to a hand (event log)
create table if not exists public.poker_actions (
  id uuid primary key default uuid_generate_v4(),
  hand_id uuid not null,
  seq integer not null,
  actor_pos smallint not null,
  type text not null check (type in ('CHECK','CALL','FOLD','RAISE','ALL_IN','POST_SB','POST_BB','DEAL','REVEAL','AWARD')),
  amount numeric,
  resulting_version integer not null,
  created_at timestamptz not null default now(),
  constraint poker_actions_hand_fk foreign key (hand_id) references public.poker_hands (id) on delete cascade,
  constraint poker_actions_seq_unique unique (hand_id, seq)
);

create index if not exists idx_poker_actions_hand on public.poker_actions (hand_id);

-- Pots and side-pots
create table if not exists public.poker_pots (
  id uuid primary key default uuid_generate_v4(),
  hand_id uuid not null,
  amount numeric not null default 0,
  eligible_seats smallint[] not null,
  constraint poker_pots_hand_fk foreign key (hand_id) references public.poker_hands (id) on delete cascade
);

create index if not exists idx_poker_pots_hand on public.poker_pots (hand_id);

-- Update triggers to maintain updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_poker_hands_updated on public.poker_hands;
create trigger trg_poker_hands_updated before update on public.poker_hands
for each row execute function public.set_updated_at();


