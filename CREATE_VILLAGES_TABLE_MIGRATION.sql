-- =============================================
-- CREATE VILLAGES TABLE & UPDATE FARMERS
-- =============================================
-- Purpose: Implement hierarchical location system (Zone → Area → Village)
-- Run this in Supabase SQL Editor
-- Date: 2025-10-29
-- =============================================

-- =============================================
-- STEP 1: CREATE VILLAGES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS villages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    area_id UUID NOT NULL REFERENCES areas(id) ON DELETE RESTRICT,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20),
    village_type VARCHAR(50) DEFAULT 'rural', -- 'rural', 'urban', 'semi-urban'
    population INT,
    postal_code VARCHAR(10),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_village_per_area UNIQUE(area_id, name)
);

-- Add comment
COMMENT ON TABLE villages IS 'Villages/Towns/Localities within areas for hierarchical location management';
COMMENT ON COLUMN villages.area_id IS 'Reference to parent area (district/city)';
COMMENT ON COLUMN villages.village_type IS 'Type: rural, urban, or semi-urban';

-- =============================================
-- STEP 2: CREATE INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_villages_area 
    ON villages(area_id) 
    WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_villages_name 
    ON villages(name);

CREATE INDEX IF NOT EXISTS idx_villages_active 
    ON villages(is_active);

CREATE INDEX IF NOT EXISTS idx_villages_code 
    ON villages(code) 
    WHERE code IS NOT NULL;

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_villages_name_search 
    ON villages USING gin(to_tsvector('english', name));

-- =============================================
-- STEP 3: ADD LOCATION HIERARCHY TO FARMERS
-- =============================================

-- Add new columns for hierarchical location
ALTER TABLE farmers 
    ADD COLUMN IF NOT EXISTS zone_id UUID REFERENCES zones(id) ON DELETE SET NULL;

ALTER TABLE farmers 
    ADD COLUMN IF NOT EXISTS area_id UUID REFERENCES areas(id) ON DELETE SET NULL;

ALTER TABLE farmers 
    ADD COLUMN IF NOT EXISTS village_id UUID REFERENCES villages(id) ON DELETE SET NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_farmers_zone 
    ON farmers(zone_id);

CREATE INDEX IF NOT EXISTS idx_farmers_area 
    ON farmers(area_id);

CREATE INDEX IF NOT EXISTS idx_farmers_village 
    ON farmers(village_id);

-- Add comments
COMMENT ON COLUMN farmers.zone_id IS 'Reference to zone (province/region) - auto-populated from area';
COMMENT ON COLUMN farmers.area_id IS 'Reference to area (district/city)';
COMMENT ON COLUMN farmers.village_id IS 'Reference to village (town/locality)';

-- =============================================
-- STEP 4: CREATE TRIGGER TO AUTO-POPULATE ZONE
-- =============================================

CREATE OR REPLACE FUNCTION auto_populate_farmer_zone()
RETURNS TRIGGER AS $$
BEGIN
    -- When area_id is set, automatically populate zone_id
    IF NEW.area_id IS NOT NULL THEN
        SELECT zone_id INTO NEW.zone_id
        FROM areas
        WHERE id = NEW.area_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_populate_farmer_zone ON farmers;
CREATE TRIGGER trigger_auto_populate_farmer_zone
    BEFORE INSERT OR UPDATE OF area_id ON farmers
    FOR EACH ROW
    EXECUTE FUNCTION auto_populate_farmer_zone();

-- =============================================
-- STEP 5: CREATE UPDATED_AT TRIGGER FOR VILLAGES
-- =============================================

CREATE OR REPLACE FUNCTION update_villages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_villages_timestamp ON villages;
CREATE TRIGGER trigger_update_villages_timestamp
    BEFORE UPDATE ON villages
    FOR EACH ROW
    EXECUTE FUNCTION update_villages_updated_at();

-- =============================================
-- STEP 6: CREATE HELPER VIEWS
-- =============================================

-- View: Village with full hierarchy
CREATE OR REPLACE VIEW v_villages_with_hierarchy AS
SELECT 
    v.id,
    v.name as village_name,
    v.code as village_code,
    v.village_type,
    v.population,
    v.is_active,
    a.id as area_id,
    a.name as area_name,
    a.code as area_code,
    z.id as zone_id,
    z.name as zone_name,
    z.code as zone_code,
    CONCAT(z.name, ' → ', a.name, ' → ', v.name) as full_path,
    v.created_at
FROM villages v
LEFT JOIN areas a ON v.area_id = a.id
LEFT JOIN zones z ON a.zone_id = z.id;

-- View: Farmers with location hierarchy
CREATE OR REPLACE VIEW v_farmers_with_location AS
SELECT 
    f.id,
    f.farmer_code,
    f.full_name,
    f.phone,
    z.name as zone_name,
    a.name as area_name,
    v.name as village_name,
    f.address as specific_address,
    CONCAT(
        COALESCE(v.name || ', ', ''),
        COALESCE(a.name || ', ', ''),
        COALESCE(z.name, '')
    ) as full_location,
    f.lead_stage,
    f.is_customer,
    f.created_at
FROM farmers f
LEFT JOIN zones z ON f.zone_id = z.id
LEFT JOIN areas a ON f.area_id = a.id
LEFT JOIN villages v ON f.village_id = v.id;

-- =============================================
-- STEP 7: CREATE HELPER FUNCTIONS
-- =============================================

-- Function: Get villages by area
CREATE OR REPLACE FUNCTION get_villages_by_area(p_area_id UUID)
RETURNS TABLE (
    id UUID,
    name VARCHAR(100),
    code VARCHAR(20),
    village_type VARCHAR(50),
    population INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.id,
        v.name,
        v.code,
        v.village_type,
        v.population
    FROM villages v
    WHERE v.area_id = p_area_id
        AND v.is_active = true
    ORDER BY v.name;
END;
$$ LANGUAGE plpgsql;

-- Function: Get villages by zone
CREATE OR REPLACE FUNCTION get_villages_by_zone(p_zone_id UUID)
RETURNS TABLE (
    id UUID,
    name VARCHAR(100),
    area_name VARCHAR(100),
    full_path TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.id,
        v.name,
        a.name as area_name,
        CONCAT(a.name, ' → ', v.name) as full_path
    FROM villages v
    JOIN areas a ON v.area_id = a.id
    WHERE a.zone_id = p_zone_id
        AND v.is_active = true
    ORDER BY a.name, v.name;
END;
$$ LANGUAGE plpgsql;

-- Function: Get farmer count per village
CREATE OR REPLACE FUNCTION get_village_farmer_stats(p_village_id UUID)
RETURNS TABLE (
    total_farmers BIGINT,
    customers BIGINT,
    leads BIGINT,
    avg_score NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_farmers,
        COUNT(*) FILTER (WHERE is_customer = true) as customers,
        COUNT(*) FILTER (WHERE is_customer = false) as leads,
        ROUND(AVG(lead_score), 2) as avg_score
    FROM farmers
    WHERE village_id = p_village_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- STEP 8: SEED SAMPLE VILLAGES (OPTIONAL)
-- =============================================

-- Insert sample villages for testing
-- You can remove this section or modify based on your data

DO $$
DECLARE
    v_punjab_zone_id UUID;
    v_multan_area_id UUID;
    v_lahore_area_id UUID;
BEGIN
    -- Get Punjab zone ID
    SELECT id INTO v_punjab_zone_id
    FROM zones
    WHERE name = 'Punjab'
    LIMIT 1;

    IF v_punjab_zone_id IS NOT NULL THEN
        -- Get Multan area ID
        SELECT id INTO v_multan_area_id
        FROM areas
        WHERE zone_id = v_punjab_zone_id
        AND name ILIKE '%Multan%'
        LIMIT 1;

        -- Get Lahore area ID
        SELECT id INTO v_lahore_area_id
        FROM areas
        WHERE zone_id = v_punjab_zone_id
        AND name ILIKE '%Lahore%'
        LIMIT 1;

        -- Insert sample villages for Multan
        IF v_multan_area_id IS NOT NULL THEN
            INSERT INTO villages (area_id, name, village_type)
            VALUES
                (v_multan_area_id, 'Chak 123', 'rural'),
                (v_multan_area_id, 'Chak 124', 'rural'),
                (v_multan_area_id, 'Shah Rukn-e-Alam Colony', 'urban'),
                (v_multan_area_id, 'Cantt', 'urban'),
                (v_multan_area_id, 'Gulgasht Colony', 'urban')
            ON CONFLICT (area_id, name) DO NOTHING;
        END IF;

        -- Insert sample villages for Lahore
        IF v_lahore_area_id IS NOT NULL THEN
            INSERT INTO villages (area_id, name, village_type)
            VALUES
                (v_lahore_area_id, 'Model Town', 'urban'),
                (v_lahore_area_id, 'Gulberg', 'urban'),
                (v_lahore_area_id, 'DHA Phase 5', 'urban'),
                (v_lahore_area_id, 'Johar Town', 'urban'),
                (v_lahore_area_id, 'Raiwind', 'rural')
            ON CONFLICT (area_id, name) DO NOTHING;
        END IF;

        RAISE NOTICE '✅ Sample villages inserted';
    ELSE
        RAISE NOTICE '⚠️  Punjab zone not found, skipping sample data';
    END IF;
END $$;

-- =============================================
-- STEP 9: ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on villages table
ALTER TABLE villages ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active villages
CREATE POLICY villages_select_policy ON villages
    FOR SELECT
    USING (is_active = true);

-- Policy: Only admins and authorized users can insert villages
CREATE POLICY villages_insert_policy ON villages
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid()
            AND role IN ('head_of_marketing', 'admin', 'country_manager', 'telemarketing_manager')
        )
    );

-- Policy: Only admins and authorized users can update villages
CREATE POLICY villages_update_policy ON villages
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid()
            AND role IN ('head_of_marketing', 'admin', 'country_manager', 'telemarketing_manager')
        )
    );

-- Policy: Only admins can delete villages
CREATE POLICY villages_delete_policy ON villages
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid()
            AND role IN ('head_of_marketing', 'admin')
        )
    );

-- =============================================
-- STEP 10: VERIFICATION QUERIES
-- =============================================

-- Check if table was created
SELECT 
    table_name,
    (SELECT COUNT(*) FROM villages) as record_count
FROM information_schema.tables 
WHERE table_name = 'villages';

-- Check indexes
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'villages';

-- Check if farmer columns were added
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'farmers' 
AND column_name IN ('zone_id', 'area_id', 'village_id');

-- Sample villages data
SELECT * FROM v_villages_with_hierarchy
LIMIT 10;

-- Check functions
SELECT routine_name
FROM information_schema.routines
WHERE routine_name LIKE '%village%'
OR routine_name LIKE '%farmer_zone%';

-- =============================================
-- SUCCESS MESSAGE
-- =============================================

DO $$ 
BEGIN 
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ VILLAGES TABLE - CREATED';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📋 What was created:';
    RAISE NOTICE '  ✓ villages table with full schema';
    RAISE NOTICE '  ✓ zone_id, area_id, village_id columns in farmers';
    RAISE NOTICE '  ✓ Indexes for performance';
    RAISE NOTICE '  ✓ Auto-populate zone trigger';
    RAISE NOTICE '  ✓ Helper views and functions';
    RAISE NOTICE '  ✓ RLS policies for security';
    RAISE NOTICE '  ✓ Sample villages (if applicable)';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Current status:';
    RAISE NOTICE '  Villages created: %', (SELECT COUNT(*) FROM villages);
    RAISE NOTICE '  Active villages: %', (SELECT COUNT(*) FROM villages WHERE is_active = true);
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Next steps:';
    RAISE NOTICE '  1. Add more villages via UI or bulk import';
    RAISE NOTICE '  2. Run data migration script (optional)';
    RAISE NOTICE '  3. Update farmer records with village_id';
    RAISE NOTICE '  4. Use new location hierarchy in forms';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
END $$;
