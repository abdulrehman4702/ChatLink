# Chat Invitations Setup Guide

This guide explains how to set up the chat invitation system in your ChatLink application.

## Database Setup

1. **Run the database migration**:

   ```sql
   -- Execute the contents of chat_invitations_schema.sql in your Supabase SQL editor
   ```

2. **Verify the table was created**:
   ```sql
   SELECT * FROM chat_invitations LIMIT 1;
   ```

## Features Implemented

### 1. Chat Invitation System

- Users must send invitations before starting conversations
- Invitations can include optional personal messages
- Real-time notifications for new invitations
- Invitation status tracking (pending, accepted, rejected, cancelled)

### 2. User Interface Updates

- **User List**: Shows invitation status indicators
  - 🕒 "Invitation sent" - You've sent an invitation
  - 👤 "Invitation received" - User has sent you an invitation
- **Invitation Modal**: Send invitations with optional messages
- **Notification System**: Real-time toast notifications for new invitations
- **Invitation Management**: View and manage pending/sent invitations

### 3. Backend Integration

- Socket.io events for real-time invitation notifications
- Database triggers for automatic conversation creation
- Row Level Security (RLS) policies for data protection

## How It Works

### Sending an Invitation

1. User clicks on another user in the user list
2. If no existing conversation or invitation exists, an invitation modal opens
3. User can add an optional message and send the invitation
4. Recipient receives a real-time notification

### Accepting/Rejecting Invitations

1. Recipient sees notification with sender's info and message
2. Can accept or reject the invitation
3. If accepted, a conversation is automatically created
4. Both users are notified and can start chatting

### User Experience

- **Before**: Click user → Direct conversation creation
- **After**: Click user → Send invitation → Wait for acceptance → Start chatting

## Files Modified/Created

### New Files

- `chat_invitations_schema.sql` - Database schema
- `src/hooks/useInvitations.ts` - Invitation management hook
- `src/components/invitations/InvitationModal.tsx` - Send invitation modal
- `src/components/invitations/InvitationList.tsx` - View invitations
- `src/components/invitations/InvitationNotification.tsx` - Real-time notifications
- `src/components/settings/InvitationSettings.tsx` - Settings page component

### Modified Files

- `src/lib/supabase.ts` - Added chat_invitations types
- `src/components/sidebar/ChatSidebarRefactored.tsx` - Updated user click behavior
- `src/components/sidebar/UserItem.tsx` - Added invitation status indicators
- `src/components/Chat.tsx` - Added invitation notifications
- `server.js` - Added socket events for invitations

## Testing the System

1. **Create two user accounts**
2. **Login with first user** and click on the second user
3. **Send an invitation** with an optional message
4. **Login with second user** and check for notifications
5. **Accept the invitation** and verify conversation is created
6. **Test rejection** by sending another invitation and rejecting it

## Security Features

- Row Level Security (RLS) enabled on chat_invitations table
- Users can only see invitations they sent or received
- Automatic conversation creation only on invitation acceptance
- Socket events are properly authenticated

## Future Enhancements

- Bulk invitation management
- Invitation expiration dates
- Invitation templates
- Advanced notification preferences
- Invitation analytics
