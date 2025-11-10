"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Phone, 
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  MoreVertical,
  Eye,
  Edit,
  Mail,
  MapPin,
  TrendingUp,
  Users,
  Building2,
  X,
  FilterX,
  Globe,
  Navigation,
  Home,
  UserCheck,
  CheckCircle2,
  PhoneMissed,
  PhoneOff,
  AlertCircle,
  Loader2
} from "lucide-react"
import { dealersAPI } from "@/lib/supabase/dealers"
import { LoadingPage } from "@/components/ui/loading-spinner"
import { ErrorMessage } from "@/components/ui/error-message"
import { supabase } from "@/lib/supabase/client"
import { format, formatDistanceToNow, differenceInDays, isPast, isToday } from "date-fns"
import { QuickCallModal } from "@/components/dealers/QuickCallModal"

const mockDealers = [
  {
    id: '1',
    code: 'D-001',
    businessName: 'Green Valley Traders',
    ownerName: 'Malik Aslam',
    phone: '0300-1111222',
    city: 'Faisalabad',
    relationshipStatus: 'active',
    relationshipScore: 85,
    performanceRating: 'excellent',
    lastContact: '3 days ago',
    nextContact: 'Tomorrow',
    salesLast6Months: 2450000
  },
  {
    id: '2',
    code: 'D-002',
    businessName: 'Agri Solutions',
    ownerName: 'Tariq Mahmood',
    phone: '0301-3334444',
    city: 'Multan',
    relationshipStatus: 'preferred',
    relationshipScore: 92,
    performanceRating: 'excellent',
    lastContact: '1 day ago',
    nextContact: 'In 5 days',
    salesLast6Months: 3200000
  },
  {
    id: '3',
    code: 'D-003',
    businessName: 'Farm Fresh Supplies',
    ownerName: 'Ali Raza',
    phone: '0303-5556666',
    city: 'Lahore',
    relationshipStatus: 'at_risk',
    relationshipScore: 35,
    performanceRating: 'below_average',
    lastContact: '15 days ago',
    nextContact: 'Overdue',
    salesLast6Months: 450000
  },
]

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  preferred: 'bg-blue-100 text-blue-800',
  at_risk: 'bg-red-100 text-red-800',
  platinum: 'bg-purple-100 text-purple-800',
  inactive: 'bg-gray-100 text-gray-800',
}

const performanceColors: Record<string, string> = {
  excellent: 'success',
  good: 'info',
  average: 'warning',
  below_average: 'warning',
  poor: 'destructive',
}

export default function DealersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [dealers, setDealers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [expandedDealer, setExpandedDealer] = useState<string | null>(null)
  const [touchpointFilter, setTouchpointFilter] = useState<string>('all') // New filter
  
  // Call modal state
  const [callModalOpen, setCallModalOpen] = useState(false)
  const [selectedDealerForCall, setSelectedDealerForCall] = useState<any>(null)
  
  // Loading states for actions
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [navigatingToDealerId, setNavigatingToDealerId] = useState<string | null>(null)
  
  // Sorting state
  const [sortColumn, setSortColumn] = useState<'code' | 'name' | 'owner' | 'city' | 'score' | 'status' | 'nextTouchpoint' | 'lastContact'>('code')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  
  // Advanced filters
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [zoneFilter, setZoneFilter] = useState<string>('all')
  const [areaFilter, setAreaFilter] = useState<string>('all')
  const [villageFilter, setVillageFilter] = useState<string>('all')
  const [fieldStaffFilter, setFieldStaffFilter] = useState<string>('all')
  const [tmoFilter, setTmoFilter] = useState<string>('all')
  const [cityFilter, setCityFilter] = useState<string>('all')

  // Fetch dealers with touchpoint data from database
  useEffect(() => {
    async function fetchDealers() {
      setLoading(true)
      try {
        // Fetch dealers
        const { data: dealersData, error: dealersError } = await dealersAPI.getAll()
        
        if (dealersError) {
          setError(dealersError.message)
          setLoading(false)
          return
        }

        // Fetch next touchpoints for all dealers
        const { data: touchpointsData } = await supabase
          .from('dealer_touchpoint_schedule')
          .select('dealer_id, touchpoint_type, next_scheduled_date, frequency, is_active')
          .eq('is_active', true)
          .order('next_scheduled_date', { ascending: true })

        // Fetch last call for each dealer
        const { data: lastCallsData } = await supabase
          .from('calls_log')
          .select('stakeholder_id, call_date, call_status, call_purpose')
          .eq('stakeholder_type', 'dealer')
          .order('call_date', { ascending: false })

        // Create maps for quick lookup
        const touchpointMap = new Map()
        touchpointsData?.forEach(tp => {
          if (!touchpointMap.has(tp.dealer_id)) {
            touchpointMap.set(tp.dealer_id, tp)
          }
        })

        const lastCallMap = new Map()
        lastCallsData?.forEach(call => {
          if (!lastCallMap.has(call.stakeholder_id)) {
            lastCallMap.set(call.stakeholder_id, call)
          }
        })

        // Enrich dealers with touchpoint and call data
        const enrichedDealers = (dealersData || []).map(dealer => ({
          ...dealer,
          nextTouchpoint: touchpointMap.get(dealer.id),
          lastCall: lastCallMap.get(dealer.id)
        }))

        setDealers(enrichedDealers)
      } catch (err: any) {
        setError(err.message || 'Failed to load dealers')
      } finally {
        setLoading(false)
      }
    }
    
    fetchDealers()
  }, [])

  if (loading) return <LoadingPage />
  if (error) return <ErrorMessage message={error} retry={() => window.location.reload()} />

  // Helper functions for touchpoint status
  const getTouchpointStatus = (touchpoint: any) => {
    if (!touchpoint || !touchpoint.next_scheduled_date) return 'none'
    
    const today = new Date().toISOString().split('T')[0]
    const scheduled = touchpoint.next_scheduled_date
    
    if (scheduled < today) return 'overdue'
    if (scheduled === today) return 'today'
    
    const daysUntil = differenceInDays(new Date(scheduled), new Date())
    if (daysUntil <= 7) return 'thisWeek'
    
    return 'future'
  }

  const formatTouchpointDate = (touchpoint: any) => {
    if (!touchpoint || !touchpoint.next_scheduled_date) return 'No touchpoint'
    
    const scheduled = new Date(touchpoint.next_scheduled_date)
    const today = new Date()
    const daysUntil = differenceInDays(scheduled, today)
    
    if (daysUntil < 0) {
      return `${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? 's' : ''} overdue`
    }
    if (daysUntil === 0) return 'Due today'
    if (daysUntil === 1) return 'Tomorrow'
    if (daysUntil <= 7) return `In ${daysUntil} days`
    
    return format(scheduled, 'MMM d')
  }

  const formatLastContact = (lastCall: any, dealer: any) => {
    const lastContactDate = lastCall?.call_date || dealer.last_contact_date
    if (!lastContactDate) return 'Never'
    
    return formatDistanceToNow(new Date(lastContactDate), { addSuffix: true })
  }

  const handleSort = (column: typeof sortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  // Extract unique values for filter options
  const uniqueZones = ['all', ...new Set(dealers.map(d => d.zone?.name).filter(Boolean))]
  const uniqueAreas = ['all', ...new Set(dealers.map(d => d.area?.name).filter(Boolean))]
  const uniqueVillages = ['all', ...new Set(dealers.map(d => d.village?.name).filter(Boolean))]
  const uniqueCities = ['all', ...new Set(dealers.map(d => d.city).filter(Boolean))]
  const uniqueFieldStaff = ['all', ...new Set(dealers.map(d => d.field_staff?.full_name).filter(Boolean))]
  const uniqueTMOs = ['all'] // TMO will be added when field is available

  const filteredDealers = dealers.filter(dealer => {
    const matchesSearch = 
      dealer.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dealer.owner_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dealer.phone?.includes(searchQuery) ||
      dealer.zone?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dealer.area?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || dealer.relationship_status === statusFilter
    const matchesZone = zoneFilter === 'all' || dealer.zone?.name === zoneFilter
    const matchesArea = areaFilter === 'all' || dealer.area?.name === areaFilter
    const matchesVillage = villageFilter === 'all' || dealer.village?.name === villageFilter
    const matchesCity = cityFilter === 'all' || dealer.city === cityFilter
    const matchesFieldStaff = fieldStaffFilter === 'all' || dealer.field_staff?.full_name === fieldStaffFilter
    const matchesTMO = tmoFilter === 'all' // TMO filter to be implemented when field is available
    
    // Touchpoint filtering
    const touchpointStatus = getTouchpointStatus(dealer.nextTouchpoint)
    const matchesTouchpoint = touchpointFilter === 'all' || touchpointStatus === touchpointFilter
    
    return matchesSearch && matchesStatus && matchesZone && matchesArea && 
           matchesVillage && matchesCity && matchesFieldStaff && matchesTMO && matchesTouchpoint
  })

  const sortedDealers = [...filteredDealers].sort((a, b) => {
    let comparison = 0
    
    switch (sortColumn) {
      case 'code':
        comparison = (a.dealer_code || '').localeCompare(b.dealer_code || '')
        break
      case 'name':
        comparison = (a.business_name || '').localeCompare(b.business_name || '')
        break
      case 'owner':
        comparison = (a.owner_name || '').localeCompare(b.owner_name || '')
        break
      case 'city':
        comparison = (a.zone?.name || '').localeCompare(b.zone?.name || '')
        break
      case 'score':
        comparison = (a.relationship_score || 0) - (b.relationship_score || 0)
        break
      case 'status':
        comparison = (a.relationship_status || '').localeCompare(b.relationship_status || '')
        break
      case 'nextTouchpoint':
        const aDate = a.nextTouchpoint?.next_scheduled_date || '9999-12-31'
        const bDate = b.nextTouchpoint?.next_scheduled_date || '9999-12-31'
        comparison = aDate.localeCompare(bDate)
        break
      case 'lastContact':
        const aLast = a.lastCall?.call_date || a.last_contact_date || '1900-01-01'
        const bLast = b.lastCall?.call_date || b.last_contact_date || '1900-01-01'
        comparison = aLast.localeCompare(bLast)
        break
    }
    
    return sortDirection === 'asc' ? comparison : -comparison
  })

  const statusCounts = {
    all: dealers.length,
    active: dealers.filter(d => d.relationship_status === 'active').length,
    preferred: dealers.filter(d => d.relationship_status === 'preferred').length,
    at_risk: dealers.filter(d => d.relationship_status === 'at_risk').length,
    inactive: dealers.filter(d => d.relationship_status === 'inactive').length,
  }

  // Touchpoint counts for quick filter tabs
  const touchpointCounts = {
    all: dealers.length,
    overdue: dealers.filter(d => getTouchpointStatus(d.nextTouchpoint) === 'overdue').length,
    today: dealers.filter(d => getTouchpointStatus(d.nextTouchpoint) === 'today').length,
    thisWeek: dealers.filter(d => getTouchpointStatus(d.nextTouchpoint) === 'thisWeek').length,
    future: dealers.filter(d => getTouchpointStatus(d.nextTouchpoint) === 'future').length,
    none: dealers.filter(d => getTouchpointStatus(d.nextTouchpoint) === 'none').length,
  }

  // Count active filters
  const activeFiltersCount = [
    zoneFilter !== 'all',
    areaFilter !== 'all',
    villageFilter !== 'all',
    cityFilter !== 'all',
    fieldStaffFilter !== 'all',
    tmoFilter !== 'all'
  ].filter(Boolean).length

  // Clear all filters
  const clearAllFilters = () => {
    setZoneFilter('all')
    setAreaFilter('all')
    setVillageFilter('all')
    setCityFilter('all')
    setFieldStaffFilter('all')
    setTmoFilter('all')
    setStatusFilter('all')
    setSearchQuery('')
  }

  // Navigate to dealer with loading state
  const handleNavigateToDealer = (dealerId: string) => {
    setNavigatingToDealerId(dealerId)
    // Navigation happens immediately, loading state clears on page change
    window.location.href = `/crm/dealers/${dealerId}`
  }

  // Open call modal for dealer
  const openCallModal = (dealer: any) => {
    setSelectedDealerForCall(dealer)
    setCallModalOpen(true)
  }

  // Handle successful call logging
  const handleCallSuccess = async () => {
    setLoadingAction(null)
    // Reload dealers to get updated touchpoint data
    const { data: dealersData } = await dealersAPI.getAll()
    
    if (dealersData) {
      // Fetch updated touchpoints and calls
      const { data: touchpointsData } = await supabase
        .from('dealer_touchpoint_schedule')
        .select('dealer_id, touchpoint_type, next_scheduled_date, frequency, is_active')
        .eq('is_active', true)
        .order('next_scheduled_date', { ascending: true })

      const { data: lastCallsData } = await supabase
        .from('calls_log')
        .select('stakeholder_id, call_date, call_status, call_purpose')
        .eq('stakeholder_type', 'dealer')
        .order('call_date', { ascending: false })

      const touchpointMap = new Map()
      touchpointsData?.forEach(tp => {
        if (!touchpointMap.has(tp.dealer_id)) {
          touchpointMap.set(tp.dealer_id, tp)
        }
      })

      const lastCallMap = new Map()
      lastCallsData?.forEach(call => {
        if (!lastCallMap.has(call.stakeholder_id)) {
          lastCallMap.set(call.stakeholder_id, call)
        }
      })

      const enrichedDealers = dealersData.map(dealer => ({
        ...dealer,
        nextTouchpoint: touchpointMap.get(dealer.id),
        lastCall: lastCallMap.get(dealer.id)
      }))

      setDealers(enrichedDealers)
    }
  }

  return (
    <div className="space-y-6">
      {/* Professional Loading Overlay - Blocks all interactions */}
      {(loadingAction || navigatingToDealerId) && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-lg shadow-2xl p-8 flex flex-col items-center gap-4 min-w-[300px] animate-in zoom-in-95 duration-200">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                {navigatingToDealerId || loadingAction?.includes('view-') ? 'Loading Details...' :
                 loadingAction?.includes('edit-') ? 'Opening Editor...' :
                 loadingAction?.includes('sales-') ? 'Loading Sales...' :
                 loadingAction?.includes('call-') ? 'Opening Call Log...' :
                 'Processing...'}
              </h3>
              <p className="text-sm text-muted-foreground">Please wait a moment</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dealers</h1>
          <p className="text-muted-foreground">Manage your dealer relationships</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Link href="/crm/import/dealers">
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Import Dealers
            </Button>
          </Link>
          <Link href="/crm/dealers/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Dealer
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '0ms' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Dealers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dealers.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Active partnerships</p>
          </CardContent>
        </Card>
        <Card className="animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '100ms' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">At Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {dealers.filter(d => d.relationshipStatus === 'at_risk').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Require attention</p>
          </CardContent>
        </Card>
        <Card className="animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '200ms' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {dealers.filter(d => d.nextContact === 'Overdue').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Need follow-up</p>
          </CardContent>
        </Card>
        <Card className="animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '300ms' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales (6M)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              PKR {(dealers.reduce((sum, d) => sum + d.salesLast6Months, 0) / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-muted-foreground mt-1">Last 6 months</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Dealers</CardTitle>
                <CardDescription>Total {sortedDealers.length} dealers found</CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative w-80">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search dealers..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="relative">
                      <Filter className="h-4 w-4" />
                      {activeFiltersCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-xs text-primary-foreground flex items-center justify-center">
                          {activeFiltersCount}
                        </span>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>Filter Dealers</SheetTitle>
                      <SheetDescription>
                        Apply filters to narrow down your dealer list
                      </SheetDescription>
                    </SheetHeader>
                    
                    <div className="space-y-6 py-6">
                      {/* Location Filters */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Globe className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold text-lg">Location</h3>
                        </div>
                        <Separator />

                        {/* Zone */}
                        <div className="space-y-2">
                          <Label htmlFor="zone-filter" className="text-sm font-medium flex items-center gap-2">
                            <Navigation className="h-4 w-4 text-muted-foreground" />
                            Zone
                          </Label>
                          <Select value={zoneFilter} onValueChange={setZoneFilter}>
                            <SelectTrigger id="zone-filter">
                              <SelectValue placeholder="Select zone" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Zones ({uniqueZones.length - 1})</SelectItem>
                              {uniqueZones.filter(z => z !== 'all').length === 0 ? (
                                <SelectItem value="none" disabled>No zones available</SelectItem>
                              ) : (
                                uniqueZones.filter(z => z !== 'all').sort().map(zone => (
                                  <SelectItem key={zone} value={zone}>
                                    {zone} ({dealers.filter(d => d.zone?.name === zone).length})
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Area */}
                        <div className="space-y-2">
                          <Label htmlFor="area-filter" className="text-sm font-medium flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            Area
                          </Label>
                          <Select value={areaFilter} onValueChange={setAreaFilter}>
                            <SelectTrigger id="area-filter">
                              <SelectValue placeholder="Select area" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Areas ({uniqueAreas.length - 1})</SelectItem>
                              {uniqueAreas.filter(a => a !== 'all').length === 0 ? (
                                <SelectItem value="none" disabled>No areas available</SelectItem>
                              ) : (
                                uniqueAreas.filter(a => a !== 'all').sort().map(area => (
                                  <SelectItem key={area} value={area}>
                                    {area} ({dealers.filter(d => d.area?.name === area).length})
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* City */}
                        <div className="space-y-2">
                          <Label htmlFor="city-filter" className="text-sm font-medium flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            City
                          </Label>
                          <Select value={cityFilter} onValueChange={setCityFilter}>
                            <SelectTrigger id="city-filter">
                              <SelectValue placeholder="Select city" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Cities ({uniqueCities.length - 1})</SelectItem>
                              {uniqueCities.filter(c => c !== 'all').sort().map(city => (
                                <SelectItem key={city} value={city}>
                                  {city} ({dealers.filter(d => d.city === city).length})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Village */}
                        <div className="space-y-2">
                          <Label htmlFor="village-filter" className="text-sm font-medium flex items-center gap-2">
                            <Home className="h-4 w-4 text-muted-foreground" />
                            Village
                          </Label>
                          <Select value={villageFilter} onValueChange={setVillageFilter}>
                            <SelectTrigger id="village-filter">
                              <SelectValue placeholder="Select village" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Villages ({uniqueVillages.length - 1})</SelectItem>
                              {uniqueVillages.filter(v => v !== 'all').length === 0 ? (
                                <SelectItem value="none" disabled>No villages available</SelectItem>
                              ) : (
                                uniqueVillages.filter(v => v !== 'all').sort().map(village => (
                                  <SelectItem key={village} value={village}>
                                    {village} ({dealers.filter(d => d.village?.name === village).length})
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Team Filters */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold text-lg">Team Assignment</h3>
                        </div>
                        <Separator />

                        {/* Field Staff */}
                        <div className="space-y-2">
                          <Label htmlFor="field-staff-filter" className="text-sm font-medium flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            Field Staff
                          </Label>
                          <Select value={fieldStaffFilter} onValueChange={setFieldStaffFilter}>
                            <SelectTrigger id="field-staff-filter">
                              <SelectValue placeholder="Select field staff" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Field Staff ({uniqueFieldStaff.length - 1})</SelectItem>
                              {uniqueFieldStaff.filter(f => f !== 'all').length === 0 ? (
                                <SelectItem value="none" disabled>No field staff assigned yet</SelectItem>
                              ) : (
                                uniqueFieldStaff.filter(f => f !== 'all').sort().map(staff => (
                                  <SelectItem key={staff} value={staff}>
                                    {staff} ({dealers.filter(d => d.field_staff?.full_name === staff).length})
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* TMO */}
                        <div className="space-y-2">
                          <Label htmlFor="tmo-filter" className="text-sm font-medium flex items-center gap-2">
                            <UserCheck className="h-4 w-4 text-muted-foreground" />
                            TMO (Territory Marketing Officer)
                          </Label>
                          <Select value={tmoFilter} onValueChange={setTmoFilter}>
                            <SelectTrigger id="tmo-filter">
                              <SelectValue placeholder="Select TMO" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All TMOs ({uniqueTMOs.length - 1})</SelectItem>
                              {uniqueTMOs.filter(t => t !== 'all').length === 0 ? (
                                <SelectItem value="none" disabled>No TMOs assigned yet</SelectItem>
                              ) : (
                                uniqueTMOs.filter(t => t !== 'all').sort().map(tmo => (
                                  <SelectItem key={tmo} value={tmo}>
                                    {tmo} ({dealers.filter(d => d.assigned_tmo === tmo).length})
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Active Filters Summary */}
                      {activeFiltersCount > 0 && (
                        <div className="space-y-3">
                          <Separator />
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium">
                              {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} active
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={clearAllFilters}
                              className="h-8"
                            >
                              <FilterX className="mr-2 h-4 w-4" />
                              Clear All
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {zoneFilter !== 'all' && (
                              <Badge variant="secondary" className="gap-1">
                                Zone: {zoneFilter}
                                <X className="h-3 w-3 cursor-pointer" onClick={() => setZoneFilter('all')} />
                              </Badge>
                            )}
                            {areaFilter !== 'all' && (
                              <Badge variant="secondary" className="gap-1">
                                Area: {areaFilter}
                                <X className="h-3 w-3 cursor-pointer" onClick={() => setAreaFilter('all')} />
                              </Badge>
                            )}
                            {cityFilter !== 'all' && (
                              <Badge variant="secondary" className="gap-1">
                                City: {cityFilter}
                                <X className="h-3 w-3 cursor-pointer" onClick={() => setCityFilter('all')} />
                              </Badge>
                            )}
                            {villageFilter !== 'all' && (
                              <Badge variant="secondary" className="gap-1">
                                Village: {villageFilter}
                                <X className="h-3 w-3 cursor-pointer" onClick={() => setVillageFilter('all')} />
                              </Badge>
                            )}
                            {fieldStaffFilter !== 'all' && (
                              <Badge variant="secondary" className="gap-1">
                                Field Staff: {fieldStaffFilter}
                                <X className="h-3 w-3 cursor-pointer" onClick={() => setFieldStaffFilter('all')} />
                              </Badge>
                            )}
                            {tmoFilter !== 'all' && (
                              <Badge variant="secondary" className="gap-1">
                                TMO: {tmoFilter}
                                <X className="h-3 w-3 cursor-pointer" onClick={() => setTmoFilter('all')} />
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <SheetFooter className="flex gap-2">
                      <Button variant="outline" onClick={() => setFiltersOpen(false)} className="flex-1">
                        Close
                      </Button>
                      <Button onClick={() => setFiltersOpen(false)} className="flex-1">
                        Apply Filters
                      </Button>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            {/* Active Filters Display */}
            {activeFiltersCount > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {zoneFilter !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Zone: {zoneFilter}
                    <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => setZoneFilter('all')} />
                  </Badge>
                )}
                {areaFilter !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Area: {areaFilter}
                    <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => setAreaFilter('all')} />
                  </Badge>
                )}
                {cityFilter !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    City: {cityFilter}
                    <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => setCityFilter('all')} />
                  </Badge>
                )}
                {villageFilter !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Village: {villageFilter}
                    <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => setVillageFilter('all')} />
                  </Badge>
                )}
                {fieldStaffFilter !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Field Staff: {fieldStaffFilter}
                    <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => setFieldStaffFilter('all')} />
                  </Badge>
                )}
                {tmoFilter !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    TMO: {tmoFilter}
                    <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => setTmoFilter('all')} />
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="h-7 text-xs"
                >
                  <FilterX className="mr-1 h-3 w-3" />
                  Clear All
                </Button>
              </div>
            )}

            {/* Touchpoint Filter Tabs */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Filter by Next Touchpoint:</div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                <Button
                  variant={touchpointFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTouchpointFilter('all')}
                >
                  All Dealers <Badge variant="secondary" className="ml-2">{touchpointCounts.all}</Badge>
                </Button>
                <Button
                  variant={touchpointFilter === 'overdue' ? 'destructive' : 'outline'}
                  size="sm"
                  onClick={() => setTouchpointFilter('overdue')}
                  className={touchpointFilter === 'overdue' ? '' : 'border-red-300 text-red-700 hover:bg-red-50'}
                >
                  🔴 Overdue <Badge variant="secondary" className="ml-2">{touchpointCounts.overdue}</Badge>
                </Button>
                <Button
                  variant={touchpointFilter === 'today' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTouchpointFilter('today')}
                  className={touchpointFilter === 'today' ? 'bg-amber-500 hover:bg-amber-600' : 'border-amber-300 text-amber-700 hover:bg-amber-50'}
                >
                  🟡 Due Today <Badge variant="secondary" className="ml-2">{touchpointCounts.today}</Badge>
                </Button>
                <Button
                  variant={touchpointFilter === 'thisWeek' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTouchpointFilter('thisWeek')}
                  className={touchpointFilter === 'thisWeek' ? 'bg-blue-500 hover:bg-blue-600' : 'border-blue-300 text-blue-700 hover:bg-blue-50'}
                >
                  📅 This Week <Badge variant="secondary" className="ml-2">{touchpointCounts.thisWeek}</Badge>
                </Button>
                <Button
                  variant={touchpointFilter === 'future' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTouchpointFilter('future')}
                >
                  ⚪ Future <Badge variant="secondary" className="ml-2">{touchpointCounts.future}</Badge>
                </Button>
                <Button
                  variant={touchpointFilter === 'none' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTouchpointFilter('none')}
                  className="border-gray-300 text-gray-600"
                >
                  No Touchpoint <Badge variant="secondary" className="ml-2">{touchpointCounts.none}</Badge>
                </Button>
              </div>
            </div>

            {/* Status Filter Tabs */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Filter by Relationship Status:</div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                >
                  All <Badge variant="secondary" className="ml-2">{statusCounts.all}</Badge>
                </Button>
              <Button
                variant={statusFilter === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('active')}
              >
                Active <Badge variant="secondary" className="ml-2">{statusCounts.active}</Badge>
              </Button>
              <Button
                variant={statusFilter === 'preferred' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('preferred')}
              >
                Preferred <Badge variant="secondary" className="ml-2">{statusCounts.preferred}</Badge>
              </Button>
              <Button
                variant={statusFilter === 'at_risk' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('at_risk')}
              >
                At Risk <Badge variant="secondary" className="ml-2">{statusCounts.at_risk}</Badge>
              </Button>
              <Button
                variant={statusFilter === 'inactive' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('inactive')}
              >
                Inactive <Badge variant="secondary" className="ml-2">{statusCounts.inactive}</Badge>
              </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted sticky top-0">
                <TableRow>
                  <TableHead>
                    <button
                      onClick={() => handleSort('code')}
                      className="flex items-center gap-2 hover:text-primary transition-colors group"
                    >
                      Code
                      {sortColumn === 'code' ? (
                        sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ArrowUpDown className="h-4 w-4 opacity-0 group-hover:opacity-50" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center gap-2 hover:text-primary transition-colors group"
                    >
                      Business Name
                      {sortColumn === 'name' ? (
                        sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ArrowUpDown className="h-4 w-4 opacity-0 group-hover:opacity-50" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort('owner')}
                      className="flex items-center gap-2 hover:text-primary transition-colors group"
                    >
                      Owner
                      {sortColumn === 'owner' ? (
                        sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ArrowUpDown className="h-4 w-4 opacity-0 group-hover:opacity-50" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort('city')}
                      className="flex items-center gap-2 hover:text-primary transition-colors group"
                    >
                      Zone
                      {sortColumn === 'city' ? (
                        sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ArrowUpDown className="h-4 w-4 opacity-0 group-hover:opacity-50" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort('status')}
                      className="flex items-center gap-2 hover:text-primary transition-colors group"
                    >
                      Status
                      {sortColumn === 'status' ? (
                        sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ArrowUpDown className="h-4 w-4 opacity-0 group-hover:opacity-50" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort('score')}
                      className="flex items-center gap-2 hover:text-primary transition-colors group"
                    >
                      Score
                      {sortColumn === 'score' ? (
                        sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ArrowUpDown className="h-4 w-4 opacity-0 group-hover:opacity-50" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort('nextTouchpoint')}
                      className="flex items-center gap-2 hover:text-primary transition-colors group"
                    >
                      Next Touchpoint
                      {sortColumn === 'nextTouchpoint' ? (
                        sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ArrowUpDown className="h-4 w-4 opacity-0 group-hover:opacity-50" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort('lastContact')}
                      className="flex items-center gap-2 hover:text-primary transition-colors group"
                    >
                      Last Contact
                      {sortColumn === 'lastContact' ? (
                        sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ArrowUpDown className="h-4 w-4 opacity-0 group-hover:opacity-50" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead className="text-right w-24 min-w-[96px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedDealers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="h-12 w-12 text-muted-foreground/50" />
                        <p className="text-lg font-medium text-muted-foreground">No dealers found</p>
                        <p className="text-sm text-muted-foreground">
                          {searchQuery || statusFilter !== 'all' 
                            ? 'Try adjusting your filters or search query'
                            : 'Get started by adding your first dealer'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedDealers.map((dealer, index) => (
                    <TableRow 
                      key={dealer.id} 
                      className={`group hover:bg-muted/50 cursor-pointer 
                                 transition-colors duration-150
                                 animate-in fade-in slide-in-from-bottom-2
                                 border-l-2 border-l-transparent hover:border-l-primary
                                 ${(navigatingToDealerId === dealer.id || loadingAction?.includes(dealer.id)) 
                                   ? 'opacity-50 pointer-events-none' 
                                   : ''}`}
                      style={{ animationDelay: `${index * 30}ms`, animationFillMode: 'backwards' }}
                      onClick={() => handleNavigateToDealer(dealer.id)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-xs">
                            {(navigatingToDealerId === dealer.id || loadingAction?.includes(dealer.id)) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              dealer.dealer_code?.substring(0, 2) || 'D'
                            )}
                          </div>
                          <span className="font-mono font-medium text-foreground">
                            {dealer.dealer_code || 'N/A'}
                            {(navigatingToDealerId === dealer.id || loadingAction?.includes(dealer.id)) && (
                              <span className="ml-2 text-xs text-muted-foreground">Loading...</span>
                            )}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">{dealer.business_name || 'N/A'}</span>
                          {dealer.business_type && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {dealer.business_type}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-foreground">{dealer.owner_name || 'N/A'}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {dealer.phone && (
                            <a 
                              href={`tel:${dealer.phone}`} 
                              className="text-sm flex items-center gap-1 text-foreground hover:text-primary transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Phone className="h-3 w-3" />
                              {dealer.phone}
                            </a>
                          )}
                          {dealer.email && (
                            <a 
                              href={`mailto:${dealer.email}`}
                              className="text-xs text-muted-foreground flex items-center gap-1 hover:text-primary transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Mail className="h-3 w-3" />
                              {dealer.email}
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {dealer.zone?.name ? (
                          <span className="text-sm flex items-center gap-1">
                            <Navigation className="h-3 w-3 text-muted-foreground" />
                            {dealer.zone.name}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusColors[dealer.relationship_status] || 'bg-gray-100 text-gray-800'}`}>
                          {dealer.relationship_status?.replace('_', ' ').toUpperCase() || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                dealer.relationship_score >= 70 ? 'bg-green-500' :
                                dealer.relationship_score >= 40 ? 'bg-amber-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${dealer.relationship_score || 0}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold min-w-[30px]">
                            {dealer.relationship_score || 0}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {dealer.performance_rating ? (
                          <Badge variant={performanceColors[dealer.performance_rating] as any} className="text-xs">
                            {dealer.performance_rating.replace('_', ' ')}
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      {/* Next Touchpoint Column */}
                      <TableCell onClick={(e) => e.stopPropagation()} className="overflow-hidden">
                        {dealer.nextTouchpoint ? (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              {getTouchpointStatus(dealer.nextTouchpoint) === 'overdue' && (
                                <Badge variant="destructive" className="text-xs animate-pulse">
                                  🔴 {formatTouchpointDate(dealer.nextTouchpoint)}
                                </Badge>
                              )}
                              {getTouchpointStatus(dealer.nextTouchpoint) === 'today' && (
                                <Badge className="bg-amber-500 text-white text-xs">
                                  🟡 Due Today
                                </Badge>
                              )}
                              {getTouchpointStatus(dealer.nextTouchpoint) === 'thisWeek' && (
                                <Badge className="bg-blue-500 text-white text-xs">
                                  {formatTouchpointDate(dealer.nextTouchpoint)}
                                </Badge>
                              )}
                              {getTouchpointStatus(dealer.nextTouchpoint) === 'future' && (
                                <Badge variant="outline" className="text-xs">
                                  {formatTouchpointDate(dealer.nextTouchpoint)}
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground capitalize">
                              {dealer.nextTouchpoint.touchpoint_type?.replace(/_/g, ' ')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">No touchpoint</span>
                        )}
                      </TableCell>
                      {/* Last Contact Column */}
                      <TableCell onClick={(e) => e.stopPropagation()} className="max-w-[200px]">
                        <div className="flex items-center gap-2">
                          {dealer.lastCall ? (
                            <>
                              {dealer.lastCall.call_status === 'completed' && (
                                <div className="flex items-center justify-center w-5 h-5 flex-shrink-0 rounded-full bg-green-100">
                                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                                </div>
                              )}
                              {dealer.lastCall.call_status === 'no_answer' && (
                                <div className="flex items-center justify-center w-5 h-5 flex-shrink-0 rounded-full bg-amber-100">
                                  <PhoneMissed className="h-3 w-3 text-amber-600" />
                                </div>
                              )}
                              {dealer.lastCall.call_status === 'busy' && (
                                <div className="flex items-center justify-center w-5 h-5 flex-shrink-0 rounded-full bg-orange-100">
                                  <PhoneOff className="h-3 w-3 text-orange-600" />
                                </div>
                              )}
                              {dealer.lastCall.call_status === 'callback_requested' && (
                                <div className="flex items-center justify-center w-5 h-5 flex-shrink-0 rounded-full bg-blue-100">
                                  <Phone className="h-3 w-3 text-blue-600" />
                                </div>
                              )}
                              {!['completed', 'no_answer', 'busy', 'callback_requested'].includes(dealer.lastCall.call_status) && (
                                <div className="flex items-center justify-center w-5 h-5 flex-shrink-0 rounded-full bg-gray-100">
                                  <Phone className="h-3 w-3 text-gray-600" />
                                </div>
                              )}
                              <div className="flex flex-col min-w-0 flex-1">
                                <span className="text-sm font-medium truncate">
                                  {formatLastContact(dealer.lastCall, dealer)}
                                </span>
                                <span className="text-xs text-muted-foreground capitalize truncate">
                                  {dealer.lastCall.call_purpose?.replace(/_/g, ' ')}
                                </span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center justify-center w-5 h-5 flex-shrink-0 rounded-full bg-gray-100">
                                <AlertCircle className="h-3 w-3 text-gray-400" />
                              </div>
                              <div className="flex flex-col min-w-0 flex-1">
                                <span className="text-sm text-muted-foreground truncate">Never contacted</span>
                                <span className="text-xs text-muted-foreground truncate">Needs first call</span>
                              </div>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right w-24 min-w-[96px]" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="hover:bg-muted transition-colors"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="min-w-[180px]" sideOffset={5}>
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation()
                                setLoadingAction(`view-${dealer.id}`)
                                handleNavigateToDealer(dealer.id)
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation()
                                setLoadingAction(`edit-${dealer.id}`)
                                setNavigatingToDealerId(dealer.id)
                                window.location.href = `/crm/dealers/${dealer.id}/edit`
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Dealer
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation()
                                setLoadingAction(`sales-${dealer.id}`)
                                setNavigatingToDealerId(dealer.id)
                                window.location.href = `/crm/dealers/${dealer.id}/sales`
                              }}
                            >
                              <TrendingUp className="mr-2 h-4 w-4" />
                              View Sales
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {dealer.phone && (
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openCallModal(dealer)
                                }}
                              >
                                <Phone className="mr-2 h-4 w-4" />
                                Log Call
                              </DropdownMenuItem>
                            )}
                            {dealer.email && (
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  window.location.href = `mailto:${dealer.email}`
                                }}
                              >
                                <Mail className="mr-2 h-4 w-4" />
                                Send Email
                              </DropdownMenuItem>
                            )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Call Logging Modal */}
      {selectedDealerForCall && (
        <QuickCallModal
          open={callModalOpen}
          onOpenChange={setCallModalOpen}
          dealerId={selectedDealerForCall.id}
          touchpoint={selectedDealerForCall.nextTouchpoint || {
            id: null,
            touchpoint_type: 'general_inquiry',
            dealer: {
              business_name: selectedDealerForCall.business_name
            }
          }}
          onSuccess={handleCallSuccess}
        />
      )}
    </div>
  )
}
