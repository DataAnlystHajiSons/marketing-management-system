-- =============================================
-- FIX ROW LEVEL SECURITY FOR FARMER_ACTIVITIES
-- =============================================
-- This script ensures proper RLS policies for activity logging

-- Step 1: Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'farmer_activities';

-- Step 2: If RLS is enabled, create/update policies
-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated users to insert activities" ON farmer_activities;
DROP POLICY IF EXISTS "Allow authenticated users to view activities" ON farmer_activities;
DROP POLICY IF EXISTS "Allow authenticated users to update activities" ON farmer_activities;
DROP POLICY IF EXISTS "Allow authenticated users to delete activities" ON farmer_activities;

-- Step 3: Create comprehensive policies for authenticated users
-- Allow INSERT
CREATE POLICY "Allow authenticated users to insert activities"
ON farmer_activities
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow SELECT
CREATE POLICY "Allow authenticated users to view activities"
ON farmer_activities
FOR SELECT
TO authenticated
USING (true);

-- Allow UPDATE
CREATE POLICY "Allow authenticated users to update activities"
ON farmer_activities
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow DELETE
CREATE POLICY "Allow authenticated users to delete activities"
ON farmer_activities
FOR DELETE
TO authenticated
USING (true);

-- Step 4: Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'farmer_activities';

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE 'RLS policies for farmer_activities have been configured successfully';
END $$;
