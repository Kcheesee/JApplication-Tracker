-- Migration: Add gmail_auto_sync_enabled column to user_settings table
-- Run this SQL script in your Render PostgreSQL database

-- Add the new column (safe - won't fail if column already exists in newer deploys)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_settings'
        AND column_name = 'gmail_auto_sync_enabled'
    ) THEN
        ALTER TABLE user_settings
        ADD COLUMN gmail_auto_sync_enabled BOOLEAN DEFAULT FALSE;

        RAISE NOTICE 'Column gmail_auto_sync_enabled added successfully';
    ELSE
        RAISE NOTICE 'Column gmail_auto_sync_enabled already exists';
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'user_settings'
AND column_name = 'gmail_auto_sync_enabled';
