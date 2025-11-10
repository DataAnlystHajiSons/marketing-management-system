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
