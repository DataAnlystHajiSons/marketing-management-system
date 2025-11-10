-- =============================================
-- FIX: Infinite Recursion in user_profiles RLS
-- =============================================

-- Drop existing problematic policies on user_profiles
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Option 1: Disable RLS on user_profiles (SIMPLEST - Use this first)
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Option 2: If you want RLS enabled, use these policies instead
-- (Only run these if Option 1 doesn't work for your security needs)

/*
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read all profiles
CREATE POLICY "Allow authenticated read access"
ON user_profiles FOR SELECT
TO authenticated
USING (true);

-- Allow users to update their own profile only
CREATE POLICY "Allow users to update own profile"
ON user_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Allow service role to do everything
CREATE POLICY "Allow service role full access"
ON user_profiles FOR ALL
TO service_role
USING (true);
*/

-- =============================================
-- Fix other tables with similar issues
-- =============================================

-- Disable RLS on frequently accessed tables (for development)
ALTER TABLE farmers DISABLE ROW LEVEL SECURITY;
ALTER TABLE dealers DISABLE ROW LEVEL SECURITY;
ALTER TABLE calls_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE meetings DISABLE ROW LEVEL SECURITY;
ALTER TABLE visits DISABLE ROW LEVEL SECURITY;
ALTER TABLE sales_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE field_staff DISABLE ROW LEVEL SECURITY;

-- =============================================
-- IMPORTANT: For Production
-- =============================================
-- After testing, you should enable RLS with proper policies
-- This ensures data security in production
-- For now, disabled RLS allows development to proceed
