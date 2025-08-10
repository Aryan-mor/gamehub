-- Migration: Remove room_messages table and add last_message_id to users
-- This migration removes the room_messages table since we're using last_message_id in users table

-- Drop the room_messages table and all its dependencies
DROP TABLE IF EXISTS room_messages CASCADE;

-- Add last_message_id column to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_message_id BIGINT;
