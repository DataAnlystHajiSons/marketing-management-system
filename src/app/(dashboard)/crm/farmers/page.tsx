"use client"

import { useState, useEffect, useRef } from "react"
import { useFarmers } from "@/hooks/use-farmers"
import { LoadingPage } from "@/components/ui/loading-spinner"
import { ErrorMessage } from "@/components/ui/error-message"
import { farmersAPI } from "@/lib/supabase/farmers"
import { farmerEngagementsAPI } from "@/lib/supabase/farmer-engagements"
import { LogActivityModal } from "@/components/crm/log-activity-modal"
import { FarmersAdvancedFilters, type FarmersFilters } from "@/components/crm/farmers-advanced-filters"
import { FarmersDataTable } from "@/components/crm/farmers-data-table"
import { FarmersTableHeader } from "@/components/crm/farmers-table-header"

export default function FarmersPage() {
  const [filters, setFilters] = useState<FarmersFilters>({})
  const [activityModalOpen, setActivityModalOpen] = useState(false)
  const [selectedFarmer, setSelectedFarmer] = useState<{ id: string; name: string } | null>(null)
  const [farmersWithEngagements, setFarmersWithEngagements] = useState<any[]>([])
  const [loadingEngagements, setLoadingEngagements] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [tablePreferences, setTablePreferences] = useState<any>(null)
  const [preferencesControls, setPreferencesControls] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(50)
  const [highlightedRowId, setHighlightedRowId] = useState<string | null>(null)
  const [selectedFarmerIds, setSelectedFarmerIds] = useState<string[]>([])
  const tableScrollContainerRef = useRef<HTMLDivElement>(null)
  const scrollPositionRef = useRef<number>(0)
  const shouldRestoreScroll = useRef<boolean>(false)
  const isInitialLoad = useRef<boolean>(true)
  const { farmers, loading, error, refresh: fetchFarmers} = useFarmers()

  // Fetch engagements for all farmers
  useEffect(() => {
    async function fetchEngagements() {
      if (farmers.length === 0) return
      
      setLoadingEngagements(true)
      const farmersWithEngData = await Promise.all(
        farmers.map(async (farmer) => {
          const { data: engagements } = await farmerEngagementsAPI.getByFarmerId(farmer.id, true)
          return {
            ...farmer,
            engagements: engagements || [],
            activeEngagementsCount: engagements?.length || 0,
          }
        })
      )
      setFarmersWithEngagements(farmersWithEngData)
      setLoadingEngagements(false)
      
      // Mark initial load as complete
      if (isInitialLoad.current) {
        isInitialLoad.current = false
      }
    }

    fetchEngagements()
  }, [farmers])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filters, searchQuery])

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete farmer "${name}"?`)) return
    
    const { error } = await farmersAPI.delete(id)
    if (error) {
      alert('Error deleting farmer: ' + error.message)
    } else {
      alert('Farmer deleted successfully')
      fetchFarmers()
    }
  }

  function handleLogActivity(farmerId: string, farmerName: string) {
    setHighlightedRowId(farmerId) // Highlight the row
    setSelectedFarmer({ id: farmerId, name: farmerName })
    setActivityModalOpen(true)
  }

  function handleActivitySuccess() {
    // Save current TABLE scroll position (not window scroll!)
    if (tableScrollContainerRef.current) {
      scrollPositionRef.current = tableScrollContainerRef.current.scrollTop
      shouldRestoreScroll.current = true
    }
    
    setActivityModalOpen(false) // Close modal automatically
    setSelectedFarmer(null) // Clear selection
    fetchFarmers()
  }
  
  // Restore TABLE scroll position after engagements data is refreshed
  useEffect(() => {
    if (shouldRestoreScroll.current && !loadingEngagements && farmersWithEngagements.length > 0) {
      // Restore TABLE scroll position
      requestAnimationFrame(() => {
        if (tableScrollContainerRef.current) {
          tableScrollContainerRef.current.scrollTop = scrollPositionRef.current
        }
        shouldRestoreScroll.current = false
        scrollPositionRef.current = 0
      })
    }
  }, [farmersWithEngagements, loadingEngagements])
  
  // Only show loading page on initial load, not on refresh
  if (loading && isInitialLoad.current) return <LoadingPage />
  if (error) return <ErrorMessage message={error} retry={fetchFarmers} />

  // Apply filters
  const filteredFarmers = farmersWithEngagements.filter(farmer => {
    // Search filter (from header)
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch = 
        farmer.full_name.toLowerCase().includes(searchLower) ||
        farmer.phone.includes(searchLower) ||
        farmer.farmer_code?.toLowerCase().includes(searchLower) ||
        farmer.village?.name?.toLowerCase().includes(searchLower)
      if (!matchesSearch) return false
    }
    
    // Advanced search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const matchesSearch = 
        farmer.full_name.toLowerCase().includes(searchLower) ||
        farmer.phone.includes(searchLower) ||
        farmer.farmer_code?.toLowerCase().includes(searchLower) ||
        farmer.village?.name?.toLowerCase().includes(searchLower)
      if (!matchesSearch) return false
    }

    // Lead stage filter (check engagements)
    if (filters.leadStage) {
      const hasStage = farmer.engagements?.some((eng: any) => eng.lead_stage === filters.leadStage)
      if (!hasStage) return false
    }

    // Lead quality filter (check engagements)
    if (filters.leadQuality) {
      const hasQuality = farmer.engagements?.some((eng: any) => eng.lead_quality === filters.leadQuality)
      if (!hasQuality) return false
    }

    // Customer status filter
    if (filters.isCustomer !== undefined && filters.isCustomer !== '') {
      if (farmer.is_customer !== filters.isCustomer) return false
    }

    // TMO filter
    if (filters.assignedTMO && farmer.assigned_tmo_id !== filters.assignedTMO) return false

    // Field Staff filter
    if (filters.assignedFieldStaff && farmer.assigned_field_staff_id !== filters.assignedFieldStaff) return false

    // Dealer filter
    if (filters.assignedDealer && farmer.assigned_dealer_id !== filters.assignedDealer) return false

    // Score range filter
    if (filters.minScore !== undefined && farmer.lead_score < filters.minScore) return false
    if (filters.maxScore !== undefined && farmer.lead_score > filters.maxScore) return false

    // Land size filter
    if (filters.minLandSize !== undefined && (farmer.land_size_acres || 0) < filters.minLandSize) return false
    if (filters.maxLandSize !== undefined && (farmer.land_size_acres || 0) > filters.maxLandSize) return false

    // Hierarchical location filters
    if (filters.zoneId && farmer.zone_id !== filters.zoneId) return false
    if (filters.areaId && farmer.area_id !== filters.areaId) return false
    if (filters.villageId && farmer.village_id !== filters.villageId) return false

    // City filter (legacy)
    if (filters.city && (!farmer.city || !farmer.city.toLowerCase().includes(filters.city.toLowerCase()))) return false

    // District filter (legacy)
    if (filters.district && (!farmer.district || !farmer.district.toLowerCase().includes(filters.district.toLowerCase()))) return false

    // Data source filter (check engagements)
    if (filters.dataSource) {
      if (!farmer.engagements || farmer.engagements.length === 0) return false
      const hasMatchingSource = farmer.engagements.some((eng: any) => eng.data_source === filters.dataSource)
      if (!hasMatchingSource) return false
    }

    // Product filter (check engagements)
    if (filters.productId) {
      if (!farmer.engagements || farmer.engagements.length === 0) return false
      const hasMatchingProduct = farmer.engagements.some((eng: any) => eng.product_id === filters.productId)
      if (!hasMatchingProduct) return false
    }

    // Registration date filter (created_at)
    if (filters.createdFrom) {
      const createdDate = new Date(farmer.created_at)
      const fromDate = new Date(filters.createdFrom)
      if (createdDate < fromDate) return false
    }
    if (filters.createdTo) {
      const createdDate = new Date(farmer.created_at)
      const toDate = new Date(filters.createdTo)
      toDate.setHours(23, 59, 59, 999) // End of day
      if (createdDate > toDate) return false
    }

    // Last updated date filter (updated_at)
    if (filters.updatedFrom && farmer.updated_at) {
      const updatedDate = new Date(farmer.updated_at)
      const fromDate = new Date(filters.updatedFrom)
      if (updatedDate < fromDate) return false
    }
    if (filters.updatedTo && farmer.updated_at) {
      const updatedDate = new Date(farmer.updated_at)
      const toDate = new Date(filters.updatedTo)
      toDate.setHours(23, 59, 59, 999) // End of day
      if (updatedDate > toDate) return false
    }

    return true
  })

  // Count active filters
  const activeFiltersCount = Object.keys(filters).filter(key => {
    const value = filters[key as keyof FarmersFilters]
    return value !== undefined && value !== '' && value !== null
  }).length

  // Handle quick filters
  const handleQuickFilter = (filterValue: string) => {
    switch (filterValue) {
      case 'hot':
        setFilters({ ...filters, leadQuality: 'hot' })
        break
      case 'attendees':
        setFilters({ ...filters, dataSource: 'fm_attendees' })
        break
      case 'new':
        // Filter for farmers added in last 7 days
        setFilters({ ...filters, leadStage: 'new' })
        break
      case 'customers':
        setFilters({ ...filters, isCustomer: true })
        break
    }
  }

  // Pagination calculations
  const totalPages = Math.ceil(filteredFarmers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedFarmers = filteredFarmers.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items)
    setCurrentPage(1)
  }

  return (
    <div className="space-y-6 p-6">
      {/* Refreshing indicator */}
      {(loading || loadingEngagements) && !isInitialLoad.current && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-in slide-in-from-top duration-200">
          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Refreshing data...</span>
        </div>
      )}
      
      {/* Premium Header */}
      <FarmersTableHeader
        totalCount={farmersWithEngagements.length}
        filteredCount={filteredFarmers.length}
        onSearch={setSearchQuery}
        onQuickFilter={handleQuickFilter}
        farmers={filteredFarmers}
        selectedFarmerIds={selectedFarmerIds}
        tablePreferences={tablePreferences}
        onToggleColumn={preferencesControls?.toggleColumn}
        onUpdateDensity={preferencesControls?.updateDensity}
        onResetPreferences={preferencesControls?.resetPreferences}
      />

      {/* Advanced Filters (Collapsible) */}
      <FarmersAdvancedFilters
        filters={filters}
        onFiltersChange={setFilters}
        totalCount={farmersWithEngagements.length}
        filteredCount={filteredFarmers.length}
      />

      {/* Premium Data Table */}
      {loadingEngagements ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading farmers data...</p>
        </div>
      ) : (
        <FarmersDataTable
          farmers={paginatedFarmers}
          onDelete={handleDelete}
          onLogActivity={handleLogActivity}
          highlightedRowId={highlightedRowId}
          onRowAction={setHighlightedRowId}
          onSelectionChange={setSelectedFarmerIds}
          tableScrollRef={tableScrollContainerRef}
          onPreferencesChange={setTablePreferences}
          onPreferencesControlsReady={setPreferencesControls}
        />
      )}

      {/* Pagination Controls */}
      {!loadingEngagements && filteredFarmers.length > 0 && (
        <div className="flex items-center justify-between bg-card border rounded-lg p-4">
          {/* Left: Items per page & info */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Show</span>
              <select
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
              <span className="text-sm text-muted-foreground">per page</span>
            </div>
            <span className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredFarmers.length)} of {filteredFarmers.length} farmers
            </span>
          </div>

          {/* Right: Page navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className="h-9 px-3 rounded-md border border-input bg-background text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent hover:text-accent-foreground"
            >
              First
            </button>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-9 px-3 rounded-md border border-input bg-background text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent hover:text-accent-foreground"
            >
              Previous
            </button>
            
            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`h-9 w-9 rounded-md text-sm ${
                      currentPage === pageNum
                        ? 'bg-primary text-primary-foreground'
                        : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-9 px-3 rounded-md border border-input bg-background text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent hover:text-accent-foreground"
            >
              Next
            </button>
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="h-9 px-3 rounded-md border border-input bg-background text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent hover:text-accent-foreground"
            >
              Last
            </button>
          </div>
        </div>
      )}

      {/* Log Activity Modal */}
      {selectedFarmer && (
        <LogActivityModal
          open={activityModalOpen}
          onOpenChange={setActivityModalOpen}
          farmerId={selectedFarmer.id}
          farmerName={selectedFarmer.name}
          onSuccess={handleActivitySuccess}
        />
      )}
    </div>
  )
}
