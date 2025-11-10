-- =============================================
-- ENGAGEMENT STAGE HISTORY & AUTO-SCORING SYSTEM
-- =============================================
-- Purpose: Track stage changes for product engagements and auto-update scores
-- Run this AFTER: FARMER_ENGAGEMENT_MIGRATION.sql
-- Date: 2025-10-29
-- =============================================

-- =============================================
-- STEP 1: CREATE ENGAGEMENT STAGE HISTORY TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS engagement_stage_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    engagement_id UUID NOT NULL REFERENCES farmer_product_engagements(id) ON DELETE CASCADE,
    previous_stage lead_stage,
    new_stage lead_stage NOT NULL,
    stage_reason TEXT,
    changed_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    duration_in_previous_stage_days INT,
    triggered_by VARCHAR(100), -- 'manual', 'activity', 'meeting', 'visit', 'purchase', etc.
    related_activity_id UUID REFERENCES farmer_activities(id) ON DELETE SET NULL,
    related_activity_type VARCHAR(50),
    lead_score_at_change INT, -- Score when stage changed
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- STEP 2: CREATE INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_engagement_stage_history_engagement 
    ON engagement_stage_history(engagement_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_engagement_stage_history_stage 
    ON engagement_stage_history(new_stage);

CREATE INDEX IF NOT EXISTS idx_engagement_stage_history_changed_by 
    ON engagement_stage_history(changed_by);

CREATE INDEX IF NOT EXISTS idx_engagement_stage_history_date 
    ON engagement_stage_history(created_at DESC);

-- =============================================
-- STEP 3: CREATE FUNCTION TO UPDATE ENGAGEMENT STAGE
-- =============================================

CREATE OR REPLACE FUNCTION update_engagement_stage(
    p_engagement_id UUID,
    p_new_stage lead_stage,
    p_changed_by UUID,
    p_reason TEXT DEFAULT NULL,
    p_triggered_by VARCHAR(100) DEFAULT 'manual',
    p_related_activity_id UUID DEFAULT NULL,
    p_related_activity_type VARCHAR(50) DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_current_stage lead_stage;
    v_stage_changed_at TIMESTAMP WITH TIME ZONE;
    v_duration_days INT;
    v_current_score INT;
BEGIN
    -- Get current stage info
    SELECT lead_stage, stage_changed_at, lead_score
    INTO v_current_stage, v_stage_changed_at, v_current_score
    FROM farmer_product_engagements 
    WHERE id = p_engagement_id;
    
    -- Only update if stage is actually changing
    IF v_current_stage IS DISTINCT FROM p_new_stage THEN
        -- Calculate duration in previous stage
        v_duration_days := EXTRACT(DAY FROM (NOW() - v_stage_changed_at));
        
        -- Record stage history
        INSERT INTO engagement_stage_history (
            engagement_id, previous_stage, new_stage, stage_reason, changed_by,
            duration_in_previous_stage_days, triggered_by, related_activity_id, 
            related_activity_type, lead_score_at_change
        ) VALUES (
            p_engagement_id, v_current_stage, p_new_stage, p_reason, p_changed_by,
            v_duration_days, p_triggered_by, p_related_activity_id, 
            p_related_activity_type, v_current_score
        );
        
        -- Update engagement
        UPDATE farmer_product_engagements 
        SET 
            lead_stage = p_new_stage,
            stage_changed_at = NOW(),
            days_in_current_stage = 0,
            last_activity_date = NOW(),
            is_converted = CASE 
                WHEN p_new_stage = 'converted' THEN true 
                ELSE is_converted 
            END,
            conversion_date = CASE 
                WHEN p_new_stage = 'converted' AND conversion_date IS NULL THEN NOW() 
                ELSE conversion_date 
            END
        WHERE id = p_engagement_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- STEP 4: CREATE TRIGGER TO AUTO-UPDATE ENGAGEMENT SCORE & STATS
-- =============================================

CREATE OR REPLACE FUNCTION auto_update_engagement_on_activity()
RETURNS TRIGGER AS $$
DECLARE
    v_new_score INT;
BEGIN
    -- Only process if activity is linked to an engagement
    IF NEW.engagement_id IS NOT NULL THEN
        -- Calculate new score
        v_new_score := calculate_engagement_score(NEW.engagement_id);
        
        -- Update engagement with new score and stats
        UPDATE farmer_product_engagements
        SET 
            lead_score = v_new_score,
            last_activity_date = NOW(),
            last_contact_date = NOW(),
            total_interactions = total_interactions + 1
        WHERE id = NEW.engagement_id;
        
        -- Auto-progress stage based on activity type (optional logic)
        DECLARE
            v_current_stage lead_stage;
        BEGIN
            SELECT lead_stage INTO v_current_stage 
            FROM farmer_product_engagements 
            WHERE id = NEW.engagement_id;
            
            -- Auto-progress from 'new' to 'contacted' on first activity
            IF v_current_stage = 'new' AND NEW.activity_type IN ('call', 'email', 'whatsapp') THEN
                PERFORM update_engagement_stage(
                    NEW.engagement_id, 
                    'contacted', 
                    NEW.performed_by,
                    'First contact made via ' || NEW.activity_type,
                    'activity',
                    NEW.id,
                    NEW.activity_type
                );
            END IF;
            
            -- Auto-progress to 'meeting_attended' when meeting activity logged
            IF v_current_stage IN ('new', 'contacted', 'qualified') AND NEW.activity_type = 'meeting' THEN
                PERFORM update_engagement_stage(
                    NEW.engagement_id, 
                    'meeting_attended', 
                    NEW.performed_by,
                    'Meeting attended',
                    'activity',
                    NEW.id,
                    'meeting'
                );
            END IF;
            
            -- Auto-progress to 'visit_completed' when visit activity logged
            IF v_current_stage IN ('new', 'contacted', 'qualified', 'meeting_attended') 
               AND NEW.activity_type = 'visit' THEN
                PERFORM update_engagement_stage(
                    NEW.engagement_id, 
                    'visit_completed', 
                    NEW.performed_by,
                    'Field visit completed',
                    'activity',
                    NEW.id,
                    'visit'
                );
            END IF;
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_auto_update_engagement ON farmer_activities;
CREATE TRIGGER trigger_auto_update_engagement
    AFTER INSERT ON farmer_activities
    FOR EACH ROW
    EXECUTE FUNCTION auto_update_engagement_on_activity();

-- =============================================
-- STEP 5: CREATE VIEW FOR ENGAGEMENT JOURNEY
-- =============================================

CREATE OR REPLACE VIEW v_engagement_journey AS
SELECT 
    e.id as engagement_id,
    e.farmer_id,
    f.farmer_code,
    f.full_name as farmer_name,
    f.phone,
    p.product_name,
    e.season,
    e.data_source,
    e.lead_stage as current_stage,
    e.lead_score as current_score,
    e.lead_quality as current_quality,
    e.total_interactions,
    e.is_converted,
    e.conversion_date,
    e.created_at as engagement_start_date,
    e.days_in_current_stage,
    
    -- Stage change metrics
    (SELECT COUNT(*) FROM engagement_stage_history WHERE engagement_id = e.id) as total_stage_changes,
    (SELECT MIN(created_at) FROM engagement_stage_history WHERE engagement_id = e.id) as first_stage_change,
    (SELECT MAX(created_at) FROM engagement_stage_history WHERE engagement_id = e.id) as last_stage_change,
    
    -- Activity counts (per engagement)
    (SELECT COUNT(*) FROM farmer_activities WHERE engagement_id = e.id AND activity_type = 'call') as total_calls,
    (SELECT COUNT(*) FROM farmer_activities WHERE engagement_id = e.id AND activity_type = 'visit') as total_visits,
    (SELECT COUNT(*) FROM farmer_activities WHERE engagement_id = e.id AND activity_type = 'meeting') as total_meetings,
    
    -- Time to conversion
    CASE WHEN e.is_converted 
        THEN EXTRACT(DAY FROM (e.conversion_date - e.created_at))
        ELSE NULL 
    END as days_to_conversion,
    
    -- Assignment
    tmo.full_name as assigned_tmo_name,
    fs.full_name as assigned_field_staff_name
    
FROM farmer_product_engagements e
LEFT JOIN farmers f ON e.farmer_id = f.id
LEFT JOIN products p ON e.product_id = p.id
LEFT JOIN user_profiles tmo ON e.assigned_tmo_id = tmo.id
LEFT JOIN field_staff fs ON e.assigned_field_staff_id = fs.id
WHERE e.is_active = true;

-- =============================================
-- STEP 6: CREATE VIEW FOR STAGE PERFORMANCE ANALYSIS
-- =============================================

CREATE OR REPLACE VIEW v_engagement_stage_performance AS
SELECT 
    new_stage,
    COUNT(*) as total_entries,
    AVG(duration_in_previous_stage_days) as avg_duration_days,
    MIN(duration_in_previous_stage_days) as min_duration_days,
    MAX(duration_in_previous_stage_days) as max_duration_days,
    AVG(lead_score_at_change) as avg_score_at_change,
    COUNT(DISTINCT engagement_id) as unique_engagements,
    COUNT(DISTINCT changed_by) as unique_users
FROM engagement_stage_history
GROUP BY new_stage
ORDER BY 
    CASE new_stage
        WHEN 'new' THEN 1 WHEN 'contacted' THEN 2 WHEN 'qualified' THEN 3
        WHEN 'meeting_invited' THEN 4 WHEN 'meeting_attended' THEN 5
        WHEN 'visit_scheduled' THEN 6 WHEN 'visit_completed' THEN 7
        WHEN 'interested' THEN 8 WHEN 'negotiation' THEN 9
        WHEN 'converted' THEN 10 WHEN 'active_customer' THEN 11
        WHEN 'inactive' THEN 12 WHEN 'lost' THEN 13 ELSE 14
    END;

-- =============================================
-- STEP 7: HELPER FUNCTION - GET ENGAGEMENT STAGE TIMELINE
-- =============================================

CREATE OR REPLACE FUNCTION get_engagement_stage_timeline(p_engagement_id UUID)
RETURNS TABLE (
    stage_date TIMESTAMP WITH TIME ZONE,
    previous_stage VARCHAR(50),
    new_stage VARCHAR(50),
    duration_days INT,
    reason TEXT,
    changed_by_name TEXT,
    score_at_change INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        esh.created_at,
        esh.previous_stage::VARCHAR(50),
        esh.new_stage::VARCHAR(50),
        esh.duration_in_previous_stage_days,
        esh.stage_reason,
        up.full_name,
        esh.lead_score_at_change
    FROM engagement_stage_history esh
    LEFT JOIN user_profiles up ON esh.changed_by = up.id
    WHERE esh.engagement_id = p_engagement_id
    ORDER BY esh.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- STEP 8: UPDATE EXISTING ENGAGEMENTS TO HAVE INITIAL STAGE HISTORY
-- =============================================

-- Create initial stage history for existing engagements (one-time migration)
INSERT INTO engagement_stage_history (
    engagement_id,
    previous_stage,
    new_stage,
    stage_reason,
    changed_by,
    duration_in_previous_stage_days,
    triggered_by,
    lead_score_at_change,
    created_at
)
SELECT 
    id,
    NULL,
    lead_stage,
    'Initial stage on engagement creation',
    created_by,
    0,
    'system',
    lead_score,
    created_at
FROM farmer_product_engagements
WHERE id NOT IN (SELECT DISTINCT engagement_id FROM engagement_stage_history)
AND is_active = true;

-- =============================================
-- STEP 9: CREATE TRIGGER FOR NEW ENGAGEMENTS
-- =============================================

-- Auto-create initial stage history when new engagement is created
CREATE OR REPLACE FUNCTION auto_create_initial_engagement_stage()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO engagement_stage_history (
        engagement_id,
        previous_stage,
        new_stage,
        stage_reason,
        changed_by,
        duration_in_previous_stage_days,
        triggered_by,
        lead_score_at_change
    ) VALUES (
        NEW.id,
        NULL,
        NEW.lead_stage,
        'Initial stage on engagement creation',
        NEW.created_by,
        0,
        'system',
        NEW.lead_score
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_initial_engagement_stage ON farmer_product_engagements;
CREATE TRIGGER trigger_initial_engagement_stage
    AFTER INSERT ON farmer_product_engagements
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_initial_engagement_stage();

-- =============================================
-- STEP 10: VERIFICATION QUERIES
-- =============================================

-- Check if table was created
SELECT 
    table_name, 
    (SELECT COUNT(*) FROM engagement_stage_history) as record_count
FROM information_schema.tables 
WHERE table_name = 'engagement_stage_history';

-- Check indexes
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'engagement_stage_history';

-- Check triggers on farmer_activities
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgrelid = 'farmer_activities'::regclass
AND tgname LIKE '%engagement%';

-- Check triggers on farmer_product_engagements
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgrelid = 'farmer_product_engagements'::regclass;

-- Sample data check
SELECT 
    e.id,
    f.full_name,
    p.product_name,
    e.lead_stage,
    (SELECT COUNT(*) FROM engagement_stage_history WHERE engagement_id = e.id) as stage_changes
FROM farmer_product_engagements e
LEFT JOIN farmers f ON e.farmer_id = f.id
LEFT JOIN products p ON e.product_id = p.id
WHERE e.is_active = true
LIMIT 5;

-- =============================================
-- SUCCESS MESSAGE
-- =============================================

DO $$ 
BEGIN 
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ ENGAGEMENT STAGE HISTORY - INSTALLED';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📋 What was created:';
    RAISE NOTICE '  ✓ engagement_stage_history table';
    RAISE NOTICE '  ✓ update_engagement_stage() function';
    RAISE NOTICE '  ✓ auto_update_engagement_on_activity() trigger';
    RAISE NOTICE '  ✓ auto_create_initial_engagement_stage() trigger';
    RAISE NOTICE '  ✓ v_engagement_journey view';
    RAISE NOTICE '  ✓ v_engagement_stage_performance view';
    RAISE NOTICE '  ✓ get_engagement_stage_timeline() function';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Features enabled:';
    RAISE NOTICE '  ✓ Automatic stage history tracking';
    RAISE NOTICE '  ✓ Auto-update engagement score on activity';
    RAISE NOTICE '  ✓ Auto-progress stages (new→contacted, etc.)';
    RAISE NOTICE '  ✓ Stage duration tracking';
    RAISE NOTICE '  ✓ Performance analytics per stage';
    RAISE NOTICE '';
    RAISE NOTICE '📖 Usage:';
    RAISE NOTICE '  -- Update stage manually:';
    RAISE NOTICE '  SELECT update_engagement_stage(';
    RAISE NOTICE '    engagement_id, ''interested'', user_id, ''Farmer showed interest'', ''manual''';
    RAISE NOTICE '  );';
    RAISE NOTICE '';
    RAISE NOTICE '  -- Get stage timeline:';
    RAISE NOTICE '  SELECT * FROM get_engagement_stage_timeline(engagement_id);';
    RAISE NOTICE '';
    RAISE NOTICE '  -- View journey analytics:';
    RAISE NOTICE '  SELECT * FROM v_engagement_journey;';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '🎉 Ready to Track Engagement Journeys!';
    RAISE NOTICE '========================================';
END $$;
