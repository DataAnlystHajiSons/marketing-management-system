-- Fix dealer_sales table to allow multiple products per invoice
-- This removes the UNIQUE constraint on reference_number alone
-- and adds a composite unique constraint on (reference_number + product_name)
-- This allows multiple line items per invoice

-- Step 1: Drop the existing unique constraint on reference_number
ALTER TABLE dealer_sales 
DROP CONSTRAINT IF EXISTS dealer_sales_reference_number_key;

-- Step 2: Add a composite unique constraint
-- This ensures the same product can't be added twice to the same invoice
-- but allows different products with the same reference number
ALTER TABLE dealer_sales 
ADD CONSTRAINT dealer_sales_reference_product_unique 
UNIQUE (reference_number, product_name);

-- Step 3: Add an index for better query performance on reference_number
-- (since we removed the unique constraint which also served as an index)
CREATE INDEX IF NOT EXISTS idx_dealer_sales_reference_number 
ON dealer_sales(reference_number);

-- Verification query
-- This will show you invoices with multiple products
SELECT 
    reference_number,
    COUNT(*) as line_items,
    STRING_AGG(product_name, ', ') as products,
    SUM(net_amount) as total_invoice_amount
FROM dealer_sales
GROUP BY reference_number
HAVING COUNT(*) > 1
ORDER BY reference_number;

-- Example: View a specific invoice with multiple line items
-- SELECT * FROM dealer_sales WHERE reference_number = 'INV-001' ORDER BY product_name;
