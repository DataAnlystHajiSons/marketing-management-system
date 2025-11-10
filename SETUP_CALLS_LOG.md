# Setup Guide: Create calls_log Table in Supabase

## Quick Setup (5 minutes)

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase Dashboard
2. Click on **"SQL Editor"** in the left sidebar
3. Click **"New Query"**

### Step 2: Copy & Run the Migration Script
Copy the entire script from: `migrations/create_calls_log_table.sql`

Paste it into the SQL Editor and click **"Run"**

### Step 3: Verify Success
You should see: `"calls_log table created successfully!"`

### Step 4: Test the Integration
1. Refresh your marketing system app
2. Navigate to any dealer page
3. Click "Call" on a touchpoint
4. Fill in the form and submit
5. Should work perfectly! ✅

---

## What This Creates:

✅ **calls_log table** - Stores all call records  
✅ **ENUM types** - stakeholder_type, call_purpose, call_status  
✅ **Indexes** - For fast queries  
✅ **RLS Policies** - Security rules  
✅ **Trigger** - Auto-updates dealer last_contact_date  

---

## Troubleshooting:

### Error: "type already exists"
**Solution:** This is fine! It means the types were already created. The migration handles this.

### Error: "relation user_profiles does not exist"
**Solution:** Make sure your user_profiles table exists first

### Error: "permission denied"
**Solution:** Make sure you're logged in as the database owner/admin

---

## After Setup:

Your touchpoint system will now:
- ✅ Log every call with full details
- ✅ Track call duration and notes
- ✅ Store follow-up commitments
- ✅ Update dealer contact dates automatically
- ✅ Enable call history views

**Next:** I'll create a Call History component to view past calls on dealer pages!
