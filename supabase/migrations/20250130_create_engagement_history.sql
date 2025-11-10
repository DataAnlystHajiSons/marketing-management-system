-- Create engagement_history table for tracking all changes to engagements
CREATE TABLE IF NOT EXISTS engagement_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES farmer_product_engagements(id) ON DELETE CASCADE,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  field_changed VARCHAR(100) NOT NULL, -- e.g., 'data_source', 'lead_stage', 'assigned_tmo_id'
  old_value TEXT, -- Store as text for flexibility
  new_value TEXT,
  changed_by UUID REFERENCES auth.users(id), -- Who made the change
  change_reason TEXT, -- Optional: Why the change was made
  metadata JSONB, -- Additional context (e.g., import_batch_id, source_file)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX idx_engagement_history_engagement ON engagement_history(engagement_id);
CREATE INDEX idx_engagement_history_changed_at ON engagement_history(changed_at DESC);
CREATE INDEX idx_engagement_history_field ON engagement_history(field_changed);
CREATE INDEX idx_engagement_history_changed_by ON engagement_history(changed_by);

-- Enable RLS
ALTER TABLE engagement_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view engagement history"
  ON engagement_history
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert engagement history"
  ON engagement_history
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to automatically log engagement changes
CREATE OR REPLACE FUNCTION log_engagement_change()
RETURNS TRIGGER AS $$
DECLARE
  changed_fields TEXT[];
  field_name TEXT;
  old_val TEXT;
  new_val TEXT;
BEGIN
  -- Only for UPDATE operations
  IF TG_OP = 'UPDATE' THEN
    changed_fields := ARRAY[]::TEXT[];
    
    -- Check each important field for changes
    IF OLD.data_source IS DISTINCT FROM NEW.data_source THEN
      INSERT INTO engagement_history (
        engagement_id, field_changed, old_value, new_value, changed_by, change_reason
      ) VALUES (
        NEW.id, 'data_source', OLD.data_source::TEXT, NEW.data_source::TEXT, 
        auth.uid(), 'Engagement data source updated'
      );
    END IF;
    
    IF OLD.lead_stage IS DISTINCT FROM NEW.lead_stage THEN
      INSERT INTO engagement_history (
        engagement_id, field_changed, old_value, new_value, changed_by, change_reason
      ) VALUES (
        NEW.id, 'lead_stage', OLD.lead_stage::TEXT, NEW.lead_stage::TEXT,
        auth.uid(), 'Lead stage changed'
      );
    END IF;
    
    IF OLD.assigned_tmo_id IS DISTINCT FROM NEW.assigned_tmo_id THEN
      INSERT INTO engagement_history (
        engagement_id, field_changed, old_value, new_value, changed_by, change_reason
      ) VALUES (
        NEW.id, 'assigned_tmo_id', OLD.assigned_tmo_id::TEXT, NEW.assigned_tmo_id::TEXT,
        auth.uid(), 'TMO assignment changed'
      );
    END IF;
    
    IF OLD.assigned_field_staff_id IS DISTINCT FROM NEW.assigned_field_staff_id THEN
      INSERT INTO engagement_history (
        engagement_id, field_changed, old_value, new_value, changed_by, change_reason
      ) VALUES (
        NEW.id, 'assigned_field_staff_id', OLD.assigned_field_staff_id::TEXT, NEW.assigned_field_staff_id::TEXT,
        auth.uid(), 'Field staff assignment changed'
      );
    END IF;
    
    IF OLD.is_converted IS DISTINCT FROM NEW.is_converted THEN
      INSERT INTO engagement_history (
        engagement_id, field_changed, old_value, new_value, changed_by, change_reason
      ) VALUES (
        NEW.id, 'is_converted', OLD.is_converted::TEXT, NEW.is_converted::TEXT,
        auth.uid(), 'Conversion status changed'
      );
    END IF;
    
  -- For INSERT operations, log initial creation
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO engagement_history (
      engagement_id, field_changed, old_value, new_value, changed_by, change_reason
    ) VALUES (
      NEW.id, 'created', NULL, 'Engagement created',
      auth.uid(), 
      CASE 
        WHEN NEW.data_source = 'fm_invitees' THEN 'Added as Event Invitee'
        WHEN NEW.data_source = 'fm_attendees' THEN 'Added as Event Attendee'
        WHEN NEW.data_source = 'fd_invitees' THEN 'Added as Field Day Invitee'
        WHEN NEW.data_source = 'fd_attendees' THEN 'Added as Field Day Attendee'
        ELSE 'Engagement created'
      END
    );
    
    -- Log initial data_source
    INSERT INTO engagement_history (
      engagement_id, field_changed, old_value, new_value, changed_by, change_reason
    ) VALUES (
      NEW.id, 'data_source', NULL, NEW.data_source::TEXT,
      auth.uid(), 'Initial data source'
    );
    
    -- Log initial lead_stage
    INSERT INTO engagement_history (
      engagement_id, field_changed, old_value, new_value, changed_by, change_reason
    ) VALUES (
      NEW.id, 'lead_stage', NULL, NEW.lead_stage::TEXT,
      auth.uid(), 'Initial lead stage'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically log changes
DROP TRIGGER IF EXISTS engagement_change_logger ON farmer_product_engagements;
CREATE TRIGGER engagement_change_logger
  AFTER INSERT OR UPDATE ON farmer_product_engagements
  FOR EACH ROW
  EXECUTE FUNCTION log_engagement_change();

-- Comment on table
COMMENT ON TABLE engagement_history IS 'Tracks complete history of all changes to farmer product engagements';
COMMENT ON COLUMN engagement_history.field_changed IS 'Name of the field that changed (data_source, lead_stage, etc.)';
COMMENT ON COLUMN engagement_history.metadata IS 'Additional context like import_batch_id, campaign_id, etc.';
