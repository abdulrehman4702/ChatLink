-- Fix authentication and RLS policy issues
-- This script addresses the 401/406 errors in AuthContext

-- 1. Fix users table policies
DROP POLICY IF EXISTS "Users can read all user profiles" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Service role can insert users" ON users;

CREATE POLICY "Users can read all user profiles" ON users 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON users 
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users 
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- 2. Fix user_settings table policies
DROP POLICY IF EXISTS "Users can read own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;

CREATE POLICY "Users can read own settings" ON user_settings 
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can update own settings" ON user_settings 
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own settings" ON user_settings 
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- 3. Grant necessary permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON user_settings TO authenticated;
