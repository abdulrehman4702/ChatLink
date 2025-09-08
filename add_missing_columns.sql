-- =====================================================
-- Add Missing Columns to Existing Database
-- =====================================================

-- Add missing columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS theme text DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system'));

-- Create user_settings table if it doesn't exist
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

-- Create search_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS search_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  search_query text NOT NULL,
  search_type text DEFAULT 'user' CHECK (search_type IN ('user', 'conversation', 'message')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

-- Create policies for user_settings
CREATE POLICY "Users can read own settings" ON user_settings 
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can update own settings" ON user_settings 
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own settings" ON user_settings 
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Create policies for search_history
CREATE POLICY "Users can read own search history" ON search_history 
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own search history" ON search_history 
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own search history" ON search_history 
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Create storage bucket for profile pictures if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-pictures', 'profile-pictures', true) 
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for profile pictures
CREATE POLICY "Users can upload their own profile pictures" ON storage.objects 
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'profile-pictures' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own profile pictures" ON storage.objects 
  FOR UPDATE TO authenticated USING (
    bucket_id = 'profile-pictures' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own profile pictures" ON storage.objects 
  FOR DELETE TO authenticated USING (
    bucket_id = 'profile-pictures' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Profile pictures are publicly viewable" ON storage.objects 
  FOR SELECT TO authenticated USING (bucket_id = 'profile-pictures');

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON search_history(created_at DESC);

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
-- Missing columns have been added to your existing database!
-- You can now use the full features of the ChatLink application.
