-- Migration: Add message_tracking table for better message management
-- This table allows tracking messages by messageKey for different contexts

-- Create message_tracking table
CREATE TABLE IF NOT EXISTS message_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id BIGINT NOT NULL,
  message_key VARCHAR(255) NOT NULL,
  message_id BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique combination of chat_id and message_key
  UNIQUE(chat_id, message_key)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_message_tracking_chat_id ON message_tracking(chat_id);
CREATE INDEX IF NOT EXISTS idx_message_tracking_message_key ON message_tracking(message_key);
CREATE INDEX IF NOT EXISTS idx_message_tracking_chat_message_key ON message_tracking(chat_id, message_key);

-- Create trigger for updated_at
CREATE TRIGGER update_message_tracking_updated_at 
  BEFORE UPDATE ON message_tracking 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE message_tracking ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies
CREATE POLICY "Anyone can view message tracking" ON message_tracking FOR SELECT USING (true);
CREATE POLICY "Anyone can insert message tracking" ON message_tracking FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update message tracking" ON message_tracking FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete message tracking" ON message_tracking FOR DELETE USING (true);
