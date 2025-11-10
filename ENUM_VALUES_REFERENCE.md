# Database ENUM Values Reference

## User Roles (`user_role` enum)

Based on `Database_creation_script.sql`, the correct enum values are:

```sql
CREATE TYPE user_role AS ENUM (
    'head_of_marketing',
    'country_manager',
    'telemarketing_officer',    -- 👈 Use this, NOT 'tmo'
    'telemarketing_manager',
    'event_coordinator',
    'field_staff',
    'admin',
    'user'
);
```

### Common Mistakes:
❌ `role = 'tmo'` → Will cause ERROR: invalid input value  
✅ `role = 'telemarketing_officer'` → Correct

❌ `role = 'tmo_manager'` → Wrong  
✅ `role = 'telemarketing_manager'` → Correct

---

## Lead Stages (`lead_stage` enum)

```sql
CREATE TYPE lead_stage AS ENUM (
    'new',
    'contacted',
    'qualified',
    'meeting_invited',
    'meeting_attended',
    'visit_scheduled',
    'visit_completed',
    'interested',
    'negotiation',
    'converted',
    'active_customer',
    'inactive',
    'lost',
    'rejected'
);
```

---

## Lead Sources (`lead_source` enum)

```sql
CREATE TYPE lead_source AS ENUM (
    'walk_in',
    'referral',
    'event',
    'campaign',
    'field_staff',
    'dealer',
    'website',
    'social_media',
    'cold_call',
    'other'
);
```

---

## Data Source Types (`data_source_type` enum)

Used in `farmer_product_engagements` table:

```sql
CREATE TYPE data_source_type AS ENUM (
    'direct_contact',          -- Direct farmer contact
    'fm_invitee',             -- Farmer meeting invitee
    'fm_attendee',            -- Farmer meeting attendee
    'demo_invitee',           -- Demo plot invitee
    'demo_attendee',          -- Demo plot attendee
    'event_invitee',          -- Event invitee
    'event_attendee',         -- Event attendee
    'referral',               -- Referred by another farmer
    'other'                   -- Other sources
);
```

---

## Quick SQL Queries

### Find all active TMOs:
```sql
SELECT id, full_name, email 
FROM user_profiles 
WHERE role = 'telemarketing_officer' 
AND is_active = true;
```

### Count users by role:
```sql
SELECT 
    role,
    COUNT(*) as count,
    COUNT(*) FILTER (WHERE is_active = true) as active_count
FROM user_profiles
GROUP BY role
ORDER BY count DESC;
```

### Check if enum value exists:
```sql
SELECT enumlabel 
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'user_role'
ORDER BY enumsortorder;
```

---

## Important Notes:

1. **Enum values are case-sensitive**: `'telemarketing_officer'` ≠ `'Telemarketing_Officer'`

2. **Use underscores, not spaces**: `'telemarketing_officer'` not `'telemarketing officer'`

3. **Cannot use abbreviations**: Full enum value must match exactly

4. **Adding new enum values** (if needed in future):
   ```sql
   ALTER TYPE user_role ADD VALUE 'new_role_name';
   ```

5. **Check existing values**:
   ```sql
   SELECT unnest(enum_range(NULL::user_role));
   SELECT unnest(enum_range(NULL::lead_stage));
   SELECT unnest(enum_range(NULL::lead_source));
   SELECT unnest(enum_range(NULL::data_source_type));
   ```
