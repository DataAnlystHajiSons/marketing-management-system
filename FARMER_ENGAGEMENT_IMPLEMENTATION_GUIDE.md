# Farmer Product Engagement Model - Implementation Guide

## 📋 Overview

This guide explains the new **Product-Level Tracking** system for farmers that enables multi-product, multi-season engagement tracking without data conflicts.

---

## 🎯 Why This Change?

### The Problem
- ❌ Same farmer used for multiple products (Onion, Chili, Cotton)
- ❌ Each product has its own journey (invited → attended → visited → converted)
- ❌ Uploading farmer for new product overwrote previous product data
- ❌ Can't track "Converted for Onion but New Lead for Chili"
- ❌ Can't report conversion rates per product per source

### The Solution
**Farmer Product Engagements Table** - Tracks engagement at product-season level

**Before:**
```
farmers table
├── lead_stage: "converted" (but for which product?)
└── is_customer: true (bought what?)
```

**After:**
```
farmers table (demographics only)
├── farmer_code
├── full_name
├── phone
└── village

farmer_product_engagements table (journey per product)
├── Ahmed + Onion + Winter 2024 → Converted ✅
├── Ahmed + Chili + Spring 2024 → Not Interested ❌
└── Ahmed + Onion + Winter 2025 → In Progress 📅
```

---

## 📦 What's Been Created

### 1. Database Schema (`FARMER_ENGAGEMENT_MIGRATION.sql`)
- ✅ `farmer_product_engagements` table
- ✅ `data_source_type` enum (fm_invitees, fm_attendees, data_bank, etc.)
- ✅ Indexes for performance
- ✅ Triggers for auto-updates
- ✅ Helper functions (calculate score, update quality)
- ✅ Views for reporting
- ✅ Migration of existing farmer data to "Legacy Import"

### 2. API Module (`src/lib/supabase/farmer-engagements.ts`)
- ✅ CRUD operations for engagements
- ✅ Filtering by farmer, product, season, source, TMO
- ✅ Stage management (update stage, mark converted, close)
- ✅ Bulk operations (for list uploads)
- ✅ Statistics and reporting
- ✅ Season management

### 3. React Hooks (`src/hooks/use-farmer-engagements.ts`)
- ✅ `useFarmerEngagements()` - List with filters
- ✅ `useEngagement(id)` - Single engagement details
- ✅ `useFarmerEngagementsActions()` - CRUD actions
- ✅ `useEngagementStats()` - Analytics
- ✅ `useSeasons()` - Available seasons

---

## 🚀 Implementation Steps

### **STEP 1: Run Database Migration** ⚠️ REQUIRED FIRST

```bash
# Connect to your Supabase project
# Go to SQL Editor in Supabase Dashboard
# Copy and paste the content of FARMER_ENGAGEMENT_MIGRATION.sql
# Execute the script
```

**What it does:**
1. Creates `farmer_product_engagements` table
2. Migrates existing farmers to "Legacy Import" season
3. Links existing activities to legacy engagements
4. Sets up triggers and functions

**Verification:**
```sql
-- Run this query to verify migration
SELECT 
    'Farmers' as entity,
    COUNT(*) as count
FROM farmers
UNION ALL
SELECT 
    'Engagements',
    COUNT(*)
FROM farmer_product_engagements;
```

### **STEP 2: Update Farmer Forms** (TODO)

**File:** `src/app/(dashboard)/crm/farmers/new/page.tsx`

Add these fields:
```tsx
// Add to form state
const [formData, setFormData] = useState({
  // ... existing fields ...
  productId: '',
  season: '',
  dataSource: 'manual_entry' as DataSourceType,
})

// Add to form UI
<div className="space-y-2">
  <Label htmlFor="product">Product/Crop *</Label>
  <Select
    id="product"
    name="productId"
    value={formData.productId}
    onChange={handleChange}
    required
  >
    <option value="">Select product...</option>
    {products.map(p => (
      <option key={p.id} value={p.id}>{p.product_name}</option>
    ))}
  </Select>
</div>

<div className="space-y-2">
  <Label htmlFor="season">Season *</Label>
  <Input
    id="season"
    name="season"
    placeholder="e.g., Winter 2024, Kharif 2024"
    value={formData.season}
    onChange={handleChange}
    required
  />
</div>
```

**Submit logic:**
```tsx
// Create farmer
const { data: farmer } = await farmersAPI.create({
  full_name: formData.fullName,
  phone: formData.phone,
  // ... other demographic fields ...
})

// Create engagement
await farmerEngagementsAPI.create({
  farmer_id: farmer.id,
  product_id: formData.productId,
  season: formData.season,
  data_source: 'manual_entry',
  assigned_tmo_id: formData.assignedTMO,
  assigned_field_staff_id: formData.leadSourceFieldStaff,
})
```

### **STEP 3: Update Farmers List Page** (TODO)

**File:** `src/app/(dashboard)/crm/farmers/page.tsx`

**Option A: Show engagements summary**
```tsx
{filteredFarmers.map((farmer) => (
  <TableRow key={farmer.id}>
    <TableCell>{farmer.full_name}</TableCell>
    <TableCell>
      {/* Show active engagements */}
      <div className="flex flex-col gap-1">
        {farmer.engagements?.map(eng => (
          <Badge key={eng.id} variant="outline">
            {eng.product?.product_name} - {eng.season}
            <Badge className="ml-2" variant={
              eng.is_converted ? 'success' : 'secondary'
            }>
              {eng.lead_stage}
            </Badge>
          </Badge>
        ))}
      </div>
    </TableCell>
  </TableRow>
))}
```

**Option B: Add filter for product/season**
```tsx
const [selectedProduct, setSelectedProduct] = useState('')
const [selectedSeason, setSelectedSeason] = useState('')

// Filter engagements
const { engagements } = useFarmerEngagements({
  product_id: selectedProduct,
  season: selectedSeason,
  is_active: true,
})
```

### **STEP 4: Update Farmer Detail Page** (TODO)

**File:** `src/app/(dashboard)/crm/farmers/[id]/page.tsx`

Add "Product Engagements" tab:
```tsx
<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="engagements">Product Engagements</TabsTrigger>
    <TabsTrigger value="activities">Activities</TabsTrigger>
  </TabsList>

  <TabsContent value="engagements">
    <Card>
      <CardHeader>
        <CardTitle>Product Engagements</CardTitle>
        <CardDescription>
          Track this farmer's journey across different products
        </CardDescription>
      </CardHeader>
      <CardContent>
        {engagements.map(eng => (
          <div key={eng.id} className="border-b pb-4 mb-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">
                  {eng.product?.product_name || 'General'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Season: {eng.season}
                </p>
              </div>
              <Badge variant={eng.is_converted ? 'success' : 'secondary'}>
                {eng.lead_stage}
              </Badge>
            </div>
            
            <div className="mt-2 grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Source</p>
                <p className="text-sm font-medium">{eng.data_source}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Lead Score</p>
                <p className="text-sm font-medium">{eng.lead_score}/100</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Interactions</p>
                <p className="text-sm font-medium">{eng.total_interactions}</p>
              </div>
            </div>

            {eng.is_converted && (
              <Alert className="mt-2 bg-green-50">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Converted on {new Date(eng.conversion_date).toLocaleDateString()}
                </AlertDescription>
              </Alert>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  </TabsContent>
</Tabs>
```

### **STEP 5: Update Activity Logging** (TODO)

**File:** `src/components/crm/log-activity-modal.tsx`

Add engagement selector:
```tsx
const [selectedEngagement, setSelectedEngagement] = useState('')

// Fetch farmer's active engagements
const { engagements } = useFarmerEngagements({ 
  farmer_id: farmerId,
  is_active: true 
})

// Add to form
<div className="space-y-2">
  <Label>Product Context *</Label>
  <Select
    value={selectedEngagement}
    onChange={(e) => setSelectedEngagement(e.target.value)}
    required
  >
    <option value="">Select product/season...</option>
    {engagements.map(eng => (
      <option key={eng.id} value={eng.id}>
        {eng.product?.product_name} - {eng.season} 
        ({eng.lead_stage})
      </option>
    ))}
  </Select>
  <p className="text-xs text-muted-foreground">
    Which product is this activity related to?
  </p>
</div>

// Update activity creation
await activitiesAPI.create({
  farmer_id: farmerId,
  engagement_id: selectedEngagement, // NEW!
  activity_type: formData.activity_type,
  // ... rest of the data
})
```

### **STEP 6: List Upload Feature** (NEW - TODO)

**Create:** `src/app/(dashboard)/crm/farmers/upload/page.tsx`

```tsx
function FarmerListUploadPage() {
  const [listType, setListType] = useState<DataSourceType>('fm_invitees')
  const [product, setProduct] = useState('')
  const [season, setSeason] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const handleUpload = async () => {
    // Parse CSV/Excel
    const farmers = await parseFile(file)
    
    // Create/update farmers
    const farmerIds = await Promise.all(
      farmers.map(async (f) => {
        // Check if farmer exists
        const existing = await farmersAPI.getByPhone(f.phone)
        
        if (existing) {
          return existing.id
        } else {
          const { data } = await farmersAPI.create(f)
          return data.id
        }
      })
    )
    
    // Create engagements
    await farmerEngagementsAPI.bulkCreate(
      farmerIds.map(farmerId => ({
        farmer_id: farmerId,
        product_id: product,
        season: season,
        data_source: listType,
        lead_stage: listType.includes('invitees') 
          ? 'meeting_invited' 
          : 'meeting_attended',
      }))
    )
    
    alert('List uploaded successfully!')
  }

  return (
    <div>
      <h1>Upload Farmer List</h1>
      
      <Select value={listType} onChange={e => setListType(e.target.value)}>
        <option value="fm_invitees">Farmer Meeting Invitees</option>
        <option value="fm_attendees">Farmer Meeting Attendees</option>
        <option value="fd_invitees">Farmer Day Invitees</option>
        <option value="fd_attendees">Farmer Day Attendees</option>
        <option value="data_bank">Data Bank</option>
      </Select>

      <Select value={product} onChange={e => setProduct(e.target.value)}>
        <option value="">Select Product</option>
        {products.map(p => (
          <option value={p.id}>{p.product_name}</option>
        ))}
      </Select>

      <Input
        placeholder="Season (e.g., Winter 2024)"
        value={season}
        onChange={e => setSeason(e.target.value)}
      />

      <Input
        type="file"
        accept=".csv,.xlsx"
        onChange={e => setFile(e.target.files?.[0])}
      />

      <Button onClick={handleUpload}>Upload</Button>
    </div>
  )
}
```

---

## 📊 Usage Examples

### Example 1: TMO Uploads FM Attendees List

```tsx
// TMO uploads 120 farmers who attended Onion meeting
await farmerEngagementsAPI.bulkCreate([
  {
    farmer_id: 'farmer-1-id',
    product_id: 'onion-variety-x',
    season: 'Winter 2024',
    data_source: 'fm_attendees',
    lead_stage: 'meeting_attended',
    assigned_tmo_id: 'tmo-id',
    source_meeting_id: 'meeting-123',
  },
  // ... 119 more farmers
])
```

### Example 2: Call Farmer from Data Bank for New Product

```tsx
// Ahmed already exists (bought Onion before)
// Now calling him for Chili from Data Bank

await farmerEngagementsAPI.create({
  farmer_id: 'ahmed-id',
  product_id: 'chili-variety-y',
  season: 'Spring 2024',
  data_source: 'data_bank',
  lead_stage: 'contacted',
  assigned_tmo_id: 'tmo-id',
})
```

### Example 3: Report Conversion Rates

```tsx
// Get stats for Onion from FM Attendees
const { stats } = await farmerEngagementsAPI.getStats({
  product_id: 'onion-variety-x',
  season: 'Winter 2024',
  data_source: 'fm_attendees',
})

console.log(`
  Total: ${stats.total}
  Converted: ${stats.converted}
  Conversion Rate: ${stats.conversionRate}%
`)
```

---

## 🔄 Migration Impact

### Existing Farmers
- ✅ Automatically migrated to "Legacy Import" season
- ✅ All data preserved
- ✅ Can still be viewed/edited
- ✅ New engagements can be created for them

### Existing Activities
- ✅ Linked to legacy engagements
- ✅ Will show in activity timeline
- ✅ New activities will link to specific engagements

### No Data Loss
- ✅ Zero downtime
- ✅ Backward compatible
- ✅ Rollback script included

---

## 📈 Benefits Achieved

1. ✅ **Multi-Product Tracking**: Track same farmer across Onion, Chili, Cotton
2. ✅ **Accurate Reporting**: "30 FM Attendees for Chili, 12 converted = 40%"
3. ✅ **No Conflicts**: Uploading for new product doesn't overwrite old data
4. ✅ **History**: See Ahmed converted Onion 3 times, never bought Chili
5. ✅ **Source Tracking**: Know which entry point works best per product
6. ✅ **Season Management**: Track same product across multiple seasons

---

## 🐛 Troubleshooting

### Issue: Migration fails
**Solution:** Check if tables already exist, drop and retry

### Issue: Duplicate engagements
**Solution:** Use `farmerEngagementsAPI.exists()` before creating

### Issue: Activities not showing
**Solution:** Ensure `engagement_id` is set when logging activities

---

## 🚧 Next Steps

### Immediate (High Priority)
1. ☐ Run database migration script
2. ☐ Update farmer add/edit forms with product/season
3. ☐ Update farmers list page to show engagements
4. ☐ Test creating engagements manually

### Short-term (Medium Priority)
5. ☐ Build list upload interface
6. ☐ Add engagements tab to farmer detail page
7. ☐ Update activity logging with engagement context
8. ☐ Create engagement-based reports

### Long-term (Low Priority)
9. ☐ Build product-specific dashboards
10. ☐ Add engagement analytics/charts
11. ☐ Implement engagement scoring dashboard
12. ☐ Add bulk engagement actions

---

## 📞 Support

For questions or issues:
1. Check this guide
2. Review `FARMER_ENGAGEMENT_MIGRATION.sql` comments
3. Test queries in Supabase SQL Editor
4. Review API functions in `farmer-engagements.ts`

---

**Status:** ✅ Backend Complete | 🚧 Frontend In Progress
**Version:** 1.0.0
**Date:** 2025-10-29
