# Dealers Hierarchical Location Migration Guide

## Problem
The `dealers` table is missing `zone_id` and `village_id` columns needed for the hierarchical location system (Zone → Area → Village).

## Error Message
```
Error creating dealer: Could not find the 'zone_id' column of 'dealers' in the schema cache
```

## Solution

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Run the Migration Script

Copy and paste the following SQL script into the SQL Editor:

```sql
-- =============================================
-- Migration: Add Hierarchical Location to Dealers Table
-- Description: Add zone_id and village_id columns to match farmers table structure
-- =============================================

-- Add zone_id column
ALTER TABLE dealers 
ADD COLUMN IF NOT EXISTS zone_id UUID REFERENCES zones(id);

-- Add village_id column
ALTER TABLE dealers 
ADD COLUMN IF NOT EXISTS village_id UUID REFERENCES villages(id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_dealers_zone_id ON dealers(zone_id);
CREATE INDEX IF NOT EXISTS idx_dealers_village_id ON dealers(village_id);

-- Add comment for documentation
COMMENT ON COLUMN dealers.zone_id IS 'Reference to zones table for hierarchical location (Zone → Area → Village)';
COMMENT ON COLUMN dealers.village_id IS 'Reference to villages table for hierarchical location (Zone → Area → Village)';

-- Update existing dealers to have zone_id based on their area_id (if area exists)
UPDATE dealers d
SET zone_id = a.zone_id
FROM areas a
WHERE d.area_id = a.id
  AND d.zone_id IS NULL;

-- Display results
SELECT 
    COUNT(*) as total_dealers,
    COUNT(zone_id) as dealers_with_zone,
    COUNT(area_id) as dealers_with_area,
    COUNT(village_id) as dealers_with_village
FROM dealers;
```

### Step 3: Execute the Script

1. Click the **Run** button (or press `Ctrl+Enter`)
2. Wait for the script to complete
3. You should see a success message
4. The last SELECT statement will show you the results

### Step 4: Verify the Changes

Run this query to verify the new columns exist:

```sql
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'dealers' 
  AND column_name IN ('zone_id', 'village_id')
ORDER BY column_name;
```

Expected result:
```
column_name  | data_type | is_nullable
-------------|-----------|------------
village_id   | uuid      | YES
zone_id      | uuid      | YES
```

### Step 5: Test Adding a Dealer

1. Go back to your application
2. Navigate to `/crm/dealers`
3. Click **+ Add Dealer**
4. Fill in the form with hierarchical location:
   - Select a Zone
   - Select an Area (will populate based on zone)
   - Select a Village (will populate based on area)
5. Click **Create Dealer**
6. Should succeed without errors! ✅

## What This Migration Does

### 1. Adds New Columns
- `zone_id` - UUID reference to zones table
- `village_id` - UUID reference to villages table

### 2. Maintains Existing Data
- Existing `area_id` column remains unchanged
- Existing `city` column remains unchanged
- No data loss

### 3. Updates Existing Dealers
- Automatically sets `zone_id` for existing dealers based on their `area_id`
- Example: If dealer has `area_id` → Faisalabad, and Faisalabad belongs to Punjab zone, then `zone_id` → Punjab

### 4. Creates Indexes
- Indexes on `zone_id` and `village_id` for faster queries
- Improves performance when filtering by zone or village

## Schema Before vs After

### Before (Old Structure):
```
dealers
├─ area_id → areas
├─ city (text)
└─ address (text)
```

### After (New Structure):
```
dealers
├─ zone_id → zones
├─ area_id → areas
├─ village_id → villages
└─ address (text)
```

## Benefits

### 1. Consistent Data Model
- Dealers and Farmers now use the same location hierarchy
- Unified reporting across modules

### 2. Better Filtering
- Filter dealers by zone (all dealers in Punjab)
- Filter dealers by area (all dealers in Faisalabad)
- Filter dealers by village (all dealers in Dijkot)

### 3. Hierarchical Reporting
- Zone-level sales reports
- Area-level performance metrics
- Village-level market penetration

### 4. Improved UX
- Cascading dropdowns guide users
- Prevents invalid location combinations
- Consistent with farmers module

## Rollback (If Needed)

If you need to remove the changes:

```sql
-- Remove indexes
DROP INDEX IF EXISTS idx_dealers_zone_id;
DROP INDEX IF EXISTS idx_dealers_village_id;

-- Remove columns
ALTER TABLE dealers DROP COLUMN IF EXISTS zone_id;
ALTER TABLE dealers DROP COLUMN IF EXISTS village_id;
```

## Notes

- This migration is **safe** to run multiple times (uses `IF NOT EXISTS`)
- No data will be lost
- Existing dealers will continue to work
- New dealers can use full hierarchical location
- Old dealers can be updated later with village information

## Support

If you encounter any issues:

1. Check Supabase logs for detailed error messages
2. Verify zones, areas, and villages tables exist
3. Ensure foreign key relationships are valid
4. Run the verification query to confirm columns exist

## Next Steps

After running this migration:

1. ✅ Add new dealers with full location hierarchy
2. ✅ Update existing dealers to add village information
3. ✅ Build reports using zone/area/village grouping
4. ✅ Create location-based filters in dealers table
5. ✅ Implement dealer territory management

---

**Migration created by:** Droid AI Assistant
**Date:** 2025-11-01
**Version:** 1.0
