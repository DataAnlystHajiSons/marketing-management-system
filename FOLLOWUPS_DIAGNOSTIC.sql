-- FOLLOW-UPS PAGE DIAGNOSTIC QUERIES
-- Run these in Supabase SQL Editor to diagnose the issue

-- 1. Check if table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'farmer_product_engagements';

-- 2. Check total engagements
SELECT COUNT(*) as total_engagements
FROM farmer_product_engagements;

-- 3. Check engagements with follow_up_required
SELECT COUNT(*) as follow_ups_required
FROM farmer_product_engagements
WHERE follow_up_required = true;

-- 4. Check active engagements with follow_up_required
SELECT COUNT(*) as active_follow_ups
FROM farmer_product_engagements
WHERE follow_up_required = true
AND is_active = true;

-- 5. Check if next_follow_up_date is populated
SELECT 
  COUNT(*) as total,
  COUNT(next_follow_up_date) as with_dates,
  COUNT(*) - COUNT(next_follow_up_date) as missing_dates
FROM farmer_product_engagements
WHERE follow_up_required = true
AND is_active = true;

-- 6. Sample of engagements that should appear
SELECT 
  fpe.id,
  f.full_name as farmer_name,
  p.product_name,
  fpe.season,
  fpe.lead_stage,
  fpe.next_follow_up_date,
  fpe.follow_up_required,
  fpe.is_active
FROM farmer_product_engagements fpe
JOIN farmers f ON f.id = fpe.farmer_id
LEFT JOIN products p ON p.id = fpe.product_id
WHERE fpe.follow_up_required = true
AND fpe.is_active = true
ORDER BY fpe.next_follow_up_date
LIMIT 10;

-- 7. Check overdue follow-ups
SELECT COUNT(*) as overdue_count
FROM farmer_product_engagements
WHERE follow_up_required = true
AND is_active = true
AND next_follow_up_date < CURRENT_DATE;

-- 8. Check today's follow-ups
SELECT COUNT(*) as today_count
FROM farmer_product_engagements
WHERE follow_up_required = true
AND is_active = true
AND next_follow_up_date = CURRENT_DATE;

-- 9. Check this week's follow-ups
SELECT COUNT(*) as this_week_count
FROM farmer_product_engagements
WHERE follow_up_required = true
AND is_active = true
AND next_follow_up_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days';
