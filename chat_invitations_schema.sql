-- =====================================================
-- Chat Invitations Table
-- =====================================================

-- Create chat_invitations table
CREATE TABLE IF NOT EXISTS chat_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  message text, -- Optional invitation message
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  -- Ensure users can't send multiple pending invitations to the same person
  UNIQUE(sender_id, recipient_id, status) DEFERRABLE INITIALLY DEFERRED,
  -- Ensure users can't invite themselves
  CONSTRAINT different_users CHECK (sender_id != recipient_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_chat_invitations_recipient_status 
ON chat_invitations(recipient_id, status);

CREATE INDEX IF NOT EXISTS idx_chat_invitations_sender_status 
ON chat_invitations(sender_id, status);

-- Enable RLS
ALTER TABLE chat_invitations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view invitations they sent or received" ON chat_invitations
  FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = recipient_id
  );

CREATE POLICY "Users can create invitations" ON chat_invitations
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update invitations they received" ON chat_invitations
  FOR UPDATE USING (auth.uid() = recipient_id);

CREATE POLICY "Users can delete invitations they sent" ON chat_invitations
  FOR DELETE USING (auth.uid() = sender_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_chat_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_chat_invitations_updated_at
  BEFORE UPDATE ON chat_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_invitations_updated_at();

-- Create function to handle invitation acceptance (creates conversation)
CREATE OR REPLACE FUNCTION handle_invitation_acceptance()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if status changed to 'accepted'
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    -- Check if conversation already exists
    IF NOT EXISTS (
      SELECT 1 FROM conversations 
      WHERE (participant1_id = NEW.sender_id AND participant2_id = NEW.recipient_id)
         OR (participant1_id = NEW.recipient_id AND participant2_id = NEW.sender_id)
    ) THEN
      -- Create new conversation
      INSERT INTO conversations (participant1_id, participant2_id)
      VALUES (NEW.sender_id, NEW.recipient_id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for invitation acceptance
CREATE TRIGGER handle_invitation_acceptance_trigger
  AFTER UPDATE ON chat_invitations
  FOR EACH ROW
  EXECUTE FUNCTION handle_invitation_acceptance();
