-- =============================================
-- ADD ENGAGEMENT_ID TO FARMER_ACTIVITIES TABLE
-- =============================================
-- This script adds the engagement_id column to link activities to specific product engagements
-- Run this in your Supabase SQL Editor

-- Step 1: Add engagement_id column to farmer_activities table
ALTER TABLE farmer_activities 
ADD COLUMN IF NOT EXISTS engagement_id UUID REFERENCES farmer_product_engagements(id) ON DELETE SET NULL;

-- Step 2: Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_farmer_activities_engagement 
ON farmer_activities(engagement_id);

-- Step 3: Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'farmer_activities' 
AND column_name = 'engagement_id';

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE 'Successfully added engagement_id column to farmer_activities table';
END $$;
