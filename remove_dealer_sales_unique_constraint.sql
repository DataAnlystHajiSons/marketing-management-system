-- Remove the unique constraint on (reference_number, product_name)
-- This allows the same product to appear multiple times in a single invoice
-- Example: INV-001 can have "Wheat Seed" on line 1 and line 2 with different quantities/prices

-- Step 1: Drop the composite unique constraint
ALTER TABLE dealer_sales 
DROP CONSTRAINT IF EXISTS dealer_sales_reference_product_unique;

-- Step 2: Verify the constraint is removed
SELECT 
    conname as constraint_name,
    contype as constraint_type
FROM pg_constraint
WHERE conrelid = 'dealer_sales'::regclass
    AND conname LIKE '%reference%';

-- Note: Now multiple rows can have the same reference_number + product_name
-- This is valid for scenarios like:
-- - Same product with different batch numbers
-- - Same product at different prices (discounts)
-- - Same product with different delivery dates
-- - Multiple line items for the same product in one invoice

-- Example valid data after this change:
-- reference_number | product_name  | quantity | unit_price
-- INV-001         | Wheat Seed    | 100      | 500
-- INV-001         | Wheat Seed    | 50       | 480  (bulk discount)
-- INV-001         | Fertilizer    | 30       | 800
-- INV-001         | Wheat Seed    | 25       | 500  (additional order)

-- If you want to prevent EXACT duplicates (same ref, product, qty, price), 
-- you can add a different constraint:
-- ALTER TABLE dealer_sales 
-- ADD CONSTRAINT dealer_sales_prevent_exact_duplicates 
-- UNIQUE (reference_number, product_name, quantity, unit_price, transaction_date);

-- But usually this is not needed as different lines may have same values
