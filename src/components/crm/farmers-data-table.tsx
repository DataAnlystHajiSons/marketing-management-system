"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  getTablePreferences,
  saveTablePreferences,
  getDefaultFarmersPreferences,
  mergeWithDefaults,
  type TablePreferences
} from "@/lib/table-preferences"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  ArrowUpDown,
  MoreHorizontal,
  Phone,
  Mail,
  MapPin,
  Calendar,
  TrendingUp,
  Package,
  Edit,
  Trash2,
  FileText,
  CheckCircle2,
  Clock,
  Flame,
  Snowflake,
  Wind,
} from "lucide-react"

interface Farmer {
  id: string
  farmer_code: string
  full_name: string
  phone: string
  email?: string
  zone?: { name: string }
  area?: { name: string }
  village?: { name: string }
  lead_score: number
  lead_quality: 'hot' | 'warm' | 'cold'
  is_customer: boolean
  last_activity_date?: string
  activeEngagementsCount: number
  engagements: any[]
  assigned_tmo?: { full_name: string }
}

interface FarmersDataTableProps {
  farmers: Farmer[]
  onDelete: (id: string, name: string) => void
  onLogActivity: (id: string, name: string) => void
  highlightedRowId?: string | null
  onRowAction?: (farmerId: string) => void
  onSelectionChange?: (selectedIds: string[]) => void
  tableScrollRef?: React.RefObject<HTMLDivElement>
  onPreferencesChange?: (preferences: TablePreferences) => void
  onPreferencesControlsReady?: (controls: {
    preferences: TablePreferences
    toggleColumn: (key: string) => void
    updateDensity: (density: 'compact' | 'comfortable' | 'spacious') => void
    resetPreferences: () => void
  }) => void
}

type SortField = 'name' | 'score' | 'activity' | 'engagements'
type SortDirection = 'asc' | 'desc'

export function FarmersDataTable({ farmers, onDelete, onLogActivity, highlightedRowId, onRowAction, onSelectionChange, tableScrollRef, onPreferencesChange, onPreferencesControlsReady }: FarmersDataTableProps) {
  const [selectedFarmers, setSelectedFarmers] = useState<string[]>([])
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [preferences, setPreferences] = useState<TablePreferences>(getDefaultFarmersPreferences())
  const [isInitialized, setIsInitialized] = useState(false)

  // Load preferences on mount ONCE
  useEffect(() => {
    const saved = getTablePreferences('farmers')
    const merged = mergeWithDefaults(saved, getDefaultFarmersPreferences())
    setPreferences(merged)
    
    // Apply saved sort if exists
    if (merged.defaultSort) {
      setSortField(merged.defaultSort.field as SortField)
      setSortDirection(merged.defaultSort.direction)
    }
    
    setIsInitialized(true)
  }, [])

  // Save preferences whenever they change (skip initial load)
  useEffect(() => {
    if (isInitialized && preferences) {
      saveTablePreferences(preferences)
      onPreferencesChange?.(preferences)
    }
  }, [preferences, isInitialized])

  // Update density
  const updateDensity = useCallback((density: 'compact' | 'comfortable' | 'spacious') => {
    setPreferences(prev => ({ ...prev, density }))
  }, [])

  // Toggle column visibility
  const toggleColumn = useCallback((columnKey: string) => {
    setPreferences(prev => {
      const currentColumn = prev.columns[columnKey]
      const newVisible = !currentColumn?.visible
      
      return {
        ...prev,
        columns: {
          ...prev.columns,
          [columnKey]: {
            ...currentColumn,
            visible: newVisible
          }
        }
      }
    })
  }, [])

  const viewMode = preferences.density

  // Notify parent of selection changes
  useEffect(() => {
    onSelectionChange?.(selectedFarmers)
  }, [selectedFarmers, onSelectionChange])

  // Select all/none
  const toggleSelectAll = () => {
    if (selectedFarmers.length === farmers.length) {
      setSelectedFarmers([])
      onRowAction?.(null) // Clear highlight
    } else {
      setSelectedFarmers(farmers.map(f => f.id))
      onRowAction?.(null) // Clear highlight when selecting all
    }
  }

  const toggleSelectFarmer = (id: string) => {
    if (selectedFarmers.includes(id)) {
      setSelectedFarmers(selectedFarmers.filter(fid => fid !== id))
      // Clear highlight if this was the highlighted row
      if (highlightedRowId === id) {
        onRowAction?.(null)
      }
    } else {
      setSelectedFarmers([...selectedFarmers, id])
      // Highlight the selected row
      onRowAction?.(id)
    }
  }

  // Sorting
  const handleSort = (field: SortField) => {
    let newDirection: SortDirection = 'asc'
    
    if (sortField === field) {
      newDirection = sortDirection === 'asc' ? 'desc' : 'asc'
      setSortDirection(newDirection)
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
    
    // Save sort preference
    setPreferences(prev => ({
      ...prev,
      defaultSort: { field, direction: newDirection }
    }))
  }

  const sortedFarmers = [...farmers].sort((a, b) => {
    let comparison = 0
    
    switch (sortField) {
      case 'name':
        comparison = a.full_name.localeCompare(b.full_name)
        break
      case 'score':
        comparison = a.lead_score - b.lead_score
        break
      case 'activity':
        const dateA = a.last_activity_date ? new Date(a.last_activity_date).getTime() : 0
        const dateB = b.last_activity_date ? new Date(b.last_activity_date).getTime() : 0
        comparison = dateA - dateB
        break
      case 'engagements':
        comparison = a.activeEngagementsCount - b.activeEngagementsCount
        break
    }

    return sortDirection === 'asc' ? comparison : -comparison
  })

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Lead quality config
  const qualityConfig = {
    hot: { 
      icon: Flame, 
      color: 'text-red-600', 
      bg: 'bg-red-50', 
      border: 'border-red-200',
      label: 'Hot Lead'
    },
    warm: { 
      icon: Wind, 
      color: 'text-amber-600', 
      bg: 'bg-amber-50', 
      border: 'border-amber-200',
      label: 'Warm Lead'
    },
    cold: { 
      icon: Snowflake, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50', 
      border: 'border-blue-200',
      label: 'Cold Lead'
    },
  }

  // Time ago helper - compares calendar days, not 24-hour periods
  const timeAgo = (dateString?: string) => {
    if (!dateString) return 'Never'
    
    // Normalize both dates to midnight for accurate day comparison
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const activityDate = new Date(dateString)
    activityDate.setHours(0, 0, 0, 0)
    
    const diffMs = today.getTime() - activityDate.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`
    return `${Math.floor(diffDays / 365)}y ago`
  }

  // Row height based on view mode
  const rowHeight = {
    compact: 'h-12',
    comfortable: 'h-16',
    spacious: 'h-20',
  }

  // Reset preferences
  const resetPreferences = useCallback(() => {
    const defaults = getDefaultFarmersPreferences()
    setPreferences(defaults)
    setSortField('name')
    setSortDirection('asc')
  }, [])

  // Notify parent when controls are ready
  useEffect(() => {
    if (isInitialized && onPreferencesControlsReady) {
      onPreferencesControlsReady({
        preferences,
        toggleColumn,
        updateDensity,
        resetPreferences
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized, preferences]) // Update when preferences change, but don't include callback in deps

  return (
    <div className="space-y-4">
      {/* Bulk Actions Bar */}
      {selectedFarmers.length > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-center justify-between animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <span className="font-medium">
              {selectedFarmers.length} farmer{selectedFarmers.length > 1 ? 's' : ''} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Mail className="h-4 w-4 mr-2" />
              Send SMS
            </Button>
            <Button variant="outline" size="sm">
              <Package className="h-4 w-4 mr-2" />
              Assign Product
            </Button>
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setSelectedFarmers([])}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div ref={tableScrollRef} className="overflow-auto max-h-[calc(100vh-350px)] relative">
          <table className="w-full caption-bottom text-sm bg-background">
            <thead className="sticky top-0 z-20 bg-white dark:bg-gray-950 shadow-md border-b-2 backdrop-blur-sm">
              <TableRow className="hover:bg-transparent border-b bg-white dark:bg-gray-950">
              <TableHead className="w-12 bg-white dark:bg-gray-950">
                <Checkbox
                  checked={selectedFarmers.length === farmers.length && farmers.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              {preferences.columns.farmerInfo?.visible && (
                <TableHead className="bg-white dark:bg-gray-950">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('name')}
                    className="-ml-3 h-8 data-[state=open]:bg-accent"
                  >
                    Farmer
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
              )}
              {preferences.columns.farmerCode?.visible && (
                <TableHead className="bg-white dark:bg-gray-950">Farmer Code</TableHead>
              )}
              {preferences.columns.phone?.visible && (
                <TableHead className="bg-white dark:bg-gray-950">Phone</TableHead>
              )}
              {preferences.columns.email?.visible && (
                <TableHead className="bg-white dark:bg-gray-950">Email</TableHead>
              )}
              {preferences.columns.zone?.visible && (
                <TableHead className="bg-white dark:bg-gray-950">Zone</TableHead>
              )}
              {preferences.columns.area?.visible && (
                <TableHead className="bg-white dark:bg-gray-950">Area</TableHead>
              )}
              {preferences.columns.village?.visible && (
                <TableHead className="bg-white dark:bg-gray-950">Village</TableHead>
              )}
              {preferences.columns.fullAddress?.visible && (
                <TableHead className="bg-white dark:bg-gray-950">Address</TableHead>
              )}
              {preferences.columns.leadQuality?.visible && (
                <TableHead className="bg-white dark:bg-gray-950">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('score')}
                    className="-ml-3 h-8"
                  >
                    Lead Quality
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
              )}
              {preferences.columns.leadStage?.visible && (
                <TableHead className="bg-white dark:bg-gray-950">Lead Stage</TableHead>
              )}
              {preferences.columns.leadScore?.visible && (
                <TableHead className="bg-white dark:bg-gray-950">Lead Score</TableHead>
              )}
              {preferences.columns.customerStatus?.visible && (
                <TableHead className="bg-white dark:bg-gray-950">Status</TableHead>
              )}
              {preferences.columns.dataSource?.visible && (
                <TableHead className="bg-white dark:bg-gray-950">Data Source</TableHead>
              )}
              {preferences.columns.landSize?.visible && (
                <TableHead className="bg-white dark:bg-gray-950">Land Size</TableHead>
              )}
              {preferences.columns.primaryCrops?.visible && (
                <TableHead className="bg-white dark:bg-gray-950">Primary Crops</TableHead>
              )}
              {preferences.columns.engagements?.visible && (
                <TableHead className="bg-white dark:bg-gray-950">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('engagements')}
                    className="-ml-3 h-8"
                  >
                    Engagements
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
              )}
              {preferences.columns.activeProducts?.visible && (
                <TableHead className="bg-white dark:bg-gray-950">Active Products</TableHead>
              )}
              {preferences.columns.assignedTMO?.visible && (
                <TableHead className="bg-white dark:bg-gray-950">TMO</TableHead>
              )}
              {preferences.columns.assignedFieldStaff?.visible && (
                <TableHead className="bg-white dark:bg-gray-950">Field Staff</TableHead>
              )}
              {preferences.columns.assignedDealer?.visible && (
                <TableHead className="bg-white dark:bg-gray-950">Dealer</TableHead>
              )}
              {preferences.columns.lastActivity?.visible && (
                <TableHead className="bg-white dark:bg-gray-950">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('activity')}
                    className="-ml-3 h-8"
                  >
                    Last Activity
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
              )}
              {preferences.columns.totalInteractions?.visible && (
                <TableHead className="bg-white dark:bg-gray-950">Interactions</TableHead>
              )}
              {preferences.columns.registrationDate?.visible && (
                <TableHead className="bg-white dark:bg-gray-950">Registered</TableHead>
              )}
              <TableHead className="w-12 bg-white dark:bg-gray-950"></TableHead>
              </TableRow>
            </thead>
            <tbody>
            {sortedFarmers.map((farmer) => {
              const quality = qualityConfig[farmer.lead_quality]
              const QualityIcon = quality.icon

              const isHighlighted = highlightedRowId === farmer.id
              const isSelected = selectedFarmers.includes(farmer.id)
              
              return (
                <TableRow
                  key={farmer.id}
                  className={`${rowHeight[viewMode]} group transition-all duration-300 border-b ${
                    isHighlighted
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-l-4 border-l-blue-500 shadow-lg relative' 
                      : isSelected
                        ? 'bg-primary/5 hover:bg-primary/10' 
                        : 'bg-background hover:bg-muted/50'
                  }`}
                  style={isHighlighted ? {
                    boxShadow: 'inset 4px 0 0 0 rgb(59 130 246), 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                    transform: 'translateX(2px)'
                  } : undefined}
                >
                  {/* Checkbox */}
                  <TableCell>
                    <Checkbox
                      checked={selectedFarmers.includes(farmer.id)}
                      onCheckedChange={() => toggleSelectFarmer(farmer.id)}
                    />
                  </TableCell>

                  {/* Farmer Info with Avatar */}
                  {preferences.columns.farmerInfo?.visible && (
                  <TableCell>
                    <Link href={`/crm/farmers/${farmer.id}`}>
                      <div className="flex items-center gap-3 group-hover:text-primary transition-colors cursor-pointer">
                        <div className="relative">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center font-semibold text-sm border border-primary/20">
                            {getInitials(farmer.full_name)}
                          </div>
                          {farmer.is_customer && (
                            <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                              <CheckCircle2 className="h-2.5 w-2.5 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium">{farmer.full_name}</span>
                          <span className="text-xs text-muted-foreground">
                            {farmer.farmer_code}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </TableCell>
                  )}

                  {/* Farmer Code */}
                  {preferences.columns.farmerCode?.visible && (
                  <TableCell>
                    <span className="text-sm text-muted-foreground font-mono">{farmer.farmer_code}</span>
                  </TableCell>
                  )}

                  {/* Phone */}
                  {preferences.columns.phone?.visible && (
                  <TableCell>
                    <a href={`tel:${farmer.phone}`} className="text-sm hover:text-primary transition-colors flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5" />
                      {farmer.phone}
                    </a>
                  </TableCell>
                  )}

                  {/* Email */}
                  {preferences.columns.email?.visible && (
                  <TableCell>
                    {farmer.email ? (
                      <a href={`mailto:${farmer.email}`} className="text-sm hover:text-primary transition-colors">
                        {farmer.email}
                      </a>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  )}

                  {/* Zone */}
                  {preferences.columns.zone?.visible && (
                  <TableCell>
                    <span className="text-sm">{farmer.zone?.name || '-'}</span>
                  </TableCell>
                  )}

                  {/* Area */}
                  {preferences.columns.area?.visible && (
                  <TableCell>
                    <span className="text-sm">{farmer.area?.name || '-'}</span>
                  </TableCell>
                  )}

                  {/* Village */}
                  {preferences.columns.village?.visible && (
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm">{farmer.village?.name || '-'}</span>
                    </div>
                  </TableCell>
                  )}

                  {/* Full Address */}
                  {preferences.columns.fullAddress?.visible && (
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{farmer.address || '-'}</span>
                  </TableCell>
                  )}

                  {/* Lead Quality with Score */}
                  {preferences.columns.leadQuality?.visible && (
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-full ${quality.bg} border ${quality.border}`}>
                        <QualityIcon className={`h-3.5 w-3.5 ${quality.color}`} />
                        <span className={`text-xs font-medium ${quality.color}`}>
                          {farmer.lead_quality.toUpperCase()}
                        </span>
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all ${
                                    farmer.lead_score >= 70 ? 'bg-green-500' :
                                    farmer.lead_score >= 40 ? 'bg-amber-500' :
                                    'bg-red-500'
                                  }`}
                                  style={{ width: `${farmer.lead_score}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium text-muted-foreground">
                                {farmer.lead_score}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>Lead Score: {farmer.lead_score}/100</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                  )}

                  {/* Lead Stage */}
                  {preferences.columns.leadStage?.visible && (
                  <TableCell>
                    {farmer.engagements && farmer.engagements.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {farmer.engagements.slice(0, 2).map((eng: any) => (
                          <TooltipProvider key={eng.id}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="outline" className="text-xs cursor-help">
                                  {eng.lead_stage?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-xs">
                                  <p className="font-medium">{eng.product?.product_name || 'General'}</p>
                                  <p className="text-muted-foreground">Score: {eng.lead_score}</p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                        {farmer.engagements.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{farmer.engagements.length - 2}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  )}

                  {/* Lead Score Only */}
                  {preferences.columns.leadScore?.visible && (
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${farmer.lead_score}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{farmer.lead_score}</span>
                    </div>
                  </TableCell>
                  )}

                  {/* Customer Status */}
                  {preferences.columns.customerStatus?.visible && (
                  <TableCell>
                    {farmer.is_customer ? (
                      <Badge className="bg-green-500 hover:bg-green-600">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Customer
                      </Badge>
                    ) : (
                      <Badge variant="outline">Lead</Badge>
                    )}
                  </TableCell>
                  )}

                  {/* Data Source */}
                  {preferences.columns.dataSource?.visible && (
                  <TableCell>
                    {farmer.engagements && farmer.engagements.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {farmer.engagements.slice(0, 2).map((eng: any) => {
                          const getDataSourceBadge = (source: string) => {
                            const badges: Record<string, string> = {
                              'fm_invitees': '📧 FM Invitee',
                              'fm_attendees': '✅ FM Attendee',
                              'fd_invitees': '📧 FD Invitee',
                              'fd_attendees': '✅ FD Attendee',
                              'data_bank': '🗄️ Data Bank',
                              'repzo': '📱 Repzo',
                              'manual_entry': '✍️ Manual',
                              'api_integration': '🔗 API',
                              'other': '📝 Other'
                            }
                            return badges[source] || source
                          }
                          
                          return (
                            <TooltipProvider key={eng.id}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant="secondary" className="text-xs cursor-help">
                                    {getDataSourceBadge(eng.data_source)}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="text-xs">
                                    <p className="font-medium">{eng.product?.product_name || 'General'}</p>
                                    <p className="text-muted-foreground">Entry: {new Date(eng.entry_date).toLocaleDateString()}</p>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )
                        })}
                        {farmer.engagements.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{farmer.engagements.length - 2}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  )}

                  {/* Land Size */}
                  {preferences.columns.landSize?.visible && (
                  <TableCell>
                    <span className="text-sm">{farmer.land_size_acres ? `${farmer.land_size_acres} acres` : '-'}</span>
                  </TableCell>
                  )}

                  {/* Primary Crops */}
                  {preferences.columns.primaryCrops?.visible && (
                  <TableCell>
                    <span className="text-sm">
                      {farmer.primary_crops 
                        ? Array.isArray(farmer.primary_crops) 
                          ? farmer.primary_crops.join(', ') 
                          : farmer.primary_crops
                        : '-'}
                    </span>
                  </TableCell>
                  )}

                  {/* Engagements */}
                  {preferences.columns.engagements?.visible && (
                  <TableCell>
                    {farmer.activeEngagementsCount > 0 ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-primary" />
                          <span className="font-medium">
                            {farmer.activeEngagementsCount} product{farmer.activeEngagementsCount > 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {farmer.engagements.slice(0, 2).map((eng: any) => (
                            <TooltipProvider key={eng.id}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant="outline" className="text-xs cursor-help">
                                    {eng.product?.product_name || 'General'}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="space-y-1">
                                    <p className="font-medium">{eng.product?.product_name}</p>
                                    <p className="text-xs">Stage: {eng.lead_stage}</p>
                                    <p className="text-xs">Score: {eng.lead_score}</p>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ))}
                          {farmer.activeEngagementsCount > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{farmer.activeEngagementsCount - 2}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">No engagements</span>
                    )}
                  </TableCell>
                  )}

                  {/* Active Products Count */}
                  {preferences.columns.activeProducts?.visible && (
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{farmer.activeEngagementsCount || 0}</span>
                    </div>
                  </TableCell>
                  )}

                  {/* Assigned TMO */}
                  {preferences.columns.assignedTMO?.visible && (
                  <TableCell>
                    {farmer.assigned_tmo ? (
                      <span className="text-sm">{farmer.assigned_tmo.full_name}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  )}

                  {/* Assigned Field Staff */}
                  {preferences.columns.assignedFieldStaff?.visible && (
                  <TableCell>
                    {farmer.assigned_field_staff ? (
                      <span className="text-sm">{farmer.assigned_field_staff.full_name}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  )}

                  {/* Assigned Dealer */}
                  {preferences.columns.assignedDealer?.visible && (
                  <TableCell>
                    {farmer.assigned_dealer ? (
                      <span className="text-sm">{farmer.assigned_dealer.full_name}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  )}

                  {/* Last Activity */}
                  {preferences.columns.lastActivity?.visible && (
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{timeAgo(farmer.last_activity_date)}</span>
                    </div>
                    {farmer.assigned_tmo && (
                      <div className="text-xs text-muted-foreground mt-1">
                        TMO: {farmer.assigned_tmo.full_name}
                      </div>
                    )}
                  </TableCell>
                  )}

                  {/* Total Interactions */}
                  {preferences.columns.totalInteractions?.visible && (
                  <TableCell>
                    <span className="text-sm font-medium">{farmer.total_interactions || 0}</span>
                  </TableCell>
                  )}

                  {/* Registration Date */}
                  {preferences.columns.registrationDate?.visible && (
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {new Date(farmer.created_at).toLocaleDateString()}
                    </span>
                  </TableCell>
                  )}

                  {/* Actions */}
                  <TableCell>
                    <DropdownMenu onOpenChange={(open) => open && onRowAction?.(farmer.id)}>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 !bg-white dark:!bg-gray-950 border-2 shadow-xl">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/crm/farmers/${farmer.id}`}>
                            <FileText className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/crm/farmers/${farmer.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onLogActivity(farmer.id, farmer.full_name)}>
                          <Calendar className="mr-2 h-4 w-4" />
                          Log Activity
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <a href={`tel:${farmer.phone}`}>
                            <Phone className="mr-2 h-4 w-4" />
                            Call
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDelete(farmer.id, farmer.full_name)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
            </tbody>
          </table>
        </div>

        {farmers.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No farmers found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get started by adding your first farmer
            </p>
            <Link href="/crm/farmers/new">
              <Button>Add Farmer</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
