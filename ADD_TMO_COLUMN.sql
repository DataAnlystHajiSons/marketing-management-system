-- =============================================
-- Add TMO Assignment Column to Farmers Table
-- =============================================

-- Add assigned_tmo_id column to farmers table
ALTER TABLE farmers ADD COLUMN IF NOT EXISTS assigned_tmo_id UUID REFERENCES user_profiles(id);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_farmers_tmo ON farmers(assigned_tmo_id);

-- Add comment for clarity
COMMENT ON COLUMN farmers.assigned_field_staff_id IS 'Field Staff who is the lead source (referral)';
COMMENT ON COLUMN farmers.assigned_tmo_id IS 'Telemarketing Officer assigned to manage this farmer';

-- Verify the change
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'farmers'
  AND column_name IN ('assigned_field_staff_id', 'assigned_tmo_id');
