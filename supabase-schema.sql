-- Supabase Database Schema
-- This file contains the SQL schema for migrating from Firebase to Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telegram_id BIGINT UNIQUE NOT NULL,
  username VARCHAR(255),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wallets table
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  balance DECIMAL(15,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  game_type VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'waiting',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  max_players INTEGER DEFAULT 2,
  current_players INTEGER DEFAULT 0,
  stake_amount DECIMAL(15,2) DEFAULT 0.00,
  settings JSONB DEFAULT '{}',
  is_private BOOLEAN DEFAULT FALSE
);

-- Games table
CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id VARCHAR(255) UNIQUE NOT NULL,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  game_type VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  winner_id UUID REFERENCES users(id),
  game_data JSONB DEFAULT '{}',
  result_data JSONB DEFAULT '{}'
);

-- Game players table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS game_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  left_at TIMESTAMP WITH TIME ZONE,
  player_data JSONB DEFAULT '{}',
  UNIQUE(game_id, user_id)
);

-- Room players table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS room_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  left_at TIMESTAMP WITH TIME ZONE,
  is_ready BOOLEAN DEFAULT FALSE,
  player_data JSONB DEFAULT '{}',
  UNIQUE(room_id, user_id)
);

-- Game history table
CREATE TABLE IF NOT EXISTS game_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  action_type VARCHAR(50) NOT NULL,
  action_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table for wallet operations
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  balance_before DECIMAL(15,2) NOT NULL,
  balance_after DECIMAL(15,2) NOT NULL,
  description TEXT,
  reference_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Room messages table for storing message IDs
CREATE TABLE IF NOT EXISTS room_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  message_id INTEGER NOT NULL,
  chat_id BIGINT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_rooms_room_id ON rooms(room_id);
CREATE INDEX IF NOT EXISTS idx_rooms_game_type ON rooms(game_type);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_games_game_id ON games(game_id);
CREATE INDEX IF NOT EXISTS idx_games_room_id ON games(room_id);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_game_players_game_id ON game_players(game_id);
CREATE INDEX IF NOT EXISTS idx_game_players_user_id ON game_players(user_id);
CREATE INDEX IF NOT EXISTS idx_room_players_room_id ON room_players(room_id);
CREATE INDEX IF NOT EXISTS idx_room_players_user_id ON room_players(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_room_messages_room_id ON room_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_room_messages_user_id ON room_messages(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at (with error handling)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
        CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_wallets_updated_at') THEN
        CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_rooms_updated_at') THEN
        CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_games_updated_at') THEN
        CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_messages ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (you may want to customize these based on your needs)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own data' AND tablename = 'users') THEN
        CREATE POLICY "Users can view their own data" ON users FOR SELECT USING (true);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own data' AND tablename = 'users') THEN
        CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (true);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own data' AND tablename = 'users') THEN
        CREATE POLICY "Users can insert their own data" ON users FOR INSERT WITH CHECK (true);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own wallet' AND tablename = 'wallets') THEN
        CREATE POLICY "Users can view their own wallet" ON wallets FOR SELECT USING (true);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own wallet' AND tablename = 'wallets') THEN
        CREATE POLICY "Users can update their own wallet" ON wallets FOR UPDATE USING (true);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own wallet' AND tablename = 'wallets') THEN
        CREATE POLICY "Users can insert their own wallet" ON wallets FOR INSERT WITH CHECK (true);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view public rooms' AND tablename = 'rooms') THEN
        CREATE POLICY "Anyone can view public rooms" ON rooms FOR SELECT USING (true);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Room creators can update their rooms' AND tablename = 'rooms') THEN
        CREATE POLICY "Room creators can update their rooms" ON rooms FOR UPDATE USING (true);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can create rooms' AND tablename = 'rooms') THEN
        CREATE POLICY "Anyone can create rooms" ON rooms FOR INSERT WITH CHECK (true);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view games' AND tablename = 'games') THEN
        CREATE POLICY "Anyone can view games" ON games FOR SELECT USING (true);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Game participants can update games' AND tablename = 'games') THEN
        CREATE POLICY "Game participants can update games" ON games FOR UPDATE USING (true);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can create games' AND tablename = 'games') THEN
        CREATE POLICY "Anyone can create games" ON games FOR INSERT WITH CHECK (true);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view room messages' AND tablename = 'room_messages') THEN
        CREATE POLICY "Anyone can view room messages" ON room_messages FOR SELECT USING (true);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can insert room messages' AND tablename = 'room_messages') THEN
        CREATE POLICY "Anyone can insert room messages" ON room_messages FOR INSERT WITH CHECK (true);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can update room messages' AND tablename = 'room_messages') THEN
        CREATE POLICY "Anyone can update room messages" ON room_messages FOR UPDATE USING (true);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can delete room messages' AND tablename = 'room_messages') THEN
        CREATE POLICY "Anyone can delete room messages" ON room_messages FOR DELETE USING (true);
    END IF;
END $$;

-- Insert some default data if needed
-- INSERT INTO users (telegram_id, username, first_name, last_name) VALUES (123456789, 'testuser', 'Test', 'User');
-- INSERT INTO wallets (user_id, balance) VALUES ((SELECT id FROM users WHERE telegram_id = 123456789), 1000.00); 