-- Fix chat_id column type in room_messages table
-- This migration changes chat_id from INTEGER to BIGINT to accommodate larger Telegram chat IDs

ALTER TABLE room_messages ALTER COLUMN chat_id TYPE BIGINT; 