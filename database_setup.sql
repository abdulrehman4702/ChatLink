-- =====================================================
-- ChatLink Database Setup Script
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  avatar_url text,
  status text DEFAULT 'offline' CHECK (status IN ('online', 'offline')),
  last_seen timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  -- Profile fields
  bio text,
  phone text,
  location text,
  theme text DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system'))
);

-- =====================================================
-- 2. USER SETTINGS TABLE
-- =====================================================
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

-- =====================================================
-- 3. SEARCH HISTORY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS search_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  search_query text NOT NULL,
  search_type text DEFAULT 'user' CHECK (search_type IN ('user', 'conversation', 'message')),
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- 4. CONVERSATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant1_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  participant2_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_message text,
  last_message_at timestamptz,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT different_participants CHECK (participant1_id != participant2_id),
  UNIQUE(participant1_id, participant2_id)
);

-- =====================================================
-- 5. MESSAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content text NOT NULL,
  status text DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read')),
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- 6. ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 7. DROP EXISTING POLICIES (if any)
-- =====================================================
DROP POLICY IF EXISTS "Users can read all user profiles" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can read their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can read messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can update message status" ON messages;
DROP POLICY IF EXISTS "Users can read own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can read own search history" ON search_history;
DROP POLICY IF EXISTS "Users can insert own search history" ON search_history;
DROP POLICY IF EXISTS "Users can delete own search history" ON search_history;

-- =====================================================
-- 8. CREATE RLS POLICIES
-- =====================================================

-- User policies
CREATE POLICY "Users can read all user profiles" ON users 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON users 
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users 
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- User settings policies
CREATE POLICY "Users can read own settings" ON user_settings 
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can update own settings" ON user_settings 
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own settings" ON user_settings 
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Search history policies
CREATE POLICY "Users can read own search history" ON search_history 
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own search history" ON search_history 
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own search history" ON search_history 
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Conversation policies
CREATE POLICY "Users can read their conversations" ON conversations 
  FOR SELECT TO authenticated USING (participant1_id = auth.uid() OR participant2_id = auth.uid());

CREATE POLICY "Users can create conversations" ON conversations 
  FOR INSERT TO authenticated WITH CHECK (participant1_id = auth.uid() OR participant2_id = auth.uid());

CREATE POLICY "Users can update their conversations" ON conversations 
  FOR UPDATE TO authenticated USING (participant1_id = auth.uid() OR participant2_id = auth.uid());

-- Message policies
CREATE POLICY "Users can read messages in their conversations" ON messages 
  FOR SELECT TO authenticated USING (
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE participant1_id = auth.uid() OR participant2_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages" ON messages 
  FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update message status" ON messages 
  FOR UPDATE TO authenticated USING (
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE participant1_id = auth.uid() OR participant2_id = auth.uid()
    )
  );

-- =====================================================
-- 9. CREATE STORAGE BUCKET FOR PROFILE PICTURES
-- =====================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-pictures', 'profile-pictures', true) 
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 10. STORAGE POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Users can upload their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Profile pictures are publicly viewable" ON storage.objects;

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

-- =====================================================
-- 11. CREATE INDEXES FOR BETTER PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_conversations_participant1 ON conversations(participant1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant2 ON conversations(participant2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON search_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- =====================================================
-- 12. CREATE FUNCTIONS FOR COMMON OPERATIONS
-- =====================================================

-- Function to get or create conversation between two users
CREATE OR REPLACE FUNCTION get_or_create_conversation(
  user1_id uuid,
  user2_id uuid
) RETURNS uuid AS $$
DECLARE
  conversation_id uuid;
BEGIN
  -- Try to find existing conversation
  SELECT id INTO conversation_id
  FROM conversations
  WHERE (participant1_id = user1_id AND participant2_id = user2_id)
     OR (participant1_id = user2_id AND participant2_id = user1_id)
  LIMIT 1;
  
  -- If no conversation exists, create one
  IF conversation_id IS NULL THEN
    INSERT INTO conversations (participant1_id, participant2_id)
    VALUES (user1_id, user2_id)
    RETURNING id INTO conversation_id;
  END IF;
  
  RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update conversation last message
CREATE OR REPLACE FUNCTION update_conversation_last_message(
  conv_id uuid,
  message_content text
) RETURNS void AS $$
BEGIN
  UPDATE conversations
  SET last_message = message_content,
      last_message_at = now()
  WHERE id = conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 13. CREATE TRIGGERS
-- =====================================================

-- Trigger to automatically update conversation last message when a new message is inserted
CREATE OR REPLACE FUNCTION trigger_update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_conversation_last_message(NEW.conversation_id, NEW.content);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_on_new_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_conversation_last_message();

-- =====================================================
-- 14. SAMPLE DATA (OPTIONAL - FOR TESTING)
-- =====================================================

-- Uncomment the following lines to insert sample data for testing
/*
-- Insert sample users (you'll need to replace these with actual auth.users IDs)
INSERT INTO users (id, email, full_name, status) VALUES
  ('00000000-0000-0000-0000-000000000001', 'user1@example.com', 'John Doe', 'online'),
  ('00000000-0000-0000-0000-000000000002', 'user2@example.com', 'Jane Smith', 'online'),
  ('00000000-0000-0000-0000-000000000003', 'user3@example.com', 'Bob Johnson', 'offline');

-- Insert sample user settings
INSERT INTO user_settings (user_id, show_online_status, allow_direct_messages) VALUES
  ('00000000-0000-0000-0000-000000000001', true, true),
  ('00000000-0000-0000-0000-000000000002', true, true),
  ('00000000-0000-0000-0000-000000000003', false, true);
*/

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
-- Database setup complete! 
-- All tables, policies, indexes, and functions have been created.
-- You can now run your ChatLink application.
