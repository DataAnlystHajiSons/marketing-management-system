# Supabase Connection Guide - Quick Setup

## ✅ All Database APIs Created!

I've created complete database API functions for all entities:

- ✅ `src/lib/supabase/farmers.ts` - Farmers CRUD
- ✅ `src/lib/supabase/dealers.ts` - Dealers CRUD
- ✅ `src/lib/supabase/calls.ts` - Call logging
- ✅ `src/lib/supabase/meetings.ts` - Meetings management
- ✅ `src/lib/supabase/visits.ts` - Visits tracking
- ✅ `src/lib/supabase/sales.ts` - Sales transactions
- ✅ `src/lib/supabase/field-staff.ts` - Field staff management

Plus:
- ✅ React hooks for data fetching (`use-farmers.ts`)
- ✅ Loading and error components
- ✅ All ready for integration

---

## 🚀 Quick Setup (5 Steps - 10 Minutes)

### Step 1: Create Supabase Project (3 min)

1. Go to https://supabase.com
2. Click "New Project"
3. Enter:
   - **Name**: Marketing System
   - **Database Password**: (Choose strong password - SAVE IT!)
   - **Region**: Select closest to you
4. Click "Create new project"
5. Wait 2-3 minutes for setup

### Step 2: Run Database Schema (2 min)

1. In Supabase, click **SQL Editor** (left sidebar)
2. Click "New Query"
3. Open file: `Database_creation_script.sql` from your project
4. Copy ALL content (it's a long script)
5. Paste into SQL Editor
6. Click **Run** (or press Ctrl+Enter)
7. Wait for "Success. No rows returned"

**Verify it worked:**
- Click **Table Editor** (left sidebar)
- You should see tables: farmers, dealers, calls_log, etc.

### Step 3: Get API Credentials (1 min)

1. In Supabase, click **Settings** (gear icon, bottom left)
2. Click **API** in settings menu
3. You'll see:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJxxx...` (long string)
4. Keep this page open

### Step 4: Update .env.local (1 min)

1. Open your project folder
2. Open file: `.env.local`
3. Replace with your values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxxxxxxxxxxxxxxxxxxxx
```

4. **Save the file**

### Step 5: Restart Dev Server (1 min)

1. Stop your dev server (Ctrl+C)
2. Start it again:

```bash
npm run dev
```

3. Visit http://localhost:3000

---

## 🔐 Create Admin User

### Option A: Using Supabase Dashboard (Easiest)

1. In Supabase, go to **Authentication** → **Users**
2. Click "Add User" button
3. Enter:
   - **Email**: `admin@marketing.com`
   - **Password**: `admin123` (or your choice)
   - Check ✅ "Auto Confirm User"
4. Click "Create User"

### Option B: Using SQL

In Supabase SQL Editor:

```sql
-- This creates a user profile (you still need to create auth user separately)
INSERT INTO user_profiles (
  id,
  employee_code,
  full_name,
  email,
  phone,
  role,
  is_active
) VALUES (
  gen_random_uuid(),
  'EMP-001',
  'Admin User',
  'admin@marketing.com',
  '0300-0000000',
  'admin',
  true
);
```

---

## ✅ Test Database Connection

### 1. Test Login

```bash
npm run dev
```

Visit http://localhost:3000/login

- Enter your admin email/password
- Should login successfully

### 2. Test Farmers Page

1. Go to `/crm/farmers`
2. Page should load (might be empty if no data)
3. Click "Add Farmer"
4. Fill form and submit
5. Check if farmer appears in list

### 3. Add Test Data (Optional)

In Supabase SQL Editor:

```sql
-- Add a test farmer
INSERT INTO farmers (
  farmer_code,
  full_name,
  phone,
  village,
  city,
  lead_stage,
  lead_score,
  lead_quality,
  is_customer
) VALUES (
  'F-001',
  'Test Farmer',
  '0300-1234567',
  'Test Village',
  'Faisalabad',
  'new',
  50,
  'warm',
  false
);

-- Add a test dealer
INSERT INTO dealers (
  dealer_code,
  business_name,
  owner_name,
  phone,
  city,
  relationship_status,
  relationship_score,
  is_active
) VALUES (
  'D-001',
  'Test Dealer Store',
  'Dealer Owner',
  '0300-7777777',
  'Lahore',
  'active',
  75,
  true
);
```

---

## 🔄 Switch from Mock to Real Data

### Current Status:
- ✅ All API functions created
- ✅ Hooks ready for use
- ⏳ Pages still using mock data

### To Use Real Data (Example: Farmers Page)

Update `src/app/(dashboard)/crm/farmers/page.tsx`:

**Change this:**
```typescript
const [farmers] = useState(mockFarmers)
```

**To this:**
```typescript
import { useFarmers } from '@/hooks/use-farmers'

export default function FarmersPage() {
  const { farmers, loading, error } = useFarmers()
  
  if (loading) return <LoadingPage />
  if (error) return <ErrorMessage message={error} />
  
  // rest of component...
}
```

I can update all pages to use real data if you want!

---

## 🛡️ Enable Row Level Security (Optional but Recommended)

In Supabase SQL Editor:

```sql
-- Enable RLS on all tables
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE dealers ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_staff ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can view farmers" 
ON farmers FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert farmers" 
ON farmers FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update farmers" 
ON farmers FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Repeat similar policies for other tables
```

---

## 🆘 Troubleshooting

### "Invalid JWT" or "Invalid API key"
- Double-check `.env.local` values
- Make sure you copied the full anon key
- Restart dev server after changing .env.local

### "relation does not exist"
- Database schema not created properly
- Run `Database_creation_script.sql` again
- Check for errors in SQL Editor

### "No rows returned" when viewing data
- Database is empty
- Add test data using SQL above
- Or add data through the application

### Page shows "Loading..." forever
- Open browser console (F12)
- Check for errors
- Verify Supabase URL is correct
- Check network tab for failed requests

---

## 📊 What Happens Next

Once connected:

1. **Login will use real authentication**
2. **All data will persist** in Supabase
3. **Forms will save to database**
4. **Changes are permanent**
5. **Data syncs across sessions**

---

## 🎯 Current Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| Database Schema | ✅ Ready | Run the SQL script |
| API Functions | ✅ Complete | All entities covered |
| Authentication | ✅ Working | Supabase Auth integrated |
| Hooks | ✅ Created | useFarmers example done |
| Loading States | ✅ Ready | Components created |
| Error Handling | ✅ Ready | Components created |
| Form Validation | ⏳ Next | To be added |
| Real-time Updates | ⏳ Future | Can be added later |

---

## 💡 Quick Tips

1. **Start Small**: Connect farmers page first, test thoroughly
2. **Check Console**: Browser F12 → Console shows errors
3. **Use Test Data**: Add sample data to see how it looks
4. **Backup**: Supabase auto-backups, but export important data
5. **RLS**: Enable gradually after testing everything works

---

## 🚀 Ready to Connect?

Your checklist:
- [ ] Supabase project created
- [ ] Database schema executed
- [ ] .env.local updated
- [ ] Dev server restarted
- [ ] Test user created
- [ ] Test login successful

**Once all checked, you're live with real database!** 🎉

Need help with any step? Just ask!
