-- =====================================================
-- Migration: Create calls_log Table and Related Types
-- Purpose: Enable call logging for dealer touchpoints
-- Date: 2025-11-06
-- =====================================================

-- Step 1: Create ENUM types (skip if already exist)
-- =====================================================

DO $$ BEGIN
    CREATE TYPE stakeholder_type AS ENUM ('farmer', 'dealer', 'field_staff');
EXCEPTION 
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE call_purpose AS ENUM (
        'meeting_invitation',
        'meeting_followup',
        'visit_schedule',
        'visit_followup',
        'order_inquiry',
        'order_confirmation',
        'payment_reminder',
        'payment_followup',
        'complaint_handling',
        'feedback_collection',
        'product_information',
        'general_inquiry',
        'relationship_building',
        'monthly_stock_report',
        'weekly_review',
        'sales_target_review',
        'payment_followup',
        'product_promotion',
        'training_invitation',
        'other'
    );
EXCEPTION 
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE call_status AS ENUM (
        'completed',
        'no_answer',
        'busy',
        'callback_requested',
        'wrong_number',
        'scheduled',
        'cancelled'
    );
EXCEPTION 
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Create calls_log table
-- =====================================================

CREATE TABLE IF NOT EXISTS calls_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    caller_id UUID NOT NULL REFERENCES user_profiles(id),
    stakeholder_type stakeholder_type NOT NULL,
    stakeholder_id UUID NOT NULL,
    call_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    call_duration_seconds INTEGER,
    call_purpose call_purpose NOT NULL,
    call_status call_status NOT NULL,
    notes TEXT,
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    related_meeting_id UUID,
    related_visit_id UUID,
    related_complaint_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create indexes for performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_calls_caller 
    ON calls_log(caller_id);

CREATE INDEX IF NOT EXISTS idx_calls_stakeholder 
    ON calls_log(stakeholder_type, stakeholder_id);

CREATE INDEX IF NOT EXISTS idx_calls_date 
    ON calls_log(call_date DESC);

CREATE INDEX IF NOT EXISTS idx_calls_purpose 
    ON calls_log(call_purpose);

CREATE INDEX IF NOT EXISTS idx_calls_status 
    ON calls_log(call_status);

-- Step 4: Enable Row Level Security (RLS)
-- =====================================================

ALTER TABLE calls_log ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own calls and calls for their assigned dealers/farmers
CREATE POLICY "Users can view their own calls"
    ON calls_log FOR SELECT
    USING (
        auth.uid() = caller_id
        OR auth.uid() IN (
            -- Allow viewing calls for dealers assigned to the user
            SELECT field_staff_id FROM dealers WHERE id = stakeholder_id AND stakeholder_type = 'dealer'
        )
    );

-- Policy: Users can insert their own calls
CREATE POLICY "Users can insert their own calls"
    ON calls_log FOR INSERT
    WITH CHECK (auth.uid() = caller_id);

-- Policy: Users can update their own calls
CREATE POLICY "Users can update their own calls"
    ON calls_log FOR UPDATE
    USING (auth.uid() = caller_id)
    WITH CHECK (auth.uid() = caller_id);

-- Policy: Users can delete their own calls (within 24 hours)
CREATE POLICY "Users can delete their own recent calls"
    ON calls_log FOR DELETE
    USING (
        auth.uid() = caller_id 
        AND created_at > NOW() - INTERVAL '24 hours'
    );

-- Step 5: Create trigger to auto-log dealer activities
-- =====================================================

CREATE OR REPLACE FUNCTION auto_log_dealer_call_activity()
RETURNS TRIGGER AS $$
BEGIN
    -- Only process if this is a dealer call
    IF NEW.stakeholder_type = 'dealer' THEN
        -- Update dealer's last_contact_date
        UPDATE dealers 
        SET last_contact_date = NEW.call_date
        WHERE id = NEW.stakeholder_id;
        
        -- Log to dealer_activities table if it exists
        BEGIN
            INSERT INTO dealer_activities (
                dealer_id,
                activity_type,
                activity_date,
                description,
                performed_by,
                notes
            ) VALUES (
                NEW.stakeholder_id,
                'call',
                NEW.call_date,
                'Phone call - ' || NEW.call_purpose::TEXT,
                NEW.caller_id,
                NEW.notes
            );
        EXCEPTION 
            WHEN undefined_table THEN 
                -- dealer_activities table doesn't exist, skip
                NULL;
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_auto_log_dealer_call ON calls_log;
CREATE TRIGGER trigger_auto_log_dealer_call
    AFTER INSERT ON calls_log
    FOR EACH ROW
    EXECUTE FUNCTION auto_log_dealer_call_activity();

-- Step 6: Grant permissions
-- =====================================================

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON calls_log TO authenticated;

-- =====================================================
-- Migration Complete!
-- =====================================================

-- Verify the table was created
SELECT 
    'calls_log table created successfully!' as status,
    COUNT(*) as row_count
FROM calls_log;
