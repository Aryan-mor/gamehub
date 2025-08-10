-- Remove message history columns from users table
-- These are now stored in memory instead of database

ALTER TABLE users DROP COLUMN IF EXISTS last_message_id;
ALTER TABLE users DROP COLUMN IF EXISTS last_chat_id;
