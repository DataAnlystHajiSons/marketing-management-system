-- Fix dealer_sales table to allow negative quantities for credit memos
-- This removes the positive quantity constraint and adds a more flexible one

-- Step 1: Drop the existing check constraint on quantity
ALTER TABLE dealer_sales 
DROP CONSTRAINT IF EXISTS positive_quantity;

-- Step 2: Drop any other quantity constraints (just in case)
ALTER TABLE dealer_sales 
DROP CONSTRAINT IF EXISTS dealer_sales_quantity_check;

-- Step 3: Add a new flexible constraint
-- Allow negative quantities for credit_memo, positive for invoice
-- This constraint allows any non-zero quantity
ALTER TABLE dealer_sales 
ADD CONSTRAINT dealer_sales_quantity_nonzero_check 
CHECK (quantity != 0);

-- Optional: Add a more sophisticated constraint that validates based on transaction type
-- Uncomment if you want stricter validation at database level
-- ALTER TABLE dealer_sales 
-- ADD CONSTRAINT dealer_sales_quantity_type_check 
-- CHECK (
--   (transaction_type = 'invoice' AND quantity > 0) OR
--   (transaction_type = 'credit_memo' AND quantity < 0)
-- );

-- Verification: Check existing data
SELECT 
    transaction_type,
    COUNT(*) as count,
    MIN(quantity) as min_qty,
    MAX(quantity) as max_qty,
    AVG(quantity) as avg_qty
FROM dealer_sales
GROUP BY transaction_type;

-- Example queries to verify
-- SELECT * FROM dealer_sales WHERE transaction_type = 'credit_memo' ORDER BY created_at DESC LIMIT 5;
-- SELECT * FROM dealer_sales WHERE quantity < 0 LIMIT 10;
