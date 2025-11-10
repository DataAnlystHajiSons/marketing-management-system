# Scoring and Stage Tracking System - Complete Guide

## Overview

The system has **TWO scoring mechanisms**: Legacy Farmer-Level and Modern Product-Engagement Level.

---

## 1. LEGACY SYSTEM: Farmer-Level Scoring

### Purpose
Track overall farmer relationship across ALL products (deprecated in favor of engagement-level tracking).

### Database Location
- **Table:** `farmers`
- **Columns:** `lead_score`, `lead_quality`, `lead_stage`
- **History:** `farmer_stage_history`

### Scoring Formula
```javascript
Score = 0 (start at zero)

// Activity Points (counts ALL activities for this farmer)
+ Meetings × 15 points
+ Visits × 10 points
+ Calls × 5 points

// Land Size Bonus
+ 20 points if land ≥ 50 acres
+ 15 points if land ≥ 20 acres
+ 10 points if land ≥ 10 acres
+ 5 points if land > 0 acres

// Recency Penalty
- 30 points if no activity > 90 days
- 20 points if no activity > 60 days
- 10 points if no activity > 30 days

// Final: Capped between 0-100
```

### Auto-Updates When
- ✅ Call logged → `calculate_lead_score(farmer_id)`
- ✅ Visit created → `calculate_lead_score(farmer_id)`
- ✅ Purchase made → `calculate_lead_score(farmer_id)`

### Stage History (`farmer_stage_history`)
Tracks every stage change at farmer level:
```sql
| Farmer  | Previous    | New Stage     | Duration | Triggered By |
|---------|-------------|---------------|----------|--------------|
| Ahmed   | new         | contacted     | 4 days   | call         |
| Ahmed   | contacted   | meeting_attended | 5 days | meeting   |
| Ahmed   | meeting_attended | converted | 10 days | purchase |
```

### Limitations
❌ Single score per farmer (can't differentiate Onion vs Chili)  
❌ Overwritten when farmer engages with new product  
❌ Not useful for multi-product tracking  

---

## 2. MODERN SYSTEM: Product-Engagement Scoring ⭐

### Purpose
Track farmer's journey **per product, per season** independently.

### Database Location
- **Table:** `farmer_product_engagements`
- **Columns:** `lead_score`, `lead_quality`, `lead_stage`
- **History:** `engagement_stage_history` (NEW!)

### Scoring Formula
```javascript
Score = 0 (start at zero)

// Activity Points (counts ONLY activities linked to THIS engagement)
+ Meetings × 15 points
+ Visits × 10 points
+ Calls × 5 points

// Land Size Bonus (same farmer attribute)
+ Up to 20 points (min of land_size or 20)

// Recency Penalty (per engagement contact)
- 30 points if no contact > 90 days
- 15 points if no contact > 60 days

// Final: Capped between 0-100
```

### Quality Auto-Updates
```javascript
Score ≥ 70 → 'hot'    🔥
Score ≥ 40 → 'warm'   ☀️
Score < 40 → 'cold'   ❄️
```

**Trigger:** Runs automatically on score change

### Auto-Updates When (After Migration)
✅ Activity logged with `engagement_id` → Score recalculates  
✅ Stage changes → History recorded  
✅ First call → Stage: `new` → `contacted`  
✅ Meeting logged → Stage: → `meeting_attended`  
✅ Visit logged → Stage: → `visit_completed`  

---

## 3. ENGAGEMENT STAGE HISTORY

### Table Structure
```sql
CREATE TABLE engagement_stage_history (
    id UUID PRIMARY KEY,
    engagement_id UUID,               -- Which engagement
    previous_stage lead_stage,        -- From
    new_stage lead_stage,             -- To
    stage_reason TEXT,                -- Why
    changed_by UUID,                  -- Who
    duration_in_previous_stage_days,  -- How long in previous
    triggered_by VARCHAR(100),        -- What caused it
    related_activity_id UUID,         -- Link to activity
    related_activity_type VARCHAR(50),
    lead_score_at_change INT,         -- Score when changed
    notes TEXT,
    created_at TIMESTAMP
);
```

### Example Data

**Ahmed Khan - Onion Engagement (Winter 2024):**
```
| Date       | Previous    | New Stage        | Duration | Score | Triggered By |
|------------|-------------|------------------|----------|-------|--------------|
| 2024-10-01 | NULL        | new              | -        | 0     | system       |
| 2024-10-05 | new         | contacted        | 4 days   | 5     | activity/call|
| 2024-10-10 | contacted   | meeting_attended | 5 days   | 20    | activity/mtg |
| 2024-10-20 | meeting_attended | visit_completed | 10 days | 35   | activity/visit|
| 2024-11-01 | visit_completed | interested    | 12 days  | 50    | manual       |
| 2024-11-15 | interested  | converted        | 14 days  | 75    | purchase     |
```

**Ahmed Khan - Chili Engagement (Spring 2025):**
```
| Date       | Previous    | New Stage     | Duration | Score | Triggered By |
|------------|-------------|---------------|----------|-------|--------------|
| 2024-11-01 | NULL        | new           | -        | 0     | system       |
| 2024-11-05 | new         | contacted     | 4 days   | 5     | activity/call|
(separate journey, separate scoring!)
```

---

## 4. AUTO-SCORING SYSTEM

### Trigger: `trigger_auto_update_engagement`

**When:** Activity is logged with `engagement_id`

**What Happens:**
1. ✅ Calculate new score using `calculate_engagement_score()`
2. ✅ Update `lead_score` in engagement
3. ✅ Update `total_interactions` count
4. ✅ Update `last_activity_date` and `last_contact_date`
5. ✅ Auto-progress stage if applicable:
   - `new` + first call/email → `contacted`
   - Any stage + meeting → `meeting_attended`
   - Any stage + visit → `visit_completed`

### Quality Trigger: `trigger_update_engagement_quality`

**When:** `lead_score` changes

**What Happens:**
```sql
IF score ≥ 70 THEN quality = 'hot'
ELSIF score ≥ 40 THEN quality = 'warm'
ELSE quality = 'cold'
```

---

## 5. KEY DIFFERENCES

### Farmer-Level (Legacy)
| Aspect | Details |
|--------|---------|
| Scope | Entire farmer relationship |
| Activities | All activities counted |
| Stages | One stage per farmer |
| History | `farmer_stage_history` |
| Problem | Can't track products separately |

### Engagement-Level (Current) ⭐
| Aspect | Details |
|--------|---------|
| Scope | Per product, per season |
| Activities | Only activities with `engagement_id` |
| Stages | Multiple stages (one per product) |
| History | `engagement_stage_history` |
| Benefit | Independent tracking per product |

---

## 6. SCORING EXAMPLES

### Scenario: Ahmed Khan

**Onion Engagement (Winter 2024):**
- 3 calls = 15 points
- 1 meeting = 15 points
- 1 visit = 10 points
- Land size 25 acres = 20 points
- Last contact 10 days ago = 0 penalty
- **Total: 60 points → WARM** ☀️

**Chili Engagement (Spring 2025):**
- 1 call = 5 points
- Land size 25 acres = 20 points
- Last contact 65 days ago = -15 penalty
- **Total: 10 points → COLD** ❄️

Same farmer, different scores per product! ✅

---

## 7. USAGE IN APPLICATION

### Log Activity and Auto-Update Score
```typescript
// Frontend: Log activity with engagement link
await activitiesAPI.create({
  farmer_id: farmerId,
  engagement_id: engagementId,  // 👈 Key: Link to engagement
  activity_type: 'call',
  activity_title: 'Discussed Onion seeds',
  performed_by: userId,
})

// Backend (Automatic):
// 1. Activity inserted ✅
// 2. Trigger fires → calculate_engagement_score() ✅
// 3. Score updates: 25 → 30 ✅
// 4. Quality updates: cold → warm ✅
// 5. Stage auto-progress: new → contacted ✅
// 6. Stage history recorded ✅
```

### View Stage History
```typescript
// Get complete stage timeline
const { data } = await farmerEngagementsAPI.getStageHistory(engagementId)

// Returns:
[
  { previous_stage: 'new', new_stage: 'contacted', duration: 4, score: 5 },
  { previous_stage: 'contacted', new_stage: 'meeting_attended', duration: 5, score: 20 },
  ...
]
```

### View Journey Analytics
```typescript
// Get engagement journey with metrics
const { data } = await farmerEngagementsAPI.getEngagementJourney({ 
  farmerId: 'ahmed_id' 
})

// Returns:
{
  engagement_id, farmer_name, product_name, season,
  current_stage, current_score, total_interactions,
  total_stage_changes, total_calls, total_visits,
  days_to_conversion, ...
}
```

---

## 8. IMPLEMENTATION CHECKLIST

### ✅ Already Done
- [x] `farmer_product_engagements` table created
- [x] `calculate_engagement_score()` function exists
- [x] Quality auto-update trigger exists
- [x] Activities API supports `engagement_id`
- [x] Activity modal links activities to engagements

### 🔲 Need to Run (MIGRATION REQUIRED)
- [ ] Run `ENGAGEMENT_STAGE_HISTORY_MIGRATION.sql` in Supabase
- [ ] Verify table created: `engagement_stage_history`
- [ ] Verify trigger created: `trigger_auto_update_engagement`
- [ ] Verify views created: `v_engagement_journey`, `v_engagement_stage_performance`

### 🔲 Future Enhancements (Optional)
- [ ] Add "Stage History" tab on farmer detail page
- [ ] Create dashboard showing stage performance
- [ ] Add conversion funnel visualization
- [ ] Show score trends over time

---

## 9. MIGRATION INSTRUCTIONS

### Step 1: Run SQL Script
```bash
1. Open Supabase SQL Editor
2. Create New Query
3. Copy/paste: ENGAGEMENT_STAGE_HISTORY_MIGRATION.sql
4. Click Run
5. Wait for success message
```

### Step 2: Verify Installation
Check these queries in SQL Editor:

```sql
-- Check table exists
SELECT COUNT(*) FROM engagement_stage_history;

-- Check trigger exists
SELECT tgname FROM pg_trigger 
WHERE tgrelid = 'farmer_activities'::regclass 
AND tgname = 'trigger_auto_update_engagement';

-- Check views exist
SELECT * FROM v_engagement_journey LIMIT 5;
SELECT * FROM v_engagement_stage_performance;
```

### Step 3: Test Scoring
```sql
-- Log an activity with engagement link (via frontend)
-- Then check if score updated:
SELECT id, lead_stage, lead_score, lead_quality, total_interactions
FROM farmer_product_engagements
WHERE id = 'your_engagement_id';

-- Check stage history was recorded:
SELECT * FROM engagement_stage_history 
WHERE engagement_id = 'your_engagement_id';
```

---

## 10. ANALYTICS QUERIES

### Average Time to Convert by Product
```sql
SELECT 
    product_name,
    AVG(days_to_conversion) as avg_days,
    COUNT(*) as conversions
FROM v_engagement_journey
WHERE is_converted = true
GROUP BY product_name;
```

### TMO Performance by Stage Progression
```sql
SELECT 
    assigned_tmo_name,
    COUNT(*) as total_engagements,
    AVG(total_stage_changes) as avg_stage_changes,
    COUNT(*) FILTER (WHERE is_converted) as conversions,
    AVG(days_to_conversion) as avg_conversion_time
FROM v_engagement_journey
GROUP BY assigned_tmo_name;
```

### Bottleneck Stages (Taking Longest)
```sql
SELECT 
    new_stage,
    AVG(duration_in_previous_stage_days) as avg_days,
    COUNT(*) as transitions
FROM v_engagement_stage_performance
ORDER BY avg_days DESC;
```

---

## 11. SUMMARY

### Why This System is Better

**Old Way (Farmer-Level):**
```
Ahmed Khan
├─ Score: 45 (gets overwritten when new product added)
├─ Stage: contacted (single stage for all products)
└─ History: farmer_stage_history (mixed product data)
```

**New Way (Engagement-Level):**
```
Ahmed Khan
├─ Onion (Winter 2024)
│   ├─ Score: 60 (warm) - Independent!
│   ├─ Stage: visit_completed
│   └─ History: 5 stage changes tracked
│
└─ Chili (Spring 2025)
    ├─ Score: 10 (cold) - Separate!
    ├─ Stage: contacted
    └─ History: 2 stage changes tracked
```

### Real-World Benefits

1. **Accurate Scoring:** Onion engagement success doesn't inflate Chili score
2. **True Tracking:** Each product journey has complete audit trail
3. **Better Analytics:** "Which product converts fastest?"
4. **TMO Performance:** "Who's best at converting Onion farmers?"
5. **Bottleneck ID:** "Cotton farmers stuck in 'qualified' stage for 30 days"

---

## 12. NEXT STEPS

### Immediate (Required)
1. ✅ Run `ENGAGEMENT_STAGE_HISTORY_MIGRATION.sql`
2. ✅ Test activity logging → Score updates automatically
3. ✅ Verify stage history is being recorded

### Short-term (Recommended)
4. Add "Stage Timeline" visualization on engagement detail page
5. Create engagement analytics dashboard
6. Add stage change buttons on engagement cards (manual progression)

### Long-term (Enhancement)
7. Conversion funnel reports per product
8. Predictive scoring (ML-based conversion probability)
9. Stage duration alerts (stuck in stage too long)

---

**Run the migration now to activate the full system!** 🚀
