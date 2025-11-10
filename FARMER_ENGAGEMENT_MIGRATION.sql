-- =============================================
-- FARMER PRODUCT ENGAGEMENT MODEL - MIGRATION SCRIPT
-- =============================================
-- Purpose: Implement product-level tracking for farmers
-- Author: Marketing System Team
-- Date: 2025-10-29
-- =============================================

-- =============================================
-- STEP 1: CREATE NEW ENUM FOR DATA SOURCE
-- =============================================

DO $$ BEGIN
    CREATE TYPE data_source_type AS ENUM (
        'data_bank',
        'fm_invitees',
        'fm_attendees',
        'fd_invitees',
        'fd_attendees',
        'repzo',
        'manual_entry',
        'api_integration',
        'other'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- =============================================
-- STEP 2: CREATE FARMER PRODUCT ENGAGEMENTS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS farmer_product_engagements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Core References
    farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    season VARCHAR(50) NOT NULL, -- 'Winter 2024', 'Spring 2025', 'Kharif 2024', 'Rabi 2025'
    
    -- Data Source Tracking
    data_source data_source_type NOT NULL DEFAULT 'manual_entry',
    entry_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    source_reference VARCHAR(200), -- Meeting ID, List ID, External Reference
    
    -- Lead Journey (Product-Specific)
    lead_stage lead_stage DEFAULT 'new',
    lead_score INT DEFAULT 0 CHECK (lead_score BETWEEN 0 AND 100),
    lead_quality VARCHAR(20) DEFAULT 'cold',
    stage_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    days_in_current_stage INT DEFAULT 0,
    
    -- Conversion Tracking
    is_converted BOOLEAN DEFAULT false,
    conversion_date TIMESTAMP WITH TIME ZONE,
    total_purchases DECIMAL(15, 2) DEFAULT 0,
    
    -- Activity Tracking
    last_contact_date TIMESTAMP WITH TIME ZONE,
    last_activity_date TIMESTAMP WITH TIME ZONE,
    next_follow_up_date DATE,
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_notes TEXT,
    total_interactions INT DEFAULT 0,
    
    -- Assignment
    assigned_tmo_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    assigned_field_staff_id UUID REFERENCES field_staff(id) ON DELETE SET NULL,
    
    -- Related Records
    source_meeting_id UUID REFERENCES meetings(id) ON DELETE SET NULL,
    source_event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    source_list_id UUID REFERENCES farmer_lists(id) ON DELETE SET NULL,
    
    -- Status & Notes
    is_active BOOLEAN DEFAULT true,
    closure_reason VARCHAR(100), -- 'converted', 'not_interested', 'unreachable', 'duplicate'
    closure_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    tags TEXT[],
    
    -- Audit
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one engagement per farmer-product-season combination
    UNIQUE(farmer_id, product_id, season)
);

-- =============================================
-- STEP 3: CREATE INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_engagements_farmer ON farmer_product_engagements(farmer_id);
CREATE INDEX IF NOT EXISTS idx_engagements_product ON farmer_product_engagements(product_id);
CREATE INDEX IF NOT EXISTS idx_engagements_season ON farmer_product_engagements(season);
CREATE INDEX IF NOT EXISTS idx_engagements_data_source ON farmer_product_engagements(data_source);
CREATE INDEX IF NOT EXISTS idx_engagements_lead_stage ON farmer_product_engagements(lead_stage);
CREATE INDEX IF NOT EXISTS idx_engagements_lead_quality ON farmer_product_engagements(lead_quality);
CREATE INDEX IF NOT EXISTS idx_engagements_tmo ON farmer_product_engagements(assigned_tmo_id);
CREATE INDEX IF NOT EXISTS idx_engagements_active ON farmer_product_engagements(is_active, is_converted);
CREATE INDEX IF NOT EXISTS idx_engagements_follow_up ON farmer_product_engagements(next_follow_up_date, follow_up_required) 
    WHERE follow_up_required = true AND is_active = true;
CREATE INDEX IF NOT EXISTS idx_engagements_created_at ON farmer_product_engagements(created_at DESC);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_engagements_farmer_season ON farmer_product_engagements(farmer_id, season);
CREATE INDEX IF NOT EXISTS idx_engagements_product_season ON farmer_product_engagements(product_id, season);
CREATE INDEX IF NOT EXISTS idx_engagements_tmo_stage ON farmer_product_engagements(assigned_tmo_id, lead_stage) 
    WHERE is_active = true;

-- =============================================
-- STEP 4: CREATE TRIGGER FOR AUTO-UPDATE TIMESTAMP
-- =============================================

DROP TRIGGER IF EXISTS update_farmer_engagements_updated_at ON farmer_product_engagements;
CREATE TRIGGER update_farmer_engagements_updated_at 
    BEFORE UPDATE ON farmer_product_engagements
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- STEP 5: UPDATE FARMER_ACTIVITIES TABLE
-- =============================================
-- Add engagement reference to link activities to specific product engagement

ALTER TABLE farmer_activities 
ADD COLUMN IF NOT EXISTS engagement_id UUID REFERENCES farmer_product_engagements(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_farmer_activities_engagement ON farmer_activities(engagement_id);

-- =============================================
-- STEP 6: UPDATE FARMER_LISTS TABLE
-- =============================================
-- Add product and season context to lists

ALTER TABLE farmer_lists
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS season VARCHAR(50),
ADD COLUMN IF NOT EXISTS data_source_type data_source_type;

CREATE INDEX IF NOT EXISTS idx_farmer_lists_product ON farmer_lists(product_id);
CREATE INDEX IF NOT EXISTS idx_farmer_lists_season ON farmer_lists(season);

-- =============================================
-- STEP 7: CREATE HELPER FUNCTIONS
-- =============================================

-- Function: Get Active Engagements for a Farmer
CREATE OR REPLACE FUNCTION get_farmer_active_engagements(p_farmer_id UUID)
RETURNS TABLE (
    engagement_id UUID,
    product_name VARCHAR,
    season VARCHAR,
    lead_stage VARCHAR,
    lead_score INT,
    is_converted BOOLEAN,
    last_contact_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        p.product_name,
        e.season,
        e.lead_stage::VARCHAR,
        e.lead_score,
        e.is_converted,
        e.last_contact_date
    FROM farmer_product_engagements e
    LEFT JOIN products p ON e.product_id = p.id
    WHERE e.farmer_id = p_farmer_id
      AND e.is_active = true
    ORDER BY e.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate Engagement Score
CREATE OR REPLACE FUNCTION calculate_engagement_score(p_engagement_id UUID)
RETURNS INT AS $$
DECLARE
    v_score INT := 0;
    v_meeting_count INT;
    v_visit_count INT;
    v_call_count INT;
    v_days_since_last_contact INT;
    v_land_size DECIMAL;
BEGIN
    -- Get activity counts for this engagement
    SELECT 
        COUNT(*) FILTER (WHERE activity_type = 'meeting'),
        COUNT(*) FILTER (WHERE activity_type = 'visit'),
        COUNT(*) FILTER (WHERE activity_type = 'call')
    INTO v_meeting_count, v_visit_count, v_call_count
    FROM farmer_activities
    WHERE engagement_id = p_engagement_id;
    
    -- Get farmer land size and days since last contact
    SELECT 
        f.land_size_acres,
        EXTRACT(DAY FROM (NOW() - e.last_contact_date))
    INTO v_land_size, v_days_since_last_contact
    FROM farmer_product_engagements e
    JOIN farmers f ON e.farmer_id = f.id
    WHERE e.id = p_engagement_id;
    
    -- Calculate score
    v_score := v_score + (v_meeting_count * 15); -- +15 per meeting
    v_score := v_score + (v_visit_count * 10);   -- +10 per visit
    v_score := v_score + (v_call_count * 5);     -- +5 per call
    
    -- Land size bonus (up to +20)
    IF v_land_size IS NOT NULL THEN
        v_score := v_score + LEAST(v_land_size::INT, 20);
    END IF;
    
    -- Recency penalty
    IF v_days_since_last_contact > 90 THEN
        v_score := v_score - 30;
    ELSIF v_days_since_last_contact > 60 THEN
        v_score := v_score - 15;
    END IF;
    
    -- Ensure score is between 0-100
    v_score := GREATEST(0, LEAST(100, v_score));
    
    RETURN v_score;
END;
$$ LANGUAGE plpgsql;

-- Function: Update Lead Quality Based on Score
CREATE OR REPLACE FUNCTION update_engagement_quality()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.lead_score >= 70 THEN
        NEW.lead_quality := 'hot';
    ELSIF NEW.lead_score >= 40 THEN
        NEW.lead_quality := 'warm';
    ELSE
        NEW.lead_quality := 'cold';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_engagement_quality ON farmer_product_engagements;
CREATE TRIGGER trigger_update_engagement_quality
    BEFORE INSERT OR UPDATE OF lead_score ON farmer_product_engagements
    FOR EACH ROW
    EXECUTE FUNCTION update_engagement_quality();

-- =============================================
-- STEP 8: CREATE VIEWS FOR REPORTING
-- =============================================

-- View: Engagement Summary by Product
CREATE OR REPLACE VIEW v_engagement_summary_by_product AS
SELECT 
    p.product_name,
    e.season,
    e.data_source,
    COUNT(*) as total_engagements,
    COUNT(*) FILTER (WHERE e.is_converted = true) as conversions,
    ROUND(COUNT(*) FILTER (WHERE e.is_converted = true)::NUMERIC / NULLIF(COUNT(*), 0) * 100, 2) as conversion_rate,
    AVG(e.lead_score) as avg_lead_score,
    COUNT(*) FILTER (WHERE e.lead_quality = 'hot') as hot_leads,
    COUNT(*) FILTER (WHERE e.lead_quality = 'warm') as warm_leads,
    COUNT(*) FILTER (WHERE e.lead_quality = 'cold') as cold_leads
FROM farmer_product_engagements e
LEFT JOIN products p ON e.product_id = p.id
WHERE e.is_active = true
GROUP BY p.product_name, e.season, e.data_source;

-- View: Engagement Summary by TMO
CREATE OR REPLACE VIEW v_engagement_summary_by_tmo AS
SELECT 
    u.full_name as tmo_name,
    u.email as tmo_email,
    COUNT(*) as total_engagements,
    COUNT(*) FILTER (WHERE e.is_converted = true) as conversions,
    ROUND(COUNT(*) FILTER (WHERE e.is_converted = true)::NUMERIC / NULLIF(COUNT(*), 0) * 100, 2) as conversion_rate,
    COUNT(*) FILTER (WHERE e.follow_up_required = true) as pending_followups,
    COUNT(*) FILTER (WHERE e.lead_stage = 'new') as new_leads,
    COUNT(*) FILTER (WHERE e.lead_stage IN ('interested', 'negotiation')) as hot_pipeline
FROM farmer_product_engagements e
LEFT JOIN user_profiles u ON e.assigned_tmo_id = u.id
WHERE e.is_active = true
GROUP BY u.full_name, u.email;

-- =============================================
-- STEP 9: MIGRATE EXISTING FARMER DATA
-- =============================================
-- This creates engagements from existing farmer records

INSERT INTO farmer_product_engagements (
    farmer_id,
    product_id,
    season,
    data_source,
    entry_date,
    lead_stage,
    lead_score,
    lead_quality,
    is_converted,
    conversion_date,
    total_purchases,
    last_contact_date,
    last_activity_date,
    assigned_tmo_id,
    assigned_field_staff_id,
    notes,
    created_at,
    updated_at
)
SELECT 
    f.id,
    NULL, -- No specific product (legacy data)
    'Legacy Import', -- Season
    'data_bank', -- Assume from data bank
    f.registration_date,
    f.lead_stage,
    f.lead_score,
    f.lead_quality,
    f.is_customer,
    f.conversion_date,
    f.total_purchases,
    f.last_activity_date,
    f.last_activity_date,
    f.assigned_tmo_id,
    f.assigned_field_staff_id,
    'Migrated from legacy farmers table',
    f.created_at,
    f.updated_at
FROM farmers f
WHERE NOT EXISTS (
    SELECT 1 FROM farmer_product_engagements e 
    WHERE e.farmer_id = f.id AND e.season = 'Legacy Import'
);

-- =============================================
-- STEP 10: UPDATE EXISTING ACTIVITIES
-- =============================================
-- Link existing activities to the legacy engagement

UPDATE farmer_activities fa
SET engagement_id = (
    SELECT e.id 
    FROM farmer_product_engagements e 
    WHERE e.farmer_id = fa.farmer_id 
      AND e.season = 'Legacy Import'
    LIMIT 1
)
WHERE engagement_id IS NULL;

-- =============================================
-- STEP 11: ADD COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON TABLE farmer_product_engagements IS 'Tracks farmer engagement at product-season level, enabling multi-product tracking without data conflicts';
COMMENT ON COLUMN farmer_product_engagements.data_source IS 'Origin of this engagement record: fm_invitees, fm_attendees, data_bank, etc.';
COMMENT ON COLUMN farmer_product_engagements.season IS 'Crop season identifier: Winter 2024, Kharif 2024, Rabi 2025, etc.';
COMMENT ON COLUMN farmer_product_engagements.lead_stage IS 'Current stage of farmer journey for THIS specific product';
COMMENT ON COLUMN farmer_product_engagements.source_reference IS 'Reference to source: meeting ID, list ID, or external system reference';

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Check migration success
SELECT 
    'Farmers Table' as table_name,
    COUNT(*) as record_count
FROM farmers
UNION ALL
SELECT 
    'Farmer Product Engagements',
    COUNT(*)
FROM farmer_product_engagements
UNION ALL
SELECT 
    'Migrated Legacy Engagements',
    COUNT(*)
FROM farmer_product_engagements
WHERE season = 'Legacy Import';

-- Show sample engagements
SELECT 
    f.farmer_code,
    f.full_name,
    p.product_name,
    e.season,
    e.data_source,
    e.lead_stage,
    e.lead_score
FROM farmer_product_engagements e
JOIN farmers f ON e.farmer_id = f.id
LEFT JOIN products p ON e.product_id = p.id
LIMIT 10;

-- =============================================
-- ROLLBACK SCRIPT (Use if needed)
-- =============================================
/*
-- WARNING: This will delete all engagement data!
-- Only use if migration needs to be rolled back

DROP VIEW IF EXISTS v_engagement_summary_by_tmo;
DROP VIEW IF EXISTS v_engagement_summary_by_product;
DROP FUNCTION IF EXISTS update_engagement_quality();
DROP FUNCTION IF EXISTS calculate_engagement_score(UUID);
DROP FUNCTION IF EXISTS get_farmer_active_engagements(UUID);

ALTER TABLE farmer_activities DROP COLUMN IF EXISTS engagement_id;
ALTER TABLE farmer_lists DROP COLUMN IF EXISTS product_id;
ALTER TABLE farmer_lists DROP COLUMN IF EXISTS season;
ALTER TABLE farmer_lists DROP COLUMN IF EXISTS data_source_type;

DROP TABLE IF EXISTS farmer_product_engagements;
DROP TYPE IF EXISTS data_source_type;
*/

-- =============================================
-- END OF MIGRATION SCRIPT
-- =============================================
