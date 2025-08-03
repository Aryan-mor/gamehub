-- Migration script to fix chat_id column type in room_messages table
-- This script changes chat_id from INTEGER to BIGINT to accommodate larger Telegram chat IDs

-- Check if the column exists and is INTEGER type
DO $$
BEGIN
    -- Check if chat_id column exists and is INTEGER
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'room_messages' 
        AND column_name = 'chat_id' 
        AND data_type = 'integer'
    ) THEN
        -- Alter the column to BIGINT
        ALTER TABLE room_messages ALTER COLUMN chat_id TYPE BIGINT;
        RAISE NOTICE 'Successfully changed chat_id column from INTEGER to BIGINT';
    ELSE
        -- Check if column is already BIGINT
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'room_messages' 
            AND column_name = 'chat_id' 
            AND data_type = 'bigint'
        ) THEN
            RAISE NOTICE 'chat_id column is already BIGINT type';
        ELSE
            RAISE NOTICE 'chat_id column not found in room_messages table';
        END IF;
    END IF;
END $$;

-- Verify the change
SELECT 
    column_name, 
    data_type, 
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'room_messages' 
AND column_name = 'chat_id'; 