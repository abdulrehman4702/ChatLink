-- Database Cleanup Script for ChatLink
-- This script will clean all data from the database tables
-- Run these queries in order to reset your database to a clean state

-- 1. Delete all messages (this should be done first due to foreign key constraints)
DELETE FROM messages;

-- 2. Delete all conversations
DELETE FROM conversations;

-- 3. Delete all chat invitations
DELETE FROM chat_invitations;

-- 4. Delete all user settings
DELETE FROM user_settings;

-- 5. Delete all users (except system users if any)
DELETE FROM users;

-- 6. Reset any sequences if they exist (optional, for PostgreSQL)
-- ALTER SEQUENCE users_id_seq RESTART WITH 1;
-- ALTER SEQUENCE conversations_id_seq RESTART WITH 1;
-- ALTER SEQUENCE messages_id_seq RESTART WITH 1;
-- ALTER SEQUENCE chat_invitations_id_seq RESTART WITH 1;

-- 7. Verify cleanup (optional - run these to check if tables are empty)
-- SELECT COUNT(*) FROM users;
-- SELECT COUNT(*) FROM conversations;
-- SELECT COUNT(*) FROM messages;
-- SELECT COUNT(*) FROM chat_invitations;
-- SELECT COUNT(*) FROM user_settings;

-- Note: This will completely reset your database.
-- Make sure to backup any important data before running this script.
