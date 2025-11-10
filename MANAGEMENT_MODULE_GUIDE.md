# 📋 Management Module - Complete Guide

## Overview

The Management Module provides admin interfaces to manage the organizational structure and users:

- **Zones** - Geographical zones
- **Areas** - Sub-regions within zones
- **Field Staff** - Field personnel management
- **Users** - System users and permissions

---

## 🎯 Features

### 1. Zones Management
**Location:** `/management/zones`

**Features:**
- ✅ List all zones with search
- ✅ Create new zones with auto-generated codes
- ✅ Edit existing zones
- ✅ Delete zones (with confirmation)
- ✅ Active/Inactive status toggle

**Fields:**
- Zone Code (e.g., Z-001, NORTH-01)
- Name (e.g., North Zone, Punjab Region)
- Description (optional)
- Status (Active/Inactive)

---

### 2. Areas Management
**Location:** `/management/areas`

**Features:**
- ✅ List all areas with zone information
- ✅ Create areas linked to zones
- ✅ Edit areas
- ✅ Delete areas
- ✅ Filter areas by zone

**Fields:**
- Area Code (e.g., A-001, LHR-01)
- Name (e.g., Lahore City, Faisalabad District)
- Zone (dropdown - required)
- Description (optional)
- Status (Active/Inactive)

---

### 3. Field Staff Management
**Location:** `/management/field-staff`

**Features:**
- ✅ List all field staff with complete details
- ✅ Create field staff with auto-generated codes (FS-001, FS-002...)
- ✅ Edit field staff information
- ✅ Delete field staff
- ✅ Assign to zones and areas
- ✅ Link to TMOs
- ✅ Employment details tracking

**Fields:**
- Staff Code (auto-generated: FS-001, FS-002...)
- Full Name
- Email (optional)
- Phone (required)
- Alternate Phone (optional)
- Zone (dropdown)
- Area (filtered by selected zone)
- Assigned TMO (dropdown)
- Designation (e.g., Field Officer, Area Manager)
- Employment Type (Permanent/Contract/Temporary)
- Joining Date
- Status (Active/Inactive)

---

### 4. Users Management
**Location:** `/management/users`

**Features:**
- ✅ List all system users
- ✅ Create user profiles
- ✅ Edit user information
- ✅ Delete users
- ✅ Role-based access control
- ✅ Active/Inactive status

**Roles Available:**
- Head of Marketing
- Country Manager
- Telemarketing Officer (TMO)
- Telemarketing Manager
- Event Coordinator
- Admin
- Viewer

**Fields:**
- Full Name
- Email (required)
- Phone (optional)
- Role (dropdown - required)
- Status (Active/Inactive)

---

## 🚀 How to Use

### Setup Steps

#### 1. Make Sure Tables Exist

Run in Supabase SQL Editor:
```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('zones', 'areas', 'field_staff', 'user_profiles');
```

If tables don't exist, run the complete `Database_creation_script.sql`

#### 2. Disable RLS (if not already done)

```sql
ALTER TABLE zones DISABLE ROW LEVEL SECURITY;
ALTER TABLE areas DISABLE ROW LEVEL SECURITY;
ALTER TABLE field_staff DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
```

#### 3. Add Sample Data (Optional)

**Zones:**
```sql
INSERT INTO zones (zone_code, name, description, is_active)
VALUES 
  ('Z-001', 'North Zone', 'Northern regions', true),
  ('Z-002', 'South Zone', 'Southern regions', true),
  ('Z-003', 'Central Zone', 'Central regions', true);
```

**Areas:**
```sql
INSERT INTO areas (area_code, name, zone_id, is_active)
SELECT 'A-001', 'Lahore', id, true FROM zones WHERE zone_code = 'Z-001' LIMIT 1
UNION ALL
SELECT 'A-002', 'Faisalabad', id, true FROM zones WHERE zone_code = 'Z-001' LIMIT 1
UNION ALL
SELECT 'A-003', 'Multan', id, true FROM zones WHERE zone_code = 'Z-002' LIMIT 1;
```

**Field Staff:**
```sql
INSERT INTO field_staff (staff_code, full_name, phone, is_active)
VALUES 
  ('FS-001', 'Ali Ahmed', '0300-1111111', true),
  ('FS-002', 'Hassan Khan', '0300-2222222', true),
  ('FS-003', 'Bilal Shah', '0300-3333333', true);
```

**Users (TMOs):**
```sql
INSERT INTO user_profiles (email, full_name, role, is_active)
VALUES 
  ('tmo1@company.com', 'Sarah Khan', 'telemarketing_officer', true),
  ('tmo2@company.com', 'Ahmed Ali', 'telemarketing_officer', true),
  ('admin@company.com', 'Admin User', 'admin', true);
```

---

## 📊 Typical Workflow

### 1. Setup Organizational Structure

**Step 1:** Create Zones
```
1. Go to Management → Zones
2. Click "Add Zone"
3. Enter: Zone Code, Name, Description
4. Set Status to Active
5. Save
```

**Step 2:** Create Areas
```
1. Go to Management → Areas
2. Click "Add Area"
3. Select Zone from dropdown
4. Enter: Area Code, Name
5. Save
```

**Step 3:** Add Field Staff
```
1. Go to Management → Field Staff
2. Click "Add Field Staff"
3. Staff Code auto-generates (FS-001, FS-002...)
4. Fill personal details
5. Assign to Zone and Area
6. Optionally assign to TMO
7. Save
```

**Step 4:** Add Users
```
1. Go to Management → Users
2. Click "Add User"
3. Fill name, email, role
4. Save user profile
5. ⚠️ IMPORTANT: Also create auth user in Supabase Dashboard
```

### 2. Using in Farmers Module

When creating a farmer:
1. **Assigned TMO**: Select from Users (TMO role)
2. **Lead Source**: Select from Field Staff

The dropdowns will show all active TMOs and Field Staff you created!

---

## 🔍 Database Relationships

```
zones (1) ─── (many) areas
               │
               └─ (many) field_staff
                          │
                          └─ (many) farmers (as lead source)

user_profiles (TMOs)
  └─ (many) farmers (as assigned TMO)
  └─ (many) field_staff (as supervisor)
```

---

## ⚙️ Auto-Generated Codes

### Field Staff Codes
- Format: `FS-###`
- Examples: FS-001, FS-002, FS-010, FS-100
- Auto-increments based on last code

### Zone/Area Codes
- Manual entry (flexible format)
- Examples: Z-001, NORTH-01, LHR-CITY-01

---

## 🎨 UI Features

### Search & Filter
- Real-time search across all fields
- Instant results

### Status Badges
- **Active**: Green badge
- **Inactive**: Gray badge
- **Role Badges**: Color-coded by role

### Actions
- **Edit**: Opens edit form
- **Delete**: Confirms before deleting

### Validation
- Required fields marked with *
- Email validation
- Form validation before submit

---

## 🐛 Troubleshooting

### Empty Dropdowns

**Problem:** Zone/Area/TMO dropdowns are empty

**Solution:**
1. Check if data exists:
   ```sql
   SELECT * FROM zones;
   SELECT * FROM user_profiles WHERE role = 'telemarketing_officer';
   ```
2. If empty, add sample data (see Setup Steps)
3. Restart dev server

### Can't Delete Zone/Area

**Problem:** "Foreign key constraint violation"

**Solution:**
- Zones can't be deleted if areas exist under them
- Areas can't be deleted if field staff are assigned
- Delete dependent records first, or set them to NULL

### User Creation Issues

**Problem:** Created user profile but can't login

**Solution:**
- User profile and auth user are separate
- Create auth user in Supabase Dashboard:
  1. Go to Authentication → Users
  2. Add User with same email
  3. Set password
  4. User can now login

---

## 🔐 Permissions (Future)

Currently all authenticated users can access management pages.

**Future Implementation:**
- Only Admin and Head of Marketing can access
- Add role-based checks:
  ```typescript
  if (!['admin', 'head_of_marketing'].includes(user.role)) {
    redirect('/dashboard')
  }
  ```

---

## 📈 Statistics

View counts directly in management pages:
- Total Zones
- Total Areas
- Total Field Staff
- Total Users

---

## 🚀 Quick Access

| Module | URL | Purpose |
|--------|-----|---------|
| Zones | `/management/zones` | Manage zones |
| Areas | `/management/areas` | Manage areas |
| Field Staff | `/management/field-staff` | Manage field staff |
| Users | `/management/users` | Manage users |

All accessible from sidebar → Management section

---

## ✅ Testing Checklist

- [ ] RLS disabled on all tables
- [ ] Can create zones
- [ ] Can create areas (linked to zones)
- [ ] Field staff code auto-generates
- [ ] Can create field staff
- [ ] Can assign field staff to zone/area
- [ ] Can create user profiles
- [ ] TMO dropdown shows in farmer form
- [ ] Field staff dropdown shows in farmer form
- [ ] Can edit and delete records
- [ ] Search works on all pages

---

## 📝 Next Steps

1. **Test the management pages** - Create sample data
2. **Create TMO users** - For farmer assignment
3. **Add field staff** - For lead source tracking
4. **Setup zones and areas** - Organizational structure
5. **Use in farmers module** - Assign TMOs and track sources

---

**Status:** ✅ Fully Implemented  
**Build:** ✅ Passing  
**Ready to Use:** ✅ Yes  

**Start testing by visiting:** http://localhost:3000/management/zones 🚀
