# Dealers Bulk Import System - Complete Guide

## Overview

The Dealers Bulk Import system allows you to import dealers from CSV/Excel files with intelligent name-based mapping for hierarchical locations and relationships.

---

## 🎯 Key Features

### 1. **Name-Based Mapping**
- Import using human-readable names instead of UUIDs
- Automatically maps names to database IDs
- Example: "Punjab" → zone UUID, "Faisalabad" → area UUID

### 2. **Smart Contextual Filtering**
- Areas filtered by selected zone
- Villages filtered by selected area
- Reduces mapping confusion

### 3. **Interactive Mapping**
- Unmapped values highlighted
- Dropdown to select correct match
- Shows context (e.g., "Dijkot (Faisalabad)")

### 4. **Bulk Assignment**
- Assign same field staff to multiple dealers
- Set default relationship status
- Apply common settings to all

### 5. **Validation & Preview**
- See all data before import
- Validation warnings for missing required fields
- Review mapped names

### 6. **Batch Import**
- Imports in batches of 50
- Real-time progress tracking
- Detailed error reporting

---

## 📊 Import Workflow

```
Step 1: Context
└─ Define import purpose
└─ Set data source
└─ Choose duplicate strategy

Step 2: Upload
└─ Upload CSV/Excel file
└─ Parse and extract data
└─ Show preview of rows

Step 3: Mapping
└─ Auto-map names to IDs
└─ Highlight unmapped values
└─ Manual mapping interface
└─ Contextual filtering

Step 4: Bulk Assignment
└─ Set field staff for all
└─ Set relationship status
└─ Apply defaults

Step 5: Preview
└─ Validate all rows
└─ Show warnings
└─ Final review

Step 6: Import
└─ Batch processing (50 rows)
└─ Real-time progress
└─ Success/Error tracking

Step 7: Complete
└─ Summary statistics
└─ Error report
└─ Navigation options
```

---

## 📋 CSV/Excel Format

### Required Columns:
```csv
dealer_code,business_name,owner_name,phone
D-001,Green Valley Traders,Malik Aslam,0300-1111222
D-002,Agri Solutions,Tariq Mahmood,0301-3334444
```

### Optional Columns (with name-based mapping):
```csv
dealer_code,business_name,owner_name,phone,zone_name,area_name,village_name,relationship_status,relationship_score
D-001,Green Valley Traders,Malik Aslam,0300-1111222,Punjab,Faisalabad,Dijkot,active,85
D-002,Agri Solutions,Tariq Mahmood,0301-3334444,Punjab,Multan,Muzaffargarh,preferred,92
```

### All Available Columns:

| Column Name | Type | Example | Notes |
|-------------|------|---------|-------|
| **Basic Info** |
| dealer_code | Text | D-001 | Unique identifier |
| business_name | Text | Green Valley Traders | Required |
| owner_name | Text | Malik Aslam | Required |
| phone | Text | 0300-1111222 | Required |
| alternate_phone | Text | 0321-7654321 | Optional |
| email | Text | dealer@example.com | Optional |
| **Location (Names)** |
| zone_name | Text | Punjab | Auto-mapped to zone_id |
| area_name | Text | Faisalabad | Auto-mapped to area_id |
| village_name | Text | Dijkot | Auto-mapped to village_id |
| address | Text | Near Main Market | Optional |
| **Relationship** |
| relationship_status | Text | active | active/preferred/platinum/at_risk/inactive |
| relationship_score | Number | 85 | 0-100 |
| performance_rating | Text | excellent | excellent/good/average/below_average/poor |
| is_active | Boolean | true | true/false |
| **Financial** |
| credit_limit | Number | 1000000 | PKR amount |
| current_balance | Number | 50000 | PKR amount |
| **Assignment (Names)** |
| assigned_field_staff_name | Text | Ahmad Ali | Auto-mapped to field_staff_id |

---

## 🎨 Name Mapping Examples

### Example 1: Simple Zone/Area/Village
```csv
CSV Input:
zone_name: "Punjab"
area_name: "Faisalabad"
village_name: "Dijkot"

System Processing:
1. Finds zone: Punjab → UUID-123
2. Finds area: Faisalabad (in Punjab) → UUID-456
3. Finds village: Dijkot (in Faisalabad) → UUID-789

Database Record:
zone_id: UUID-123
area_id: UUID-456
village_id: UUID-789
```

### Example 2: Unmapped Village
```csv
CSV Input:
zone_name: "Punjab"
area_name: "Faisalabad"
village_name: "New Village 123"  ← Not in database

Mapping Screen:
❌ Unmapped: "New Village 123" (Rows: 5, 12, 18)
   Suggestions (filtered by Faisalabad):
   [ ] Dijkot
   [ ] Samundri
   [ ] Chak 204 RB
   [ ] Create New Village

User Action:
Select "Dijkot" → All 3 rows map to Dijkot
```

### Example 3: Ambiguous Area Name
```csv
CSV Input:
area_name: "City"  ← Multiple areas with "City" name

Mapping Screen:
❌ Unmapped: "City" (Rows: 10, 15)
   Available options:
   [ ] City (Punjab)
   [ ] City (Sindh)
   [ ] City Center (Karachi)

User Action:
Select "City (Punjab)" → Maps correctly
```

---

## 🔧 Component Architecture

### File Structure:
```
src/
├─ app/(dashboard)/crm/import/dealers/
│  └─ page.tsx                          ← Main import page
├─ components/import/
│  ├─ dealers-import-context.tsx        ← Step 1: Context
│  ├─ dealers-import-upload.tsx         ← Step 2: Upload
│  ├─ dealers-import-mapping.tsx        ← Step 3: Mapping (KEY!)
│  ├─ dealers-import-bulk-assignment.tsx ← Step 4: Assignment
│  └─ dealers-import-preview.tsx        ← Step 5: Preview
```

### Key Component: Mapping

The mapping component is the most important. It:

1. **Loads Reference Data**
   ```typescript
   - Zones (all active)
   - Areas (all active)
   - Villages (all active)
   - Field Staff (all active)
   ```

2. **Auto-Maps by Name**
   ```typescript
   For each row:
     If zone_name exists:
       Find zone where name matches (case-insensitive)
       Set zone_id
     
     If area_name exists:
       Find area where:
         - name matches (case-insensitive)
         - AND zone_id matches (if zone set)
       Set area_id
     
     If village_name exists:
       Find village where:
         - name matches
         - AND area_id matches (if area set)
       Set village_id
   ```

3. **Collects Unmapped**
   ```typescript
   For each unique unmapped value:
     - Field name
     - Original value
     - Row numbers (for user reference)
     - Filtered options (contextual)
   ```

4. **Provides UI for Mapping**
   ```typescript
   Unmapped Value Card:
     - Shows: "Dijkot" found in rows 5, 12, 18
     - Dropdown: Villages in [selected area]
     - Apply button: Maps all 3 rows
   ```

---

## 💡 Smart Features

### 1. Cascading Context
```
When mapping "village_name":
  If row has area_id → Only show villages in that area
  Else if row has zone_id → Only show villages in that zone
  Else → Show all villages
```

### 2. Display Names with Context
```
Instead of:
  [ ] Dijkot
  [ ] Dijkot
  [ ] Dijkot  ← Confusing!

Show:
  [ ] Dijkot (Faisalabad)
  [ ] Dijkot (Multan)
  [ ] Dijkot (Sahiwal)  ← Clear!
```

### 3. Bulk Operations
```
Map once, apply to all rows:
  Select "Dijkot (Faisalabad)"
  → Updates rows 5, 12, 18, 24, 31
  ✅ All done in one click!
```

---

## 🎯 Usage Examples

### Example 1: Import 100 New Dealers
```
1. Click "Import Dealers" from dealers page
2. Select:
   - Purpose: New Dealers
   - Source: Field Survey
   - Duplicates: Skip
3. Upload: dealers_list.csv (100 rows)
4. Mapping:
   - 95 auto-mapped successfully
   - 5 villages need manual mapping
   - Map "Village A" → Dijkot
   - Map "Village B" → Samundri
5. Bulk Assignment:
   - Assign Field Staff: Ahmad Ali (50 dealers)
   - Assign Field Staff: Hassan Raza (50 dealers)
6. Preview: Review all 100 rows
7. Import: Watch progress
8. Complete:
   - ✅ 95 created
   - ⚠️ 5 skipped (duplicates)
   - ❌ 0 failed
```

### Example 2: Update Existing Dealers
```
1. Import with:
   - Purpose: Update Existing
   - Duplicates: Update
2. Upload: dealer_updates.csv
3. System matches by dealer_code
4. Updates only changed fields
5. Result: 80 updated, 20 skipped (not found)
```

### Example 3: Territory Assignment
```
1. Import with Purpose: Territory Assignment
2. CSV has:
   dealer_code,assigned_field_staff_name
   D-001,Ahmad Ali
   D-002,Ahmad Ali
   D-003,Hassan Raza
3. Mapping: Auto-maps staff names
4. Import: Updates field_staff_id for all
```

---

## ⚠️ Common Issues & Solutions

### Issue 1: Village Not Found
```
Problem: "Dijkot" not mapping

Solution:
1. Check if village exists in database
2. Check spelling (case-insensitive)
3. Check if village is active
4. Check if area is selected (contextual filter)

Quick Fix:
- Use mapping UI to select from dropdown
- Or add village to database first
```

### Issue 2: Duplicate Dealers
```
Problem: Dealers being skipped

Solution:
1. Check duplicate strategy: Skip/Update/Create
2. Duplicates detected by dealer_code OR phone
3. To force import: Use "Create as New"

Note: May create actual duplicates!
```

### Issue 3: Required Fields Missing
```
Problem: Import fails with validation error

Solution:
Required fields:
  - dealer_code
  - business_name
  - owner_name
  - phone
  - relationship_status
  - relationship_score

Ensure CSV has all required columns!
```

---

## 📈 Performance

- **Batch Size:** 50 dealers per batch
- **Speed:** ~2 seconds per batch
- **Total Time:** 100 dealers ≈ 4 seconds
- **Max Recommended:** 5,000 dealers per import

For larger imports:
1. Split into multiple files
2. Import in chunks
3. Monitor progress

---

## 🎓 Best Practices

### 1. Prepare Data First
```
✅ Clean phone numbers
✅ Standardize location names
✅ Check for duplicates in CSV
✅ Validate dealer codes
```

### 2. Start Small
```
✅ Test with 10-20 rows first
✅ Verify mapping works
✅ Then import full dataset
```

### 3. Review Before Import
```
✅ Check all mappings
✅ Review validation warnings
✅ Verify bulk assignments
```

### 4. Download Template
```
✅ Use provided CSV template
✅ Follow column naming exactly
✅ Keep headers as-is
```

---

## 🔗 Integration with Farmers

This dealers import system follows the EXACT same pattern as farmers import:

| Feature | Farmers | Dealers |
|---------|---------|---------|
| Name-based mapping | ✅ | ✅ |
| Hierarchical location | ✅ | ✅ |
| Contextual filtering | ✅ | ✅ |
| Bulk assignment | ✅ | ✅ |
| Batch processing | ✅ | ✅ |
| Progress tracking | ✅ | ✅ |

**Benefit:** Users familiar with farmers import can immediately use dealers import!

---

## 🚀 Quick Start

### 1. Prepare CSV
Download template from import page, fill in dealer data

### 2. Navigate to Import
Go to: `/crm/dealers` → Click "Import Dealers"

### 3. Follow Wizard
6-step wizard guides you through entire process

### 4. Review & Import
Preview all data, then click "Start Import"

### 5. Check Results
See success/failure stats, fix errors if needed

---

**That's it! The dealers bulk import system makes importing hundreds of dealers with complex relationships simple and intuitive!** 🎉
