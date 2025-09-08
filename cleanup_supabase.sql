-- =====================================================
-- Supabase Cleanup Script
-- =====================================================
-- This script will clean up both your database tables AND Supabase Auth
-- Run this in your Supabase SQL Editor

-- WARNING: This will delete ALL data from your database and auth system
-- Make sure you want to do this before running!

-- =====================================================
-- 1. CLEAN UP YOUR DATABASE TABLES
-- =====================================================

-- Delete all data from your custom tables (in correct order due to foreign keys)
DELETE FROM chat_invitations;
DELETE FROM messages;
DELETE FROM conversations;
DELETE FROM user_settings;
DELETE FROM users;

-- =====================================================
-- 2. CLEAN UP SUPABASE AUTH
-- =====================================================

-- Delete all users from Supabase Auth
-- This requires admin privileges
DELETE FROM auth.users;

-- =====================================================
-- 3. RESET SEQUENCES (if you have any)
-- =====================================================

-- Reset any auto-increment sequences if you have them
-- (You don't seem to have any based on your schema, but just in case)

-- =====================================================
-- 4. VERIFY CLEANUP
-- =====================================================

-- Check that all tables are empty
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'conversations', COUNT(*) FROM conversations
UNION ALL
SELECT 'messages', COUNT(*) FROM messages
UNION ALL
SELECT 'chat_invitations', COUNT(*) FROM chat_invitations
UNION ALL
SELECT 'user_settings', COUNT(*) FROM user_settings;

-- Check that auth.users is empty
SELECT COUNT(*) as auth_users_count FROM auth.users;

-- =====================================================
-- NOTES:
-- =====================================================
-- 1. After running this script, you can signup with any email again
-- 2. All your database tables will be empty but the structure remains
-- 3. All Supabase Auth users will be deleted
-- 4. You'll need to recreate your database tables if you want to start fresh
--    (Run your database_setup.sql script again)
