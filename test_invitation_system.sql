-- Test script for the invitation system
-- Run this in your Supabase SQL editor to test the system

-- 1. First, make sure the chat_invitations table exists
SELECT * FROM chat_invitations LIMIT 1;

-- 2. Check if the trigger function exists
SELECT proname FROM pg_proc WHERE proname = 'handle_invitation_acceptance';

-- 3. Check if the trigger exists
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_name = 'handle_invitation_acceptance_trigger';

-- 4. Test the invitation system (replace with actual user IDs)
-- First, create a test invitation
INSERT INTO chat_invitations (sender_id, recipient_id, message, status)
VALUES (
  'your-sender-user-id', 
  'your-recipient-user-id', 
  'Test invitation message', 
  'pending'
);

-- 5. Check the invitation was created
SELECT * FROM chat_invitations WHERE status = 'pending';

-- 6. Accept the invitation (this should trigger conversation creation)
UPDATE chat_invitations 
SET status = 'accepted' 
WHERE sender_id = 'your-sender-user-id' AND recipient_id = 'your-recipient-user-id';

-- 7. Check if conversation was created
SELECT * FROM conversations 
WHERE (participant1_id = 'your-sender-user-id' AND participant2_id = 'your-recipient-user-id')
   OR (participant1_id = 'your-recipient-user-id' AND participant2_id = 'your-sender-user-id');

-- 8. Clean up test data
DELETE FROM conversations 
WHERE (participant1_id = 'your-sender-user-id' AND participant2_id = 'your-recipient-user-id')
   OR (participant1_id = 'your-recipient-user-id' AND participant2_id = 'your-sender-user-id');

DELETE FROM chat_invitations 
WHERE sender_id = 'your-sender-user-id' AND recipient_id = 'your-recipient-user-id';
