-- =============================================
-- Dealer Sales/Transactions Table
-- Description: Track all sales transactions for dealers with product-wise and date-wise analysis
-- =============================================

-- Create dealer_sales table
CREATE TABLE IF NOT EXISTS dealer_sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dealer_id UUID REFERENCES dealers(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  
  -- Transaction Details
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('invoice', 'credit_memo')),
  transaction_date DATE NOT NULL,
  reference_number VARCHAR(100) UNIQUE NOT NULL,
  
  -- Product Information (denormalized for historical accuracy)
  product_name VARCHAR(200) NOT NULL,
  product_code VARCHAR(50),
  
  -- Quantities and Pricing
  quantity DECIMAL(10, 2) NOT NULL,
  unit_price DECIMAL(15, 2) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  
  -- Optional Business Fields
  discount_amount DECIMAL(15, 2) DEFAULT 0,
  tax_amount DECIMAL(15, 2) DEFAULT 0,
  net_amount DECIMAL(15, 2), -- amount - discount + tax
  payment_status VARCHAR(50) DEFAULT 'pending',
  payment_date DATE,
  due_date DATE,
  
  -- Additional Info
  notes TEXT,
  invoice_url TEXT,
  
  -- Audit Trail
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT positive_quantity CHECK (quantity > 0),
  CONSTRAINT positive_unit_price CHECK (unit_price >= 0)
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_dealer_sales_dealer_id ON dealer_sales(dealer_id);
CREATE INDEX IF NOT EXISTS idx_dealer_sales_product_id ON dealer_sales(product_id);
CREATE INDEX IF NOT EXISTS idx_dealer_sales_date ON dealer_sales(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_dealer_sales_type ON dealer_sales(transaction_type);
CREATE INDEX IF NOT EXISTS idx_dealer_sales_payment_status ON dealer_sales(payment_status);
CREATE INDEX IF NOT EXISTS idx_dealer_sales_reference ON dealer_sales(reference_number);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_dealer_sales_dealer_date ON dealer_sales(dealer_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_dealer_sales_dealer_product ON dealer_sales(dealer_id, product_id);
CREATE INDEX IF NOT EXISTS idx_dealer_sales_date_type ON dealer_sales(transaction_date, transaction_type);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_dealer_sales_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_dealer_sales_timestamp
  BEFORE UPDATE ON dealer_sales
  FOR EACH ROW
  EXECUTE FUNCTION update_dealer_sales_timestamp();

-- Calculate net_amount trigger
CREATE OR REPLACE FUNCTION calculate_dealer_sales_net_amount()
RETURNS TRIGGER AS $$
BEGIN
  NEW.net_amount = NEW.amount - COALESCE(NEW.discount_amount, 0) + COALESCE(NEW.tax_amount, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_dealer_sales_net_amount
  BEFORE INSERT OR UPDATE ON dealer_sales
  FOR EACH ROW
  EXECUTE FUNCTION calculate_dealer_sales_net_amount();

-- Comments for documentation
COMMENT ON TABLE dealer_sales IS 'Tracks all sales transactions (invoices and credit memos) for dealers';
COMMENT ON COLUMN dealer_sales.transaction_type IS 'Type of transaction: invoice (sale) or credit_memo (return/adjustment)';
COMMENT ON COLUMN dealer_sales.reference_number IS 'Unique invoice or credit memo number';
COMMENT ON COLUMN dealer_sales.product_name IS 'Denormalized product name for historical accuracy';
COMMENT ON COLUMN dealer_sales.quantity IS 'Quantity sold (positive for invoices, positive for credit memos too)';
COMMENT ON COLUMN dealer_sales.amount IS 'Total amount (quantity * unit_price)';
COMMENT ON COLUMN dealer_sales.net_amount IS 'Final amount after discount and tax (auto-calculated)';
COMMENT ON COLUMN dealer_sales.payment_status IS 'Payment status: pending, paid, overdue, cancelled';

-- Insert sample data for testing
INSERT INTO dealer_sales (
  dealer_id, 
  product_id,
  transaction_type, 
  transaction_date, 
  reference_number, 
  product_name, 
  product_code,
  quantity, 
  unit_price, 
  amount,
  discount_amount,
  tax_amount,
  payment_status,
  notes
) 
SELECT 
  d.id as dealer_id,
  p.id as product_id,
  'invoice' as transaction_type,
  CURRENT_DATE - (CAST(random() * 180 AS INTEGER)) as transaction_date,
  'INV-' || LPAD((ROW_NUMBER() OVER())::TEXT, 6, '0') as reference_number,
  p.product_name as product_name,
  p.product_code as product_code,
  CAST(10 + random() * 90 AS DECIMAL(10,2)) as quantity,
  CAST(100 + random() * 900 AS DECIMAL(15,2)) as unit_price,
  CAST((10 + random() * 90) * (100 + random() * 900) AS DECIMAL(15,2)) as amount,
  CAST(random() * 1000 AS DECIMAL(15,2)) as discount_amount,
  CAST(random() * 500 AS DECIMAL(15,2)) as tax_amount,
  CASE 
    WHEN random() < 0.7 THEN 'paid'
    WHEN random() < 0.9 THEN 'pending'
    ELSE 'overdue'
  END as payment_status,
  'Sample transaction for testing' as notes
FROM dealers d
CROSS JOIN products p
LIMIT 100
ON CONFLICT (reference_number) DO NOTHING;

-- Display summary
SELECT 
  'Dealer Sales Table Created Successfully!' as status,
  COUNT(*) as sample_records_inserted
FROM dealer_sales;
