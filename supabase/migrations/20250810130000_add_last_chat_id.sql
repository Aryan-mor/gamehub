-- Add last_chat_id column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_chat_id BIGINT;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_users_last_chat_id ON users(last_chat_id);
