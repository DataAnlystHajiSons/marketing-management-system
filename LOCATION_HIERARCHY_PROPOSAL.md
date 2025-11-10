# Location Hierarchy System - Comprehensive Proposal

## 1. Current State Analysis

### **Current Implementation:**
```
Farmers Table:
├─ village (TEXT) - Free text input ❌
├─ city (TEXT) - Free text input ❌
├─ district (TEXT) - Free text input ❌
└─ address (TEXT) - Free text input ✅ (Keep this)
```

### **Problems:**

| Issue | Example | Impact |
|-------|---------|--------|
| **Typos** | "Multan" vs "multan" vs "Multaan" | Duplicate entries |
| **Inconsistency** | "Lahore City" vs "Lahore" | Data fragmentation |
| **No Structure** | Village in City field | Wrong categorization |
| **No Validation** | Made-up village names | Inaccurate data |
| **Hard to Filter** | Search "Multan" misses "multan" | Poor analytics |
| **No Hierarchy** | Can't find "all farmers in Punjab zone" | Limited reporting |
| **No Governance** | Anyone can enter anything | Data chaos |

---

## 2. Proposed Solution: Hierarchical Location System

### **New Structure:**
```
Zone (Province/Region)
  ↓
Area (District/City)
  ↓
Village (Village/Town/Locality)
  ↓
Farmer
  └─ Specific Address (House #, Street)
```

### **Database Schema:**

```sql
-- Existing tables (already in database)
zones (
  id UUID,
  name VARCHAR(100),        -- e.g., "Punjab", "Sindh"
  code VARCHAR(20),         -- e.g., "PNJ", "SND"
  is_active BOOLEAN,
  created_at TIMESTAMP
)

areas (
  id UUID,
  zone_id UUID,             -- FK to zones
  name VARCHAR(100),        -- e.g., "Multan", "Lahore"
  code VARCHAR(20),         -- e.g., "MLT", "LHR"
  is_active BOOLEAN,
  created_at TIMESTAMP
)

-- NEW: Villages table
villages (
  id UUID PRIMARY KEY,
  area_id UUID NOT NULL,    -- FK to areas
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20),
  population INT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(area_id, name)     -- Prevent duplicates within same area
)

-- Updated farmers table
farmers (
  id UUID,
  farmer_code VARCHAR(50),
  full_name VARCHAR(200),
  phone VARCHAR(20),
  
  -- NEW: Structured location
  zone_id UUID,             -- FK to zones (derived from area)
  area_id UUID,             -- FK to areas
  village_id UUID,          -- FK to villages
  
  -- DEPRECATED (keep for migration)
  village VARCHAR(100),     -- Will be removed after migration
  city VARCHAR(100),        -- Will be removed after migration
  district VARCHAR(100),    -- Will be removed after migration
  
  -- KEEP: Specific address
  address TEXT,             -- House #, Street, Landmarks
  
  ...
)
```

---

## 3. Benefits of Hierarchical System

### **Data Quality:**
- ✅ No typos (dropdown selection)
- ✅ Consistent naming
- ✅ Validated entries only
- ✅ No duplicate villages
- ✅ Clean data for analytics

### **Better Filtering:**
```sql
-- Find all farmers in Punjab zone
SELECT * FROM farmers WHERE zone_id = 'punjab-zone-id';

-- Find all farmers in Multan area
SELECT * FROM farmers WHERE area_id = 'multan-area-id';

-- Find all farmers in Chak 123 village
SELECT * FROM farmers WHERE village_id = 'chak-123-id';
```

### **Analytics & Reporting:**
```
Zone Performance:
  Punjab: 500 farmers (60 converted)
  Sindh: 300 farmers (45 converted)
  
Area Performance:
  Multan: 150 farmers (22 converted)
  Lahore: 200 farmers (30 converted)
  
Village Penetration:
  Chak 123: 45 farmers (78% coverage)
  Chak 124: 12 farmers (25% coverage)
```

### **Role-Based Management:**
```
Head of Marketing → Manage all zones
Regional Manager  → Manage specific zone (Punjab only)
Area Manager      → Manage specific area (Multan only)
Field Staff       → View assigned villages only
```

### **Better User Experience:**
```
Add Farmer Form:
1. Select Zone: [Punjab ▼]
   ↓ Loads areas in Punjab only
2. Select Area: [Multan ▼]
   ↓ Loads villages in Multan only
3. Select Village: [Chak 123 ▼]
4. Enter Address: "House #45, Main Street"
```

---

## 4. Implementation Plan

### **Phase 1: Database Setup**

```sql
-- Step 1: Create villages table
CREATE TABLE villages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    area_id UUID NOT NULL REFERENCES areas(id) ON DELETE RESTRICT,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20),
    village_type VARCHAR(50), -- 'rural', 'urban', 'semi-urban'
    population INT,
    postal_code VARCHAR(10),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(area_id, name)
);

-- Step 2: Add indexes
CREATE INDEX idx_villages_area ON villages(area_id);
CREATE INDEX idx_villages_name ON villages(name);
CREATE INDEX idx_villages_active ON villages(is_active);

-- Step 3: Add columns to farmers table
ALTER TABLE farmers ADD COLUMN zone_id UUID REFERENCES zones(id);
ALTER TABLE farmers ADD COLUMN area_id UUID REFERENCES areas(id);
ALTER TABLE farmers ADD COLUMN village_id UUID REFERENCES villages(id);

CREATE INDEX idx_farmers_zone ON farmers(zone_id);
CREATE INDEX idx_farmers_area ON farmers(area_id);
CREATE INDEX idx_farmers_village ON farmers(village_id);

-- Step 4: Add trigger to auto-populate zone_id
CREATE OR REPLACE FUNCTION auto_populate_farmer_zone()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.area_id IS NOT NULL THEN
        SELECT zone_id INTO NEW.zone_id
        FROM areas
        WHERE id = NEW.area_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_populate_farmer_zone
    BEFORE INSERT OR UPDATE OF area_id ON farmers
    FOR EACH ROW
    EXECUTE FUNCTION auto_populate_farmer_zone();
```

### **Phase 2: Data Migration**

```sql
-- Migration script to move existing data
-- This extracts unique villages from existing farmers

-- Step 1: Extract unique villages per district/city
INSERT INTO villages (area_id, name, created_at)
SELECT DISTINCT
    a.id as area_id,
    f.village as name,
    NOW()
FROM farmers f
JOIN areas a ON (
    LOWER(f.city) = LOWER(a.name) OR 
    LOWER(f.district) = LOWER(a.name)
)
WHERE f.village IS NOT NULL
    AND f.village != ''
    AND NOT EXISTS (
        SELECT 1 FROM villages v 
        WHERE v.area_id = a.id 
        AND LOWER(v.name) = LOWER(f.village)
    )
ORDER BY a.id, f.village;

-- Step 2: Update farmers with village_id
UPDATE farmers f
SET 
    village_id = v.id,
    area_id = v.area_id,
    zone_id = a.zone_id
FROM villages v
JOIN areas a ON v.area_id = a.id
WHERE LOWER(f.village) = LOWER(v.name)
    AND (
        LOWER(f.city) = LOWER(a.name) OR
        LOWER(f.district) = LOWER(a.name)
    );

-- Step 3: Handle unmapped farmers (manual review needed)
SELECT 
    id,
    farmer_code,
    full_name,
    village,
    city,
    district
FROM farmers
WHERE village_id IS NULL
    AND village IS NOT NULL;
```

### **Phase 3: API Development**

```typescript
// src/lib/supabase/villages.ts

export interface Village {
  id: string
  area_id: string
  name: string
  code?: string
  village_type?: 'rural' | 'urban' | 'semi-urban'
  population?: number
  postal_code?: string
  is_active: boolean
  created_at: string
}

export const villagesAPI = {
  // Get all villages (with optional area filter)
  getAll: async (areaId?: string) => {
    let query = supabase
      .from('villages')
      .select('*, area:areas(id, name, zone_id)')
      .eq('is_active', true)
      .order('name', { ascending: true })
    
    if (areaId) {
      query = query.eq('area_id', areaId)
    }
    
    const { data, error } = await query
    return { data, error }
  },

  // Get villages by area
  getByArea: async (areaId: string) => {
    const { data, error } = await supabase
      .from('villages')
      .select('*')
      .eq('area_id', areaId)
      .eq('is_active', true)
      .order('name', { ascending: true })
    
    return { data, error }
  },

  // Create village
  create: async (village: Partial<Village>) => {
    const { data, error } = await supabase
      .from('villages')
      .insert(village)
      .select()
      .single()
    
    return { data, error }
  },

  // Update village
  update: async (id: string, village: Partial<Village>) => {
    const { data, error } = await supabase
      .from('villages')
      .update(village)
      .eq('id', id)
      .select()
      .single()
    
    return { data, error }
  },

  // Delete village (soft delete)
  delete: async (id: string) => {
    const { error } = await supabase
      .from('villages')
      .update({ is_active: false })
      .eq('id', id)
    
    return { error }
  },
}
```

### **Phase 4: UI Components**

```typescript
// Cascading Location Selector Component

interface LocationSelectorProps {
  selectedZone?: string
  selectedArea?: string
  selectedVillage?: string
  onLocationChange: (location: {
    zoneId?: string
    areaId?: string
    villageId?: string
  }) => void
}

export function LocationSelector({ 
  selectedZone, 
  selectedArea, 
  selectedVillage,
  onLocationChange 
}: LocationSelectorProps) {
  const [zones, setZones] = useState([])
  const [areas, setAreas] = useState([])
  const [villages, setVillages] = useState([])

  // Load zones on mount
  useEffect(() => {
    loadZones()
  }, [])

  // Load areas when zone changes
  useEffect(() => {
    if (selectedZone) {
      loadAreas(selectedZone)
    } else {
      setAreas([])
      setVillages([])
    }
  }, [selectedZone])

  // Load villages when area changes
  useEffect(() => {
    if (selectedArea) {
      loadVillages(selectedArea)
    } else {
      setVillages([])
    }
  }, [selectedArea])

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Zone Selector */}
      <div>
        <Label>Zone/Province *</Label>
        <Select
          value={selectedZone || ''}
          onChange={(e) => onLocationChange({ 
            zoneId: e.target.value 
          })}
        >
          <option value="">Select Zone</option>
          {zones.map(zone => (
            <option key={zone.id} value={zone.id}>
              {zone.name}
            </option>
          ))}
        </Select>
      </div>

      {/* Area Selector */}
      <div>
        <Label>Area/District *</Label>
        <Select
          value={selectedArea || ''}
          onChange={(e) => onLocationChange({ 
            zoneId: selectedZone,
            areaId: e.target.value 
          })}
          disabled={!selectedZone}
        >
          <option value="">Select Area</option>
          {areas.map(area => (
            <option key={area.id} value={area.id}>
              {area.name}
            </option>
          ))}
        </Select>
      </div>

      {/* Village Selector */}
      <div>
        <Label>Village *</Label>
        <Select
          value={selectedVillage || ''}
          onChange={(e) => onLocationChange({ 
            zoneId: selectedZone,
            areaId: selectedArea,
            villageId: e.target.value 
          })}
          disabled={!selectedArea}
        >
          <option value="">Select Village</option>
          {villages.map(village => (
            <option key={village.id} value={village.id}>
              {village.name}
            </option>
          ))}
        </Select>
      </div>
    </div>
  )
}
```

### **Phase 5: Village Management Interface**

```typescript
// Admin page: /admin/locations/villages

- List all villages
- Filter by zone/area
- Add new village
- Edit village details
- Deactivate village
- Bulk import villages (CSV)
- Export villages
```

---

## 5. Role-Based Access Control

### **Permissions Matrix:**

| Role | Zones | Areas | Villages | Farmers |
|------|-------|-------|----------|---------|
| **Head of Marketing** | View All, Manage All | View All, Manage All | View All, Manage All | View All |
| **Regional Manager** | View Assigned | View in Zone, Manage Assigned | View in Zone, Manage Assigned | View in Zone |
| **Area Manager** | View Own | View Own, Manage Own | View in Area, Manage in Area | View in Area |
| **TMO** | View (readonly) | View (readonly) | View (readonly) | View Assigned |
| **Field Staff** | View (readonly) | View (readonly) | View Assigned | View Assigned |

### **Implementation:**

```sql
-- Add role-based zone assignments
CREATE TABLE user_zone_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    zone_id UUID REFERENCES zones(id) ON DELETE CASCADE,
    can_manage BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, zone_id)
);

-- Add role-based area assignments
CREATE TABLE user_area_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    area_id UUID REFERENCES areas(id) ON DELETE CASCADE,
    can_manage BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, area_id)
);

-- RLS Policy: Users can only see farmers in their assigned locations
CREATE POLICY farmers_location_access ON farmers
    FOR SELECT
    USING (
        -- Admin sees all
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid()
            AND role IN ('head_of_marketing', 'admin')
        )
        OR
        -- Regional managers see their zones
        zone_id IN (
            SELECT zone_id FROM user_zone_assignments
            WHERE user_id = auth.uid()
        )
        OR
        -- Area managers see their areas
        area_id IN (
            SELECT area_id FROM user_area_assignments
            WHERE user_id = auth.uid()
        )
        OR
        -- TMOs see their assigned farmers
        assigned_tmo_id = auth.uid()
    );
```

---

## 6. Updated Farmer Forms

### **Add Farmer Form (Before vs After):**

**BEFORE:**
```
Village: [_____________] (free text)
City:    [_____________] (free text)
District: [_____________] (free text)
Address: [_____________] (free text)
```

**AFTER:**
```
Zone:    [Punjab ▼]           (dropdown, auto-loads areas)
Area:    [Multan ▼]           (dropdown, auto-loads villages)
Village: [Chak 123 ▼]         (dropdown, validated)
Address: [House #45, Main St] (free text for specific address)

[+ Add New Village] (if user has permission)
```

### **Advanced Filters (Updated):**

```typescript
// Add to FarmersFilters interface
interface FarmersFilters {
  // ... existing filters
  zoneId?: string          // NEW
  areaId?: string          // NEW
  villageId?: string       // NEW
}

// Filter UI
<div>
  <Label>Zone</Label>
  <Select onChange={(e) => updateFilter('zoneId', e.target.value)}>
    <option value="">All Zones</option>
    {zones.map(...)}
  </Select>
</div>

<div>
  <Label>Area</Label>
  <Select 
    onChange={(e) => updateFilter('areaId', e.target.value)}
    disabled={!filters.zoneId}
  >
    <option value="">All Areas</option>
    {areas.map(...)}
  </Select>
</div>

<div>
  <Label>Village</Label>
  <Select 
    onChange={(e) => updateFilter('villageId', e.target.value)}
    disabled={!filters.areaId}
  >
    <option value="">All Villages</option>
    {villages.map(...)}
  </Select>
</div>
```

---

## 7. Analytics & Reporting Benefits

### **Zone-Level Analytics:**
```sql
SELECT 
    z.name as zone_name,
    COUNT(f.id) as total_farmers,
    COUNT(f.id) FILTER (WHERE f.is_customer = true) as customers,
    AVG(f.lead_score) as avg_score,
    SUM(f.total_purchases) as total_revenue
FROM zones z
LEFT JOIN farmers f ON f.zone_id = z.id
GROUP BY z.id, z.name;
```

**Output:**
```
| Zone   | Farmers | Customers | Avg Score | Revenue      |
|--------|---------|-----------|-----------|--------------|
| Punjab | 500     | 75        | 45        | PKR 5,000,000|
| Sindh  | 300     | 45        | 38        | PKR 3,200,000|
```

### **Area Penetration:**
```sql
SELECT 
    a.name as area_name,
    COUNT(DISTINCT v.id) as total_villages,
    COUNT(DISTINCT f.village_id) as villages_covered,
    ROUND(COUNT(DISTINCT f.village_id)::NUMERIC / 
          NULLIF(COUNT(DISTINCT v.id), 0) * 100, 2) as coverage_percent
FROM areas a
LEFT JOIN villages v ON v.area_id = a.id
LEFT JOIN farmers f ON f.village_id = v.id
GROUP BY a.id, a.name;
```

**Output:**
```
| Area   | Total Villages | Covered | Coverage |
|--------|----------------|---------|----------|
| Multan | 150            | 45      | 30%      |
| Lahore | 200            | 120     | 60%      |
```

---

## 8. Migration Strategy

### **Gradual Migration Approach:**

**Week 1-2: Setup**
- Create villages table
- Add columns to farmers
- Create APIs
- Build UI components

**Week 3-4: Parallel Run**
- Keep old fields (village, city, district)
- Add new fields (zone_id, area_id, village_id)
- Forms save to BOTH old and new fields
- Users can still search old fields

**Week 5-6: Data Migration**
- Run migration script (extract unique villages)
- Manual cleanup of unmapped data
- Validate data quality
- Update existing farmers

**Week 7-8: Transition**
- Make new fields required for new farmers
- Hide old fields in UI
- Update reports to use new structure

**Week 9-10: Cleanup**
- Remove old field columns (after backup)
- Update all queries
- Complete documentation

---

## 9. My Recommendation

### **✅ STRONGLY RECOMMEND implementing this hierarchical system**

### **Why:**

1. **Data Quality** → Clean, validated, consistent data
2. **Scalability** → Easy to add new villages
3. **Analytics** → Zone/Area/Village level reporting
4. **Governance** → Role-based location management
5. **User Experience** → Easier data entry with dropdowns
6. **Future-Proof** → Foundation for advanced features

### **Implementation Priority:**

```
Phase 1: Database + Villages Table (Week 1-2) → HIGH PRIORITY
Phase 2: API Development (Week 3) → HIGH PRIORITY
Phase 3: UI Components (Week 4-5) → HIGH PRIORITY
Phase 4: Migration (Week 6-7) → MEDIUM PRIORITY
Phase 5: Role-Based Access (Week 8-9) → MEDIUM PRIORITY
Phase 6: Analytics Dashboard (Week 10+) → LOW PRIORITY
```

### **Quick Wins:**

Start with these areas that have most farmers:
1. Multan (import top 50 villages)
2. Lahore (import top 50 villages)
3. Faisalabad (import top 50 villages)

Then gradually expand to other areas.

---

## 10. Next Steps

If you approve this approach, I can:

1. ✅ Create SQL migration scripts
2. ✅ Build villages API
3. ✅ Create LocationSelector component
4. ✅ Update Add/Edit Farmer forms
5. ✅ Update Advanced Filters
6. ✅ Create Village Management page
7. ✅ Build data migration script
8. ✅ Add role-based permissions

**Would you like me to proceed with implementation?** 🚀
