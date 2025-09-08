-- =====================================================
-- Fix Database Issues and Add Notification Features
-- =====================================================

-- 1. Drop existing trigger if it exists to avoid conflicts
DROP TRIGGER IF EXISTS update_conversation_on_new_message ON messages;

-- 2. Drop the function if it exists
DROP FUNCTION IF EXISTS trigger_update_conversation_last_message();

-- 3. Recreate the function
CREATE OR REPLACE FUNCTION trigger_update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_conversation_last_message(NEW.conversation_id, NEW.content);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Recreate the trigger
CREATE TRIGGER update_conversation_on_new_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_conversation_last_message();

-- 5. Add missing columns to users table if they don't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS theme text DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system'));

-- 6. Create user_settings table if it doesn't exist
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

-- 7. Create search_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS search_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  search_query text NOT NULL,
  search_type text DEFAULT 'user' CHECK (search_type IN ('user', 'conversation', 'message')),
  created_at timestamptz DEFAULT now()
);

-- 8. Enable RLS on new tables
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

-- 9. Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can read own search history" ON search_history;
DROP POLICY IF EXISTS "Users can insert own search history" ON search_history;
DROP POLICY IF EXISTS "Users can delete own search history" ON search_history;

-- 10. Create RLS policies for new tables
CREATE POLICY "Users can read own settings" ON user_settings 
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can update own settings" ON user_settings 
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own settings" ON user_settings 
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read own search history" ON search_history 
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own search history" ON search_history 
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own search history" ON search_history 
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- 11. Create storage bucket for profile pictures if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-pictures', 'profile-pictures', true) 
ON CONFLICT (id) DO NOTHING;

-- 12. Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Users can upload their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Profile pictures are publicly viewable" ON storage.objects;

-- 13. Create storage policies for profile pictures
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

-- 14. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_participant1 ON conversations(participant1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant2 ON conversations(participant2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON search_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 15. Create function to get unread message count for a conversation
CREATE OR REPLACE FUNCTION get_unread_count(
  conversation_id uuid,
  user_id uuid
) RETURNS integer AS $$
DECLARE
  unread_count integer;
BEGIN
  SELECT COUNT(*) INTO unread_count
  FROM messages
  WHERE conversation_id = $1
    AND sender_id != $2
    AND status = 'sent';
  
  RETURN COALESCE(unread_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 16. Create function to get total unread count for a user
CREATE OR REPLACE FUNCTION get_total_unread_count(user_id uuid)
RETURNS integer AS $$
DECLARE
  total_count integer;
BEGIN
  SELECT COUNT(*) INTO total_count
  FROM messages m
  JOIN conversations c ON m.conversation_id = c.id
  WHERE (c.participant1_id = $1 OR c.participant2_id = $1)
    AND m.sender_id != $1
    AND m.status = 'sent';
  
  RETURN COALESCE(total_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 17. Create function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(
  conversation_id uuid,
  user_id uuid
) RETURNS void AS $$
BEGIN
  UPDATE messages
  SET status = 'read'
  WHERE conversation_id = $1
    AND sender_id != $2
    AND status = 'sent';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 18. Create function to mark all messages as read for a user
CREATE OR REPLACE FUNCTION mark_all_messages_as_read(user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE messages
  SET status = 'read'
  WHERE sender_id != $1
    AND status = 'sent'
    AND conversation_id IN (
      SELECT id FROM conversations
      WHERE participant1_id = $1 OR participant2_id = $1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
-- Database fixes complete! 
-- All triggers, functions, and policies have been recreated.
-- The notification system is now ready to use.
