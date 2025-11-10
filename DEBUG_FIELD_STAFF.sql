-- Debug Field Staff Not Showing
-- Run these queries in Supabase SQL Editor

-- 1. Check if field staff exists in database
SELECT * FROM field_staff ORDER BY created_at DESC LIMIT 10;

-- 2. Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('field_staff', 'zones', 'areas', 'user_profiles');

-- 3. Test the exact query the API uses
SELECT 
  fs.*,
  z.id as zone_id_ref,
  z.name as zone_name,
  z.code as zone_code,
  a.id as area_id_ref,
  a.name as area_name,
  a.code as area_code,
  u.id as tmo_id,
  u.full_name as tmo_name,
  u.email as tmo_email
FROM field_staff fs
LEFT JOIN zones z ON fs.zone_id = z.id
LEFT JOIN areas a ON fs.area_id = a.id
LEFT JOIN user_profiles u ON fs.telemarketing_officer_id = u.id
ORDER BY fs.full_name;

-- 4. If RLS is enabled, disable it
ALTER TABLE field_staff DISABLE ROW LEVEL SECURITY;
ALTER TABLE zones DISABLE ROW LEVEL SECURITY;
ALTER TABLE areas DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- 5. Check for orphaned references
-- Field staff with invalid zone_id
SELECT fs.id, fs.full_name, fs.zone_id
FROM field_staff fs
LEFT JOIN zones z ON fs.zone_id = z.id
WHERE fs.zone_id IS NOT NULL AND z.id IS NULL;

-- Field staff with invalid area_id
SELECT fs.id, fs.full_name, fs.area_id
FROM field_staff fs
LEFT JOIN areas a ON fs.area_id = a.id
WHERE fs.area_id IS NOT NULL AND a.id IS NULL;

-- Field staff with invalid TMO id
SELECT fs.id, fs.full_name, fs.telemarketing_officer_id
FROM field_staff fs
LEFT JOIN user_profiles u ON fs.telemarketing_officer_id = u.id
WHERE fs.telemarketing_officer_id IS NOT NULL AND u.id IS NULL;
