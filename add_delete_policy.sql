-- Add missing DELETE policy for conversations table
-- This allows users to delete conversations they participate in

-- Add DELETE policy for conversations
CREATE POLICY "Users can delete their conversations" ON conversations 
  FOR DELETE TO authenticated USING (participant1_id = auth.uid() OR participant2_id = auth.uid());

-- Add DELETE policy for messages (in case it's needed)
CREATE POLICY "Users can delete messages in their conversations" ON messages 
  FOR DELETE TO authenticated USING (
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE participant1_id = auth.uid() OR participant2_id = auth.uid()
    )
  );
