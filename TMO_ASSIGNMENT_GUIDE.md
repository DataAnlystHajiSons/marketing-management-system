# 🎯 TMO Assignment for Farmers - Complete Guide

## Overview

Farmers can now be assigned to TMOs (Telemarketing Officers) who manage and follow up with them. Field Staff are tracked as the **Lead Source** (who referred the farmer).

---

## 🔑 Key Concepts

### **TMO (Telemarketing Officer)**
- **Role**: Manages the farmer relationship
- **Responsibilities**: Makes calls, follows up, tracks interactions
- **Database Field**: `assigned_tmo_id` (references `user_profiles` table)

### **Field Staff (Lead Source)**
- **Role**: Source of the farmer lead (who referred them)
- **Purpose**: Track where the lead came from
- **Database Field**: `assigned_field_staff_id` (references `field_staff` table)

---

## 📋 Setup Steps

### Step 1: Add TMO Column to Database

**Run this SQL in Supabase SQL Editor:**

```sql
-- Add assigned_tmo_id column to farmers table
ALTER TABLE farmers ADD COLUMN IF NOT EXISTS assigned_tmo_id UUID REFERENCES user_profiles(id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_farmers_tmo ON farmers(assigned_tmo_id);

-- Disable RLS (if not already done)
ALTER TABLE farmers DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE field_staff DISABLE ROW LEVEL SECURITY;
```

**Verify it worked:**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'farmers' 
  AND column_name IN ('assigned_tmo_id', 'assigned_field_staff_id');
```

---

### Step 2: Create TMO Users in Supabase

**Option A: Using Supabase Dashboard**

1. Go to **Authentication → Users**
2. Click **Add User**
3. Fill details:
   - Email: `tmo1@example.com`
   - Password: (set password)
4. Click **Create User**
5. Go to **Table Editor → user_profiles**
6. Find the user and update:
   - `role` = `telemarketing_officer`
   - `full_name` = `John Doe`
   - `is_active` = `true`

**Option B: Using SQL**

```sql
-- Insert TMO users (update with real data)
INSERT INTO user_profiles (id, email, full_name, role, is_active)
VALUES 
  (uuid_generate_v4(), 'tmo1@company.com', 'Sarah Khan', 'telemarketing_officer', true),
  (uuid_generate_v4(), 'tmo2@company.com', 'Ahmed Ali', 'telemarketing_officer', true),
  (uuid_generate_v4(), 'tmo3@company.com', 'Fatima Hassan', 'telemarketing_officer', true);
```

---

### Step 3: Create Field Staff (Optional)

If you want to track lead sources:

```sql
INSERT INTO field_staff (staff_code, full_name, phone, is_active)
VALUES 
  ('FS-001', 'Ali Ahmed', '0300-1111111', true),
  ('FS-002', 'Hassan Khan', '0300-2222222', true),
  ('FS-003', 'Bilal Shah', '0300-3333333', true);
```

---

## 🚀 How to Use

### Creating a Farmer with TMO Assignment

1. **Go to:** http://localhost:3000/crm/farmers/new
2. **Fill farmer details:**
   - Full Name: Test Farmer
   - Phone: 0300-1234567
   - Village, City, etc.
3. **Assignment & Lead Source section:**
   - **Assign to TMO**: Select a TMO (Required)
   - **Lead Source**: Select field staff who referred (Optional)
4. **Click "Save Farmer"**

### What Happens:
- Farmer is assigned to selected TMO
- TMO can see this farmer in their list
- Field Staff tracked as lead source
- All interactions logged under TMO

---

## 📊 Database Relationships

```
farmers table:
├── assigned_tmo_id → user_profiles.id (TMO who manages farmer)
└── assigned_field_staff_id → field_staff.id (Who referred farmer)

user_profiles table:
├── role = 'telemarketing_officer'
└── Used for TMO assignments

field_staff table:
└── Used for tracking lead sources
```

---

## 🔍 View Assignments

### Check Farmer's TMO Assignment

**In Supabase Table Editor:**
1. Open `farmers` table
2. Look at columns:
   - `assigned_tmo_id` - UUID of assigned TMO
   - `assigned_field_staff_id` - UUID of lead source

### Get Farmer with TMO Details (SQL Query)

```sql
SELECT 
  f.id,
  f.farmer_code,
  f.full_name AS farmer_name,
  f.phone,
  tmo.full_name AS assigned_tmo_name,
  tmo.email AS tmo_email,
  fs.full_name AS lead_source_name,
  fs.staff_code AS lead_source_code
FROM farmers f
LEFT JOIN user_profiles tmo ON f.assigned_tmo_id = tmo.id
LEFT JOIN field_staff fs ON f.assigned_field_staff_id = fs.id
WHERE f.id = 'FARMER_ID_HERE';
```

---

## 🎯 Use Cases

### 1. Assign New Farmer to TMO
**When:** Adding a new farmer from meeting/event  
**Action:** Select TMO who will manage follow-ups  
**Result:** TMO receives farmer in their assigned list

### 2. Track Lead Source
**When:** Farmer referred by field staff  
**Action:** Select field staff as lead source  
**Result:** Track which field staff brings quality leads

### 3. Reassign Farmer to Different TMO
**When:** TMO leaves or workload balancing needed  
**Action:** Edit farmer and change assigned TMO  
**Result:** New TMO takes over farmer management

### 4. Bulk Assignment
**When:** Assigning 100 farmers to TMOs  
**Action:** Use SQL to bulk update  
**Example:**
```sql
-- Assign first 50 farmers to TMO-1
UPDATE farmers 
SET assigned_tmo_id = (SELECT id FROM user_profiles WHERE email = 'tmo1@company.com')
WHERE id IN (SELECT id FROM farmers LIMIT 50);
```

---

## 📈 Benefits

### For TMOs:
- ✅ Clear list of assigned farmers
- ✅ Organized follow-up tracking
- ✅ Personal responsibility and accountability
- ✅ Performance metrics per TMO

### For Managers:
- ✅ See TMO workload distribution
- ✅ Track TMO performance
- ✅ Identify best lead sources (field staff)
- ✅ Optimize team assignments

### For Field Staff:
- ✅ Track which farmers they referred
- ✅ Commission/incentive tracking
- ✅ Lead quality measurement

---

## 🔧 Advanced Features (Future)

### 1. TMO Dashboard
Show only farmers assigned to logged-in TMO:
```typescript
const { data } = await supabase
  .from('farmers')
  .select('*')
  .eq('assigned_tmo_id', currentUser.id)
```

### 2. Auto-Assignment Algorithm
Distribute farmers equally:
```typescript
// Get TMO with least farmers
// Assign new farmer to that TMO
```

### 3. Performance Tracking
```sql
-- TMO performance metrics
SELECT 
  tmo.full_name,
  COUNT(f.id) as total_farmers,
  SUM(CASE WHEN f.is_customer THEN 1 ELSE 0 END) as converted,
  AVG(f.lead_score) as avg_lead_score
FROM user_profiles tmo
LEFT JOIN farmers f ON f.assigned_tmo_id = tmo.id
WHERE tmo.role = 'telemarketing_officer'
GROUP BY tmo.id, tmo.full_name;
```

### 4. Lead Source Analysis
```sql
-- Which field staff brings best leads
SELECT 
  fs.full_name,
  fs.staff_code,
  COUNT(f.id) as total_referrals,
  SUM(CASE WHEN f.is_customer THEN 1 ELSE 0 END) as converted,
  AVG(f.lead_score) as avg_quality
FROM field_staff fs
LEFT JOIN farmers f ON f.assigned_field_staff_id = fs.id
GROUP BY fs.id, fs.full_name, fs.staff_code
ORDER BY converted DESC;
```

---

## ✅ Testing Checklist

- [ ] SQL column added (`assigned_tmo_id`)
- [ ] RLS disabled on required tables
- [ ] At least 1 TMO user created in `user_profiles`
- [ ] TMO dropdown loads in create farmer form
- [ ] Can create farmer with TMO assignment
- [ ] Farmer detail page shows assigned TMO
- [ ] Field staff shows as "Lead Source" (not "Assigned Field Staff")
- [ ] Farmer code auto-generates
- [ ] Build passes without errors

---

## 🐛 Troubleshooting

### Error: "relation 'user_profiles' does not exist"
**Solution:** Run database creation script first

### Error: "column 'assigned_tmo_id' does not exist"
**Solution:** Run the ALTER TABLE command from Step 1

### TMO Dropdown is Empty
**Solution:** 
1. Check if TMO users exist: `SELECT * FROM user_profiles WHERE role = 'telemarketing_officer'`
2. If empty, create TMO users using SQL from Step 2
3. Restart dev server

### Field Staff Dropdown is Empty
**Solution:**
1. Check if field staff exist: `SELECT * FROM field_staff WHERE is_active = true`
2. If empty, create field staff using SQL from Step 3

---

## 📚 Related Documentation

- `DATABASE_CONNECTED.md` - Database setup guide
- `RLS_ERROR_FIX.md` - RLS troubleshooting
- `FARMER_CODE_AND_ACTIVITIES_FIXED.md` - Auto codes and activities

---

**Status:** ✅ Ready to Use  
**Build:** ✅ Passing  
**Database Changes:** Required (Run SQL from Step 1)  

**Next Steps:**
1. Run SQL to add `assigned_tmo_id` column
2. Create TMO users
3. Test creating a farmer with TMO assignment
4. Verify it works!

