-- =====================================================
-- Fix Missing User Settings Columns
-- =====================================================

-- Add missing notification columns to user_settings table if they don't exist
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS email_notifications boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS push_notifications boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS message_notifications boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS sound_notifications boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS desktop_notifications boolean DEFAULT true;

-- Add missing privacy columns if they don't exist
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS show_online_status boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_last_seen boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS allow_direct_messages boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_read_receipts boolean DEFAULT true;

-- Add missing search columns if they don't exist
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS searchable_by_email boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS searchable_by_phone boolean DEFAULT false;

-- Add missing preference columns if they don't exist
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS language text DEFAULT 'en',
ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'UTC';

-- Create user_settings table if it doesn't exist at all
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- Privacy settings
  show_online_status boolean DEFAULT true,
  show_last_seen boolean DEFAULT true,
  allow_direct_messages boolean DEFAULT true,
  show_read_receipts boolean DEFAULT true,
  -- Search settings
  searchable_by_email boolean DEFAULT true,
  searchable_by_phone boolean DEFAULT false,
  -- Notification settings
  email_notifications boolean DEFAULT true,
  push_notifications boolean DEFAULT true,
  message_notifications boolean DEFAULT true,
  sound_notifications boolean DEFAULT true,
  desktop_notifications boolean DEFAULT true,
  -- Other preferences
  language text DEFAULT 'en',
  timezone text DEFAULT 'UTC',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on user_settings table
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;

-- Create policies for user_settings
CREATE POLICY "Users can read own settings" ON user_settings 
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can update own settings" ON user_settings 
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own settings" ON user_settings 
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Create default settings for existing users who don't have settings
INSERT INTO user_settings (user_id)
SELECT id FROM users 
WHERE id NOT IN (SELECT user_id FROM user_settings)
ON CONFLICT (user_id) DO NOTHING;
