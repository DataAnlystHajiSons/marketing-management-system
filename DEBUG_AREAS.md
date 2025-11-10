# Debug Areas Not Showing

## Steps to Debug:

### 1. Check RLS Status
Run in Supabase SQL Editor:
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('areas', 'zones');
```

Expected Result:
```
areas  | f (false - RLS disabled)
zones  | f (false - RLS disabled)
```

If RLS is enabled (true), disable it:
```sql
ALTER TABLE areas DISABLE ROW LEVEL SECURITY;
ALTER TABLE zones DISABLE ROW LEVEL SECURITY;
```

---

### 2. Check if Areas Exist
Run in Supabase SQL Editor:
```sql
-- Check areas data
SELECT * FROM areas ORDER BY name;
```

If no data, add sample areas:
```sql
-- First, check zones
SELECT id, code, name FROM zones;

-- Add sample areas (replace ZONE_ID with actual zone ID)
INSERT INTO areas (code, name, zone_id, is_active)
VALUES 
  ('NZ-A01', 'Lahore', 'ZONE_ID_HERE', true),
  ('NZ-A02', 'Faisalabad', 'ZONE_ID_HERE', true);
```

---

### 3. Test the Join Query
Run in Supabase SQL Editor:
```sql
-- Test the exact query the API uses
SELECT 
  areas.*,
  zones.id as zone_id,
  zones.name as zone_name,
  zones.code as zone_code
FROM areas
LEFT JOIN zones ON areas.zone_id = zones.id
ORDER BY areas.name;
```

This should return all areas with their zone information.

---

### 4. Check Browser Console
1. Open: http://localhost:3000/management/areas
2. Press F12 → Console tab
3. Look for these logs:
   ```
   areasAPI.getAll() called
   Raw response: { data: [...], error: null }
   Areas API Response: { data: [...], error: null }
   Areas count: X
   Setting areas: [...]
   ```

---

### 5. Check Network Tab
1. Press F12 → Network tab
2. Reload the page
3. Look for request to Supabase
4. Check the response

---

## Common Issues & Solutions:

### Issue 1: RLS is Enabled
**Symptom:** `data: []` or `data: null`
**Solution:**
```sql
ALTER TABLE areas DISABLE ROW LEVEL SECURITY;
ALTER TABLE zones DISABLE ROW LEVEL SECURITY;
```

### Issue 2: No Data in Database
**Symptom:** Console shows `Areas count: 0`
**Solution:** Add sample data (see Step 2 above)

### Issue 3: Join Failing
**Symptom:** Error about columns not found
**Solution:** The column name was `zone_code` but should be `code`
**Fixed in:** `src/lib/supabase/areas.ts`

### Issue 4: Foreign Key Missing
**Symptom:** Areas have `zone_id` but zones don't exist
**Solution:**
```sql
-- Find orphaned areas
SELECT a.* 
FROM areas a
LEFT JOIN zones z ON a.zone_id = z.id
WHERE z.id IS NULL;

-- Either delete orphaned areas or add missing zones
```

---

## Testing Checklist:

- [ ] RLS disabled on areas table
- [ ] RLS disabled on zones table
- [ ] At least 1 area exists in database
- [ ] Areas have valid zone_id references
- [ ] Browser console shows no errors
- [ ] Network tab shows successful API response
- [ ] Page displays areas correctly

---

## Expected Console Output:

```
areasAPI.getAll() called
Raw response: { 
  data: [
    {
      id: "abc-123",
      code: "NZ-A01",
      name: "Lahore",
      zone_id: "xyz-456",
      is_active: true,
      zones: {
        id: "xyz-456",
        name: "North Zone",
        code: "NZ"
      }
    }
  ], 
  error: null 
}
Areas API Response: { data: [...], error: null }
Areas count: 1
Setting areas: [...]
```

---

## Quick Fix SQL:

```sql
-- Complete fix script
ALTER TABLE areas DISABLE ROW LEVEL SECURITY;
ALTER TABLE zones DISABLE ROW LEVEL SECURITY;

-- Add sample zone if missing
INSERT INTO zones (code, name, country, is_active)
VALUES ('NZ', 'North Zone', 'Pakistan', true)
ON CONFLICT (code) DO NOTHING;

-- Add sample areas
INSERT INTO areas (code, name, zone_id, is_active)
SELECT 'NZ-A01', 'Lahore', z.id, true
FROM zones z WHERE z.code = 'NZ'
ON CONFLICT (code) DO NOTHING;

INSERT INTO areas (code, name, zone_id, is_active)
SELECT 'NZ-A02', 'Faisalabad', z.id, true
FROM zones z WHERE z.code = 'NZ'
ON CONFLICT (code) DO NOTHING;

-- Verify
SELECT 
  a.code as area_code,
  a.name as area_name,
  z.code as zone_code,
  z.name as zone_name
FROM areas a
JOIN zones z ON a.zone_id = z.id;
```
