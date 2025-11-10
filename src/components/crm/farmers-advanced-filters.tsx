"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { 
  ChevronDown, 
  ChevronUp, 
  X, 
  Filter, 
  RotateCcw,
  Search,
  Sparkles
} from "lucide-react"
import { usersAPI } from "@/lib/supabase/users"
import { productsAPI } from "@/lib/supabase/products"
import { zonesAPI } from "@/lib/supabase/zones"
import { areasAPI } from "@/lib/supabase/areas"
import { villagesAPI } from "@/lib/supabase/villages"

type LeadStage = 'new' | 'contacted' | 'qualified' | 'meeting_invited' | 'meeting_attended' | 
  'visit_scheduled' | 'visit_completed' | 'interested' | 'negotiation' | 'converted' | 
  'active_customer' | 'inactive' | 'lost' | 'rejected'

type LeadQuality = 'hot' | 'warm' | 'cold'

export interface FarmersFilters {
  search?: string
  leadStage?: LeadStage | ''
  leadQuality?: LeadQuality | ''
  isCustomer?: boolean | ''
  assignedTMO?: string
  assignedFieldStaff?: string
  assignedDealer?: string
  minScore?: number
  maxScore?: number
  minLandSize?: number
  maxLandSize?: number
  // NEW: Hierarchical location
  zoneId?: string
  areaId?: string
  villageId?: string
  // NEW: Data source for event tracking
  dataSource?: string
  // NEW: Product filter
  productId?: string
  // NEW: Date filters
  createdFrom?: string
  createdTo?: string
  updatedFrom?: string
  updatedTo?: string
  // OLD: Keep for backward compatibility
  city?: string
  district?: string
}

interface FarmersAdvancedFiltersProps {
  filters: FarmersFilters
  onFiltersChange: (filters: FarmersFilters) => void
  totalCount?: number
  filteredCount?: number
}

const stageOptions: { value: LeadStage | '', label: string }[] = [
  { value: '', label: 'All Stages' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'meeting_invited', label: 'Meeting Invited' },
  { value: 'meeting_attended', label: 'Meeting Attended' },
  { value: 'visit_scheduled', label: 'Visit Scheduled' },
  { value: 'visit_completed', label: 'Visit Completed' },
  { value: 'interested', label: 'Interested' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'converted', label: 'Converted' },
  { value: 'active_customer', label: 'Active Customer' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'lost', label: 'Lost' },
  { value: 'rejected', label: 'Rejected' },
]

const qualityOptions: { value: LeadQuality | '', label: string, color: string }[] = [
  { value: '', label: 'All Qualities', color: '' },
  { value: 'hot', label: 'Hot', color: 'bg-red-100 text-red-800' },
  { value: 'warm', label: 'Warm', color: 'bg-amber-100 text-amber-800' },
  { value: 'cold', label: 'Cold', color: 'bg-blue-100 text-blue-800' },
]

const dataSourceOptions = [
  { value: '', label: 'All Sources' },
  { value: 'fm_invitees', label: '📧 FM Invitee' },
  { value: 'fm_attendees', label: '✅ FM Attendee' },
  { value: 'fd_invitees', label: '📧 FD Invitee' },
  { value: 'fd_attendees', label: '✅ FD Attendee' },
  { value: 'data_bank', label: '🗄️ Data Bank' },
  { value: 'repzo', label: '📱 Repzo' },
  { value: 'manual_entry', label: '✍️ Manual' },
  { value: 'api_integration', label: '🔗 API' },
  { value: 'other', label: '📝 Other' },
]

const quickFilters = [
  { label: 'New Leads', filters: { leadStage: 'new' as LeadStage } },
  { label: 'Hot Leads', filters: { leadQuality: 'hot' as LeadQuality, minScore: 70 } },
  { label: 'Event Attendees', filters: { dataSource: 'fm_attendees' }, icon: '🎯' },
  { label: 'Event Invitees', filters: { dataSource: 'fm_invitees' }, icon: '✉️' },
  { label: 'Customers', filters: { isCustomer: true } },
  { label: 'High Value', filters: { minLandSize: 50 } },
  { label: 'In Negotiation', filters: { leadStage: 'negotiation' as LeadStage } },
]

export function FarmersAdvancedFilters({ 
  filters, 
  onFiltersChange, 
  totalCount,
  filteredCount 
}: FarmersAdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [tmos, setTmos] = useState<any[]>([])
  const [fieldStaff, setFieldStaff] = useState<any[]>([])
  const [dealers, setDealers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [zones, setZones] = useState<any[]>([])
  const [areas, setAreas] = useState<any[]>([])
  const [villages, setVillages] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [loadingLocations, setLoadingLocations] = useState(true)
  const [loadingProducts, setLoadingProducts] = useState(true)

  // Fetch users, products, and locations for dropdowns
  useEffect(() => {
    async function fetchUsers() {
      setLoadingUsers(true)
      const [tmosRes, fsRes, dealersRes] = await Promise.all([
        usersAPI.getTMOs(),
        usersAPI.getFieldStaff(),
        usersAPI.getDealers(),
      ])
      
      if (tmosRes.data) setTmos(tmosRes.data)
      if (fsRes.data) setFieldStaff(fsRes.data)
      if (dealersRes.data) setDealers(dealersRes.data)
      setLoadingUsers(false)
    }
    fetchUsers()
  }, [])

  // Fetch products
  useEffect(() => {
    async function fetchProducts() {
      setLoadingProducts(true)
      const { data } = await productsAPI.getAll()
      if (data) setProducts(data)
      setLoadingProducts(false)
    }
    fetchProducts()
  }, [])

  // Fetch locations
  useEffect(() => {
    async function fetchLocations() {
      setLoadingLocations(true)
      const { supabase } = await import('@/lib/supabase/client')
      
      // Load zones
      const { data: zonesData } = await supabase
        .from('zones')
        .select('id, name, code')
        .eq('is_active', true)
        .order('name')
      
      if (zonesData) setZones(zonesData)
      setLoadingLocations(false)
    }
    fetchLocations()
  }, [])

  // Load areas when zone changes
  useEffect(() => {
    if (filters.zoneId) {
      loadAreasByZone(filters.zoneId)
    } else {
      setAreas([])
      setVillages([])
    }
  }, [filters.zoneId])

  // Load villages when area changes
  useEffect(() => {
    if (filters.areaId) {
      loadVillagesByArea(filters.areaId)
    } else {
      setVillages([])
    }
  }, [filters.areaId])

  const loadAreasByZone = async (zoneId: string) => {
    const { supabase } = await import('@/lib/supabase/client')
    const { data } = await supabase
      .from('areas')
      .select('id, name, code')
      .eq('zone_id', zoneId)
      .eq('is_active', true)
      .order('name')
    
    if (data) setAreas(data)
  }

  const loadVillagesByArea = async (areaId: string) => {
    const { villagesAPI } = await import('@/lib/supabase/villages')
    const { data } = await villagesAPI.getByArea(areaId)
    
    if (data) setVillages(data)
  }

  // Count active filters
  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'search') return false // Don't count search as a filter
    return value !== '' && value !== undefined && value !== null
  }).length

  const hasActiveFilters = activeFilterCount > 0

  const updateFilter = (key: keyof FarmersFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const clearFilter = (key: keyof FarmersFilters) => {
    const newFilters = { ...filters }
    delete newFilters[key]
    onFiltersChange(newFilters)
  }

  const clearAllFilters = () => {
    onFiltersChange({ search: filters.search }) // Keep search
  }

  const applyQuickFilter = (quickFilter: typeof quickFilters[0]) => {
    onFiltersChange({ ...filters, ...quickFilter.filters })
  }

  return (
    <div className="space-y-4">
      {/* Filter Toggle & Stats */}
      <div className="flex items-center justify-between">
        {/* Filter Toggle Button */}
        <Button
          variant={hasActiveFilters ? "default" : "outline"}
          onClick={() => setIsExpanded(!isExpanded)}
          className="relative"
        >
          <Filter className="h-4 w-4 mr-2" />
          Advanced Filters
          {activeFilterCount > 0 && (
            <Badge 
              variant="secondary" 
              className="ml-2 bg-primary-foreground text-primary"
            >
              {activeFilterCount}
            </Badge>
          )}
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 ml-2" />
          ) : (
            <ChevronDown className="h-4 w-4 ml-2" />
          )}
        </Button>

        {/* Filter Count Display */}
        {(totalCount !== undefined && filteredCount !== undefined) && (
          <div className="text-sm text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{filteredCount}</span> of{' '}
            <span className="font-semibold text-foreground">{totalCount}</span> farmers
          </div>
        )}
      </div>

      {/* Quick Filters */}
      {!isExpanded && (
        <div className="flex flex-wrap gap-2">
          {quickFilters.map((qf: any) => (
            <Button
              key={qf.label}
              variant="outline"
              size="sm"
              onClick={() => applyQuickFilter(qf)}
              className="h-7 text-xs"
            >
              {qf.icon ? (
                <span className="mr-1">{qf.icon}</span>
              ) : (
                <Sparkles className="h-3 w-3 mr-1" />
              )}
              {qf.label}
            </Button>
          ))}
        </div>
      )}

      {/* Active Filters Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-muted-foreground font-medium">Active Filters:</span>
          
          {filters.leadStage && (
            <Badge variant="secondary" className="gap-1">
              Stage: {stageOptions.find(s => s.value === filters.leadStage)?.label}
              <X 
                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                onClick={() => clearFilter('leadStage')}
              />
            </Badge>
          )}

          {filters.leadQuality && (
            <Badge variant="secondary" className="gap-1">
              Quality: {filters.leadQuality.toUpperCase()}
              <X 
                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                onClick={() => clearFilter('leadQuality')}
              />
            </Badge>
          )}

          {filters.dataSource && (
            <Badge variant="secondary" className="gap-1 bg-purple-100 text-purple-800">
              {filters.dataSource === 'fm_attendees' && '🎯 Event Attendees'}
              {filters.dataSource === 'fm_invitees' && '✉️ Event Invitees'}
              {filters.dataSource === 'fd_attendees' && '🌾 Field Day Attendees'}
              {filters.dataSource === 'fd_invitees' && '🌾 Field Day Invitees'}
              {!['fm_attendees', 'fm_invitees', 'fd_attendees', 'fd_invitees'].includes(filters.dataSource) && `Source: ${filters.dataSource}`}
              <X 
                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                onClick={() => clearFilter('dataSource')}
              />
            </Badge>
          )}

          {filters.isCustomer !== undefined && filters.isCustomer !== '' && (
            <Badge variant="secondary" className="gap-1">
              {filters.isCustomer ? 'Customers Only' : 'Leads Only'}
              <X 
                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                onClick={() => clearFilter('isCustomer')}
              />
            </Badge>
          )}

          {filters.assignedTMO && (
            <Badge variant="secondary" className="gap-1">
              TMO: {tmos.find(t => t.id === filters.assignedTMO)?.full_name || 'Selected'}
              <X 
                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                onClick={() => clearFilter('assignedTMO')}
              />
            </Badge>
          )}

          {filters.assignedFieldStaff && (
            <Badge variant="secondary" className="gap-1">
              Field Staff: {fieldStaff.find(f => f.id === filters.assignedFieldStaff)?.full_name || 'Selected'}
              <X 
                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                onClick={() => clearFilter('assignedFieldStaff')}
              />
            </Badge>
          )}

          {(filters.minScore !== undefined || filters.maxScore !== undefined) && (
            <Badge variant="secondary" className="gap-1">
              Score: {filters.minScore || 0}-{filters.maxScore || 100}
              <X 
                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                onClick={() => {
                  clearFilter('minScore')
                  clearFilter('maxScore')
                }}
              />
            </Badge>
          )}

          {(filters.minLandSize !== undefined || filters.maxLandSize !== undefined) && (
            <Badge variant="secondary" className="gap-1">
              Land: {filters.minLandSize || 0}-{filters.maxLandSize || '∞'} acres
              <X 
                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                onClick={() => {
                  clearFilter('minLandSize')
                  clearFilter('maxLandSize')
                }}
              />
            </Badge>
          )}

          {filters.zoneId && (
            <Badge variant="secondary" className="gap-1">
              Zone: {zones.find((z) => z.id === filters.zoneId)?.name || filters.zoneId}
              <X 
                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                onClick={() => clearFilter('zoneId')}
              />
            </Badge>
          )}

          {filters.areaId && (
            <Badge variant="secondary" className="gap-1">
              Area: {areas.find((a) => a.id === filters.areaId)?.name || filters.areaId}
              <X 
                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                onClick={() => clearFilter('areaId')}
              />
            </Badge>
          )}

          {filters.villageId && (
            <Badge variant="secondary" className="gap-1">
              Village: {villages.find((v) => v.id === filters.villageId)?.name || filters.villageId}
              <X 
                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                onClick={() => clearFilter('villageId')}
              />
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-6 text-xs text-destructive hover:text-destructive"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Clear All
          </Button>
        </div>
      )}

      {/* Expanded Filters Panel with smooth animation */}
      {isExpanded && (
        <Card className="border-2 shadow-lg animate-slide-down">
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Section 1: Lead Management */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-primary" />
                  Lead Management
                </h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="filter-stage" className="text-xs">Lead Stage</Label>
                    <Select
                      id="filter-stage"
                      value={filters.leadStage || ''}
                      onChange={(e) => {
                        const value = e.target.value
                        const newFilters = { ...filters }
                        if (value) {
                          newFilters.leadStage = value as any
                        } else {
                          delete newFilters.leadStage
                        }
                        onFiltersChange(newFilters)
                      }}
                      className={filters.leadStage ? 'ring-1 ring-primary/30 border-primary/50 bg-primary/5' : ''}
                    >
                      {stageOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="filter-quality" className="text-xs">Lead Quality</Label>
                    <Select
                      id="filter-quality"
                      value={filters.leadQuality || ''}
                      onChange={(e) => {
                        const value = e.target.value
                        const newFilters = { ...filters }
                        if (value) {
                          newFilters.leadQuality = value as any
                        } else {
                          delete newFilters.leadQuality
                        }
                        onFiltersChange(newFilters)
                      }}
                      className={filters.leadQuality ? 'ring-1 ring-primary/30 border-primary/50 bg-primary/5' : ''}
                    >
                      {qualityOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="filter-customer" className="text-xs">Customer Status</Label>
                    <Select
                      id="filter-customer"
                      value={filters.isCustomer === undefined ? '' : filters.isCustomer ? 'true' : 'false'}
                      onChange={(e) => {
                        const value = e.target.value
                        const newFilters = { ...filters }
                        if (value === '') {
                          delete newFilters.isCustomer
                        } else {
                          newFilters.isCustomer = value === 'true'
                        }
                        onFiltersChange(newFilters)
                      }}
                      className={filters.isCustomer !== undefined ? 'ring-1 ring-primary/30 border-primary/50 bg-primary/5' : ''}
                    >
                      <option value="">All</option>
                      <option value="true">Customers Only</option>
                      <option value="false">Leads Only</option>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Section 2: Score Range */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-primary" />
                  Score Range
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="filter-min-score" className="text-xs">Minimum Score</Label>
                    <Input
                      id="filter-min-score"
                      type="number"
                      min="0"
                      max="100"
                      placeholder="0"
                      value={filters.minScore || ''}
                      onChange={(e) => updateFilter('minScore', e.target.value ? parseInt(e.target.value) : undefined)}
                      className={filters.minScore !== undefined ? 'ring-1 ring-primary/30 border-primary/50 bg-primary/5' : ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="filter-max-score" className="text-xs">Maximum Score</Label>
                    <Input
                      id="filter-max-score"
                      type="number"
                      min="0"
                      max="100"
                      placeholder="100"
                      value={filters.maxScore || ''}
                      onChange={(e) => updateFilter('maxScore', e.target.value ? parseInt(e.target.value) : undefined)}
                      className={filters.maxScore !== undefined ? 'ring-1 ring-primary/30 border-primary/50 bg-primary/5' : ''}
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Assignment */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-primary" />
                  Assignment
                </h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="filter-tmo" className="text-xs">Assigned TMO</Label>
                    <Select
                      id="filter-tmo"
                      value={filters.assignedTMO || ''}
                      onChange={(e) => {
                        const value = e.target.value
                        const newFilters = { ...filters }
                        if (value) {
                          newFilters.assignedTMO = value
                        } else {
                          delete newFilters.assignedTMO
                        }
                        onFiltersChange(newFilters)
                      }}
                      disabled={loadingUsers}
                      className={filters.assignedTMO ? 'ring-1 ring-primary/30 border-primary/50 bg-primary/5' : ''}
                    >
                      <option value="">All TMOs</option>
                      {tmos.map((tmo) => (
                        <option key={tmo.id} value={tmo.id}>
                          {tmo.full_name}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="filter-field-staff" className="text-xs">Field Staff</Label>
                    <Select
                      id="filter-field-staff"
                      value={filters.assignedFieldStaff || ''}
                      onChange={(e) => {
                        const value = e.target.value
                        const newFilters = { ...filters }
                        if (value) {
                          newFilters.assignedFieldStaff = value
                        } else {
                          delete newFilters.assignedFieldStaff
                        }
                        onFiltersChange(newFilters)
                      }}
                      disabled={loadingUsers}
                      className={filters.assignedFieldStaff ? 'ring-1 ring-primary/30 border-primary/50 bg-primary/5' : ''}
                    >
                      <option value="">All Field Staff</option>
                      {fieldStaff.map((staff) => (
                        <option key={staff.id} value={staff.id}>
                          {staff.full_name}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="filter-dealer" className="text-xs">Assigned Dealer</Label>
                    <Select
                      id="filter-dealer"
                      value={filters.assignedDealer || ''}
                      onChange={(e) => {
                        const value = e.target.value
                        const newFilters = { ...filters }
                        if (value) {
                          newFilters.assignedDealer = value
                        } else {
                          delete newFilters.assignedDealer
                        }
                        onFiltersChange(newFilters)
                      }}
                      disabled={loadingUsers}
                      className={filters.assignedDealer ? 'ring-1 ring-primary/30 border-primary/50 bg-primary/5' : ''}
                    >
                      <option value="">All Dealers</option>
                      {dealers.map((dealer) => (
                        <option key={dealer.id} value={dealer.id}>
                          {dealer.business_name}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
              </div>

              {/* Section 4: Farm Details */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-primary" />
                  Farm Details
                </h3>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="filter-min-land" className="text-xs">Min Land Size (acres)</Label>
                    <Input
                      id="filter-min-land"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={filters.minLandSize || ''}
                      onChange={(e) => updateFilter('minLandSize', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className={filters.minLandSize !== undefined ? 'ring-1 ring-primary/30 border-primary/50 bg-primary/5' : ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="filter-max-land" className="text-xs">Max Land Size (acres)</Label>
                    <Input
                      id="filter-max-land"
                      type="number"
                      min="0"
                      placeholder="∞"
                      value={filters.maxLandSize || ''}
                      onChange={(e) => updateFilter('maxLandSize', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className={filters.maxLandSize !== undefined ? 'ring-1 ring-primary/30 border-primary/50 bg-primary/5' : ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="filter-zone" className="text-xs">Zone/Province</Label>
                    <Select
                      id="filter-zone"
                      value={filters.zoneId || ''}
                      onChange={(e) => {
                        const value = e.target.value
                        const newFilters = { ...filters }
                        if (value) {
                          newFilters.zoneId = value
                        } else {
                          delete newFilters.zoneId
                        }
                        delete newFilters.areaId
                        delete newFilters.villageId
                        onFiltersChange(newFilters)
                      }}
                      disabled={loadingLocations}
                      className={filters.zoneId ? 'ring-1 ring-primary/30 border-primary/50 bg-primary/5' : ''}
                    >
                      <option value="">All Zones</option>
                      {zones.map((zone) => (
                        <option key={zone.id} value={zone.id}>
                          {zone.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="filter-area" className="text-xs">Area/District</Label>
                    <Select
                      id="filter-area"
                      value={filters.areaId || ''}
                      onChange={(e) => {
                        const value = e.target.value
                        const newFilters = { ...filters }
                        if (value) {
                          newFilters.areaId = value
                        } else {
                          delete newFilters.areaId
                        }
                        delete newFilters.villageId
                        onFiltersChange(newFilters)
                      }}
                      disabled={!filters.zoneId || areas.length === 0}
                      className={filters.areaId ? 'ring-1 ring-primary/30 border-primary/50 bg-primary/5' : ''}
                    >
                      <option value="">All Areas</option>
                      {areas.map((area) => (
                        <option key={area.id} value={area.id}>
                          {area.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="filter-village" className="text-xs">Village/Town</Label>
                    <Select
                      id="filter-village"
                      value={filters.villageId || ''}
                      onChange={(e) => {
                        const value = e.target.value
                        const newFilters = { ...filters }
                        if (value) {
                          newFilters.villageId = value
                        } else {
                          delete newFilters.villageId
                        }
                        onFiltersChange(newFilters)
                      }}
                      disabled={!filters.areaId || villages.length === 0}
                      className={filters.villageId ? 'ring-1 ring-primary/30 border-primary/50 bg-primary/5' : ''}
                    >
                      <option value="">All Villages</option>
                      {villages.map((village) => (
                        <option key={village.id} value={village.id}>
                          {village.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
              </div>

              {/* Section 6: Product & Data Source */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-primary" />
                  Product & Source
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="filter-product" className="text-xs">Product</Label>
                    <Select
                      id="filter-product"
                      value={filters.productId || ''}
                      onChange={(e) => {
                        const value = e.target.value
                        const newFilters = { ...filters }
                        if (value) {
                          newFilters.productId = value
                        } else {
                          delete newFilters.productId
                        }
                        onFiltersChange(newFilters)
                      }}
                      disabled={loadingProducts}
                      className={filters.productId ? 'ring-1 ring-primary/30 border-primary/50 bg-primary/5' : ''}
                    >
                      <option value="">All Products</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.product_name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="filter-data-source" className="text-xs">Data Source</Label>
                    <Select
                      id="filter-data-source"
                      value={filters.dataSource || ''}
                      onChange={(e) => {
                        const value = e.target.value
                        const newFilters = { ...filters }
                        if (value) {
                          newFilters.dataSource = value
                        } else {
                          delete newFilters.dataSource
                        }
                        onFiltersChange(newFilters)
                      }}
                      className={filters.dataSource ? 'ring-1 ring-primary/30 border-primary/50 bg-primary/5' : ''}
                    >
                      {dataSourceOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
              </div>

              {/* Section 7: Date Filters */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-primary" />
                  Date Filters
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Registration Date</Label>
                    <div className="grid gap-2 grid-cols-2">
                      <div className="space-y-1">
                        <Label htmlFor="filter-created-from" className="text-xs text-muted-foreground">From</Label>
                        <Input
                          id="filter-created-from"
                          type="date"
                          value={filters.createdFrom || ''}
                          onChange={(e) => updateFilter('createdFrom', e.target.value)}
                          className={filters.createdFrom ? 'ring-1 ring-primary/30 border-primary/50 bg-primary/5' : ''}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="filter-created-to" className="text-xs text-muted-foreground">To</Label>
                        <Input
                          id="filter-created-to"
                          type="date"
                          value={filters.createdTo || ''}
                          onChange={(e) => updateFilter('createdTo', e.target.value)}
                          className={filters.createdTo ? 'ring-1 ring-primary/30 border-primary/50 bg-primary/5' : ''}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Last Updated</Label>
                    <div className="grid gap-2 grid-cols-2">
                      <div className="space-y-1">
                        <Label htmlFor="filter-updated-from" className="text-xs text-muted-foreground">From</Label>
                        <Input
                          id="filter-updated-from"
                          type="date"
                          value={filters.updatedFrom || ''}
                          onChange={(e) => updateFilter('updatedFrom', e.target.value)}
                          className={filters.updatedFrom ? 'ring-1 ring-primary/30 border-primary/50 bg-primary/5' : ''}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="filter-updated-to" className="text-xs text-muted-foreground">To</Label>
                        <Input
                          id="filter-updated-to"
                          type="date"
                          value={filters.updatedTo || ''}
                          onChange={(e) => updateFilter('updatedTo', e.target.value)}
                          className={filters.updatedTo ? 'ring-1 ring-primary/30 border-primary/50 bg-primary/5' : ''}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                  disabled={!hasActiveFilters}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset Filters
                </Button>

                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setIsExpanded(false)}
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
