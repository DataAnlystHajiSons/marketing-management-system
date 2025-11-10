-- =============================================
-- DIAGNOSE FARMER ASSIGNMENTS ISSUE
-- =============================================
-- Purpose: Check why "Assigned TMO" and "Field Staff" show as "Unassigned"
-- Run this to diagnose the problem before fixing
-- Date: 2025-10-29
-- =============================================

-- =============================================
-- STEP 1: CHECK IF COLUMNS EXIST
-- =============================================

DO $$ 
BEGIN 
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '1. CHECKING COLUMN EXISTENCE';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
END $$;

SELECT 
    column_name,
    data_type,
    is_nullable,
    CASE 
        WHEN column_name = 'assigned_tmo_id' THEN '👤 TMO Assignment'
        WHEN column_name = 'assigned_field_staff_id' THEN '👨‍🌾 Field Staff Assignment'
        WHEN column_name = 'assigned_dealer_id' THEN '🏪 Dealer Assignment'
    END as description
FROM information_schema.columns
WHERE table_name = 'farmers' 
AND column_name IN ('assigned_tmo_id', 'assigned_field_staff_id', 'assigned_dealer_id')
ORDER BY column_name;

-- =============================================
-- STEP 2: CHECK FOREIGN KEY CONSTRAINTS
-- =============================================

DO $$ 
BEGIN 
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '2. CHECKING FOREIGN KEY CONSTRAINTS';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
END $$;

SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'farmers'
AND tc.constraint_type = 'FOREIGN KEY'
AND kcu.column_name IN ('assigned_tmo_id', 'assigned_field_staff_id', 'assigned_dealer_id');

-- =============================================
-- STEP 3: CHECK DATA IN FARMERS TABLE
-- =============================================

DO $$ 
BEGIN 
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '3. CHECKING ACTUAL DATA';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
END $$;

-- Count farmers with/without assignments
SELECT 
    COUNT(*) as total_farmers,
    COUNT(assigned_tmo_id) as with_tmo,
    COUNT(*) - COUNT(assigned_tmo_id) as without_tmo,
    COUNT(assigned_field_staff_id) as with_field_staff,
    COUNT(*) - COUNT(assigned_field_staff_id) as without_field_staff,
    COUNT(assigned_dealer_id) as with_dealer,
    COUNT(*) - COUNT(assigned_dealer_id) as without_dealer
FROM farmers;

-- =============================================
-- STEP 4: SAMPLE FARMER DATA
-- =============================================

DO $$ 
BEGIN 
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '4. SAMPLE FARMER DATA (First 5)';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
END $$;

SELECT 
    farmer_code,
    full_name,
    assigned_tmo_id,
    assigned_field_staff_id,
    assigned_dealer_id
FROM farmers
ORDER BY created_at DESC
LIMIT 5;

-- =============================================
-- STEP 5: CHECK IF RELATED TABLES HAVE DATA
-- =============================================

DO $$ 
BEGIN 
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '5. CHECKING RELATED TABLES';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
END $$;

-- Check user_profiles (TMOs)
SELECT 
    'user_profiles' as table_name,
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE role = 'telemarketing_officer') as tmo_users,
    COUNT(*) FILTER (WHERE role = 'telemarketing_officer' AND is_active = true) as active_tmo_users
FROM user_profiles;

-- Check field_staff
SELECT 
    'field_staff' as table_name,
    COUNT(*) as total_staff,
    COUNT(*) FILTER (WHERE is_active = true) as active_staff
FROM field_staff;

-- Check dealers
SELECT 
    'dealers' as table_name,
    COUNT(*) as total_dealers,
    COUNT(*) FILTER (WHERE is_active = true) as active_dealers
FROM dealers;

-- =============================================
-- STEP 6: TEST JOINS
-- =============================================

DO $$ 
BEGIN 
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '6. TESTING JOINS (First 3 farmers)';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
END $$;

SELECT 
    f.farmer_code,
    f.full_name as farmer_name,
    f.assigned_tmo_id,
    u.full_name as tmo_name,
    u.email as tmo_email,
    f.assigned_field_staff_id,
    fs.full_name as field_staff_name,
    fs.staff_code as field_staff_code,
    f.assigned_dealer_id,
    d.business_name as dealer_name,
    d.dealer_code as dealer_code
FROM farmers f
LEFT JOIN user_profiles u ON f.assigned_tmo_id = u.id
LEFT JOIN field_staff fs ON f.assigned_field_staff_id = fs.id
LEFT JOIN dealers d ON f.assigned_dealer_id = d.id
ORDER BY f.created_at DESC
LIMIT 3;

-- =============================================
-- STEP 7: DIAGNOSIS SUMMARY
-- =============================================

DO $$ 
DECLARE
    v_has_tmo_column BOOLEAN;
    v_farmers_with_tmo INT;
    v_farmers_without_tmo INT;
    v_farmers_with_fs INT;
    v_farmers_without_fs INT;
    v_active_tmos INT;
    v_active_staff INT;
BEGIN 
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '7. DIAGNOSIS SUMMARY';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    
    -- Check if column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'farmers' AND column_name = 'assigned_tmo_id'
    ) INTO v_has_tmo_column;
    
    IF v_has_tmo_column THEN
        RAISE NOTICE '✅ Column assigned_tmo_id EXISTS';
        
        -- Get counts
        SELECT 
            COUNT(assigned_tmo_id),
            COUNT(*) - COUNT(assigned_tmo_id),
            COUNT(assigned_field_staff_id),
            COUNT(*) - COUNT(assigned_field_staff_id)
        INTO 
            v_farmers_with_tmo,
            v_farmers_without_tmo,
            v_farmers_with_fs,
            v_farmers_without_fs
        FROM farmers;
        
        RAISE NOTICE '';
        RAISE NOTICE 'Farmers WITH TMO assigned: %', v_farmers_with_tmo;
        RAISE NOTICE 'Farmers WITHOUT TMO: %', v_farmers_without_tmo;
        RAISE NOTICE 'Farmers WITH Field Staff: %', v_farmers_with_fs;
        RAISE NOTICE 'Farmers WITHOUT Field Staff: %', v_farmers_without_fs;
        
        IF v_farmers_without_tmo > 0 OR v_farmers_without_fs > 0 THEN
            RAISE NOTICE '';
            RAISE NOTICE '⚠️  PROBLEM: Some farmers have NULL assignments';
            RAISE NOTICE '';
            RAISE NOTICE '💡 SOLUTION:';
            RAISE NOTICE '   1. Assign TMO/Staff manually via UI, OR';
            RAISE NOTICE '   2. Run UPDATE queries below to assign defaults';
        END IF;
        
    ELSE
        RAISE NOTICE '❌ Column assigned_tmo_id DOES NOT EXIST';
        RAISE NOTICE '';
        RAISE NOTICE '💡 SOLUTION:';
        RAISE NOTICE '   Run: ADD_ASSIGNED_TMO_TO_FARMERS.sql';
    END IF;
    
    -- Check available users
    SELECT COUNT(*) FILTER (WHERE role = 'telemarketing_officer' AND is_active = true)
    INTO v_active_tmos
    FROM user_profiles;
    
    SELECT COUNT(*) FILTER (WHERE is_active = true)
    INTO v_active_staff
    FROM field_staff;
    
    RAISE NOTICE '';
    RAISE NOTICE '📊 Available Resources:';
    RAISE NOTICE '   Active TMO Users: %', v_active_tmos;
    RAISE NOTICE '   Active Field Staff: %', v_active_staff;
    
    IF v_active_tmos = 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE '⚠️  WARNING: No active TMO users found!';
        RAISE NOTICE '   Create TMO users in user_profiles table first';
    END IF;
    
    IF v_active_staff = 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE '⚠️  WARNING: No active field staff found!';
        RAISE NOTICE '   Create field staff records first';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
END $$;

-- =============================================
-- QUICK FIX QUERIES (OPTIONAL - UNCOMMENT TO USE)
-- =============================================

/*
-- Assign first active TMO to all farmers without one
DO $$ 
DECLARE
    v_default_tmo_id UUID;
BEGIN
    SELECT id INTO v_default_tmo_id
    FROM user_profiles
    WHERE role = 'telemarketing_officer' AND is_active = true
    LIMIT 1;
    
    IF v_default_tmo_id IS NOT NULL THEN
        UPDATE farmers 
        SET assigned_tmo_id = v_default_tmo_id
        WHERE assigned_tmo_id IS NULL;
        
        RAISE NOTICE 'Assigned default TMO to % farmers', 
            (SELECT COUNT(*) FROM farmers WHERE assigned_tmo_id = v_default_tmo_id);
    END IF;
END $$;

-- Assign first active field staff to all farmers without one
DO $$ 
DECLARE
    v_default_fs_id UUID;
BEGIN
    SELECT id INTO v_default_fs_id
    FROM field_staff
    WHERE is_active = true
    LIMIT 1;
    
    IF v_default_fs_id IS NOT NULL THEN
        UPDATE farmers 
        SET assigned_field_staff_id = v_default_fs_id
        WHERE assigned_field_staff_id IS NULL;
        
        RAISE NOTICE 'Assigned default Field Staff to % farmers', 
            (SELECT COUNT(*) FROM farmers WHERE assigned_field_staff_id = v_default_fs_id);
    END IF;
END $$;
*/
