-- =============================================
-- ADD ASSIGNED_TMO_ID TO FARMERS TABLE
-- =============================================
-- Purpose: Add TMO assignment column to farmers table
-- Run this to fix "Assigned TMO" showing as "Unassigned"
-- Date: 2025-10-29
-- =============================================

-- Add assigned_tmo_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'farmers' 
        AND column_name = 'assigned_tmo_id'
    ) THEN
        ALTER TABLE farmers 
        ADD COLUMN assigned_tmo_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL;
        
        RAISE NOTICE '✅ Added assigned_tmo_id column to farmers table';
    ELSE
        RAISE NOTICE '⚠️  assigned_tmo_id column already exists';
    END IF;
END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_farmers_tmo 
    ON farmers(assigned_tmo_id) 
    WHERE assigned_tmo_id IS NOT NULL;

-- Update TypeScript type comment
COMMENT ON COLUMN farmers.assigned_tmo_id IS 'Reference to TMO (Telemarketing Officer) assigned to this farmer';

-- =============================================
-- VERIFICATION
-- =============================================

-- Check column exists
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'farmers' 
AND column_name = 'assigned_tmo_id';

-- Check index exists
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'farmers' 
AND indexname = 'idx_farmers_tmo';

-- =============================================
-- OPTIONAL: ASSIGN DEFAULT TMO TO EXISTING FARMERS
-- =============================================

-- Uncomment and modify this if you want to assign a default TMO
-- to farmers that don't have one

/*
-- Get the first TMO user
DO $$ 
DECLARE
    v_default_tmo_id UUID;
BEGIN
    SELECT id INTO v_default_tmo_id
    FROM user_profiles
    WHERE role = 'telemarketing_officer' 
    AND is_active = true
    LIMIT 1;
    
    IF v_default_tmo_id IS NOT NULL THEN
        -- Update farmers without TMO assignment
        UPDATE farmers 
        SET assigned_tmo_id = v_default_tmo_id
        WHERE assigned_tmo_id IS NULL;
        
        RAISE NOTICE '✅ Assigned default TMO to % farmers', 
            (SELECT COUNT(*) FROM farmers WHERE assigned_tmo_id = v_default_tmo_id);
    ELSE
        RAISE NOTICE '⚠️  No active TMO users found';
    END IF;
END $$;
*/

-- =============================================
-- SUCCESS MESSAGE
-- =============================================

DO $$ 
BEGIN 
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ ASSIGNED_TMO_ID COLUMN - ADDED';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📋 What was done:';
    RAISE NOTICE '  ✓ Added assigned_tmo_id column to farmers table';
    RAISE NOTICE '  ✓ Created index for performance';
    RAISE NOTICE '  ✓ Added foreign key to user_profiles';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Next steps:';
    RAISE NOTICE '  1. Manually assign TMOs to farmers via UI';
    RAISE NOTICE '  2. Or run the optional SQL above to assign default TMO';
    RAISE NOTICE '';
    RAISE NOTICE '🔍 Current status:';
    RAISE NOTICE '  Farmers with TMO: %', 
        (SELECT COUNT(*) FROM farmers WHERE assigned_tmo_id IS NOT NULL);
    RAISE NOTICE '  Farmers without TMO: %', 
        (SELECT COUNT(*) FROM farmers WHERE assigned_tmo_id IS NULL);
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
END $$;
