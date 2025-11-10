-- =====================================================
-- SIMPLE VERSION: Create calls_log Table
-- Run this in Supabase SQL Editor
-- =====================================================

-- Create ENUM types
CREATE TYPE IF NOT EXISTS stakeholder_type AS ENUM ('farmer', 'dealer', 'field_staff');
CREATE TYPE IF NOT EXISTS call_purpose AS ENUM (
    'meeting_invitation', 'meeting_followup', 'visit_schedule', 'visit_followup',
    'order_inquiry', 'order_confirmation', 'payment_reminder', 'payment_followup',
    'complaint_handling', 'feedback_collection', 'product_information', 'general_inquiry',
    'relationship_building', 'monthly_stock_report', 'weekly_review', 'sales_target_review',
    'product_promotion', 'training_invitation', 'other'
);
CREATE TYPE IF NOT EXISTS call_status AS ENUM (
    'completed', 'no_answer', 'busy', 'callback_requested', 'wrong_number', 'scheduled', 'cancelled'
);

-- Create calls_log table
CREATE TABLE IF NOT EXISTS calls_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caller_id UUID NOT NULL REFERENCES user_profiles(id),
    stakeholder_type stakeholder_type NOT NULL,
    stakeholder_id UUID NOT NULL,
    call_date TIMESTAMPTZ DEFAULT NOW(),
    call_duration_seconds INTEGER,
    call_purpose call_purpose NOT NULL,
    call_status call_status NOT NULL,
    notes TEXT,
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    related_meeting_id UUID,
    related_visit_id UUID,
    related_complaint_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_calls_caller ON calls_log(caller_id);
CREATE INDEX IF NOT EXISTS idx_calls_stakeholder ON calls_log(stakeholder_type, stakeholder_id);
CREATE INDEX IF NOT EXISTS idx_calls_date ON calls_log(call_date DESC);

-- Enable RLS
ALTER TABLE calls_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read for authenticated users" ON calls_log
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON calls_log
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for call owner" ON calls_log
    FOR UPDATE USING (auth.uid() = caller_id);

-- Success message
SELECT 'calls_log table created successfully!' as status;
