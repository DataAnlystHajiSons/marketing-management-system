"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import {
  Search,
  Filter,
  Download,
  Plus,
  Grid3x3,
  List,
  LayoutGrid,
  SlidersHorizontal,
  Sparkles,
  FileDown,
  Users,
  TrendingUp,
  RotateCcw,
} from "lucide-react"

import { type TablePreferences } from "@/lib/table-preferences"
import { exportToCSV, exportToExcel, exportToPDF, exportSelected } from "@/lib/export-utils"

interface FarmersTableHeaderProps {
  totalCount: number
  filteredCount: number
  onSearch: (query: string) => void
  onQuickFilter: (filter: string) => void
  farmers?: any[]
  selectedFarmerIds?: string[]
  tablePreferences?: TablePreferences | null
  onToggleColumn?: (columnKey: string) => void
  onUpdateDensity?: (density: 'compact' | 'comfortable' | 'spacious') => void
  onResetPreferences?: () => void
}

export function FarmersTableHeader({
  totalCount,
  filteredCount,
  onSearch,
  onQuickFilter,
  farmers = [],
  selectedFarmerIds = [],
  tablePreferences,
  onToggleColumn,
  onUpdateDensity,
  onResetPreferences,
}: FarmersTableHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    onSearch(value)
  }

  // Export handlers
  const handleExportCSV = () => {
    exportToCSV(farmers, `farmers-export-${new Date().toISOString().split('T')[0]}.csv`)
  }

  const handleExportExcel = () => {
    exportToExcel(farmers, `farmers-export-${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const handleExportPDF = () => {
    exportToPDF(farmers, `farmers-export-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const handleExportSelected = () => {
    if (selectedFarmerIds.length === 0) {
      alert('No farmers selected. Please select farmers from the table first.')
      return
    }
    exportSelected(farmers, selectedFarmerIds, 'csv')
  }

  const quickFilters = [
    { label: 'Hot Leads', value: 'hot', icon: TrendingUp, color: 'text-red-600' },
    { label: 'Event Attendees', value: 'attendees', icon: Users, color: 'text-purple-600' },
    { label: 'New This Week', value: 'new', icon: Sparkles, color: 'text-blue-600' },
    { label: 'Customers', value: 'customers', icon: Users, color: 'text-green-600' },
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Farmers</h1>
          <p className="text-muted-foreground mt-1">
            {filteredCount === totalCount
              ? `Manage your ${totalCount.toLocaleString()} farmers`
              : `Showing ${filteredCount.toLocaleString()} of ${totalCount.toLocaleString()} farmers`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <FileDown className="mr-2 h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 !bg-white dark:!bg-gray-950 border-2 shadow-xl">
              <DropdownMenuLabel>Export Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleExportCSV}>
                <Download className="mr-2 h-4 w-4" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportExcel}>
                <Download className="mr-2 h-4 w-4" />
                Export as Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDF}>
                <Download className="mr-2 h-4 w-4" />
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleExportSelected}
                disabled={selectedFarmerIds.length === 0}
              >
                <FileDown className="mr-2 h-4 w-4" />
                Export Selected {selectedFarmerIds.length > 0 && `(${selectedFarmerIds.length})`}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Link href="/crm/import/farmers">
            <Button variant="outline" size="sm">
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
          </Link>

          <Link href="/crm/farmers/new">
            <Button size="sm" className="shadow-sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Farmer
            </Button>
          </Link>
        </div>
      </div>

      {/* Search & Controls */}
      <div className="flex items-center gap-3 bg-card p-4 rounded-lg border shadow-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search farmers by name, phone, or code..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        {/* Column Settings */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 max-h-[500px] overflow-y-auto !bg-white dark:!bg-gray-950 border-2 shadow-xl backdrop-blur-sm">
            <DropdownMenuLabel>Visible Columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {tablePreferences && (
              <>
                {/* Basic Info */}
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Basic Info</DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={tablePreferences.columns.farmerInfo?.visible ?? true}
                  onCheckedChange={() => onToggleColumn?.('farmerInfo')}
                >
                  Farmer Name & Avatar
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={tablePreferences.columns.farmerCode?.visible}
                  onCheckedChange={() => onToggleColumn?.('farmerCode')}
                >
                  Farmer Code
                </DropdownMenuCheckboxItem>

                {/* Contact */}
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Contact</DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={tablePreferences.columns.phone?.visible}
                  onCheckedChange={() => onToggleColumn?.('phone')}
                >
                  Phone Number
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={tablePreferences.columns.email?.visible}
                  onCheckedChange={() => onToggleColumn?.('email')}
                >
                  Email Address
                </DropdownMenuCheckboxItem>

                {/* Location */}
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Location</DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={tablePreferences.columns.zone?.visible}
                  onCheckedChange={() => onToggleColumn?.('zone')}
                >
                  Zone/Province
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={tablePreferences.columns.area?.visible}
                  onCheckedChange={() => onToggleColumn?.('area')}
                >
                  Area/District
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={tablePreferences.columns.village?.visible}
                  onCheckedChange={() => onToggleColumn?.('village')}
                >
                  Village/Town
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={tablePreferences.columns.fullAddress?.visible}
                  onCheckedChange={() => onToggleColumn?.('fullAddress')}
                >
                  Full Address
                </DropdownMenuCheckboxItem>

                {/* Lead Info */}
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Lead Info</DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={tablePreferences.columns.leadQuality.visible}
                  onCheckedChange={() => onToggleColumn?.('leadQuality')}
                >
                  Lead Quality & Score
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={tablePreferences.columns.leadStage?.visible}
                  onCheckedChange={() => onToggleColumn?.('leadStage')}
                >
                  Lead Stage (New, Contacted, etc.)
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={tablePreferences.columns.leadScore?.visible}
                  onCheckedChange={() => onToggleColumn?.('leadScore')}
                >
                  Lead Score Only
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={tablePreferences.columns.customerStatus?.visible}
                  onCheckedChange={() => onToggleColumn?.('customerStatus')}
                >
                  Customer Status
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={tablePreferences.columns.dataSource?.visible}
                  onCheckedChange={() => onToggleColumn?.('dataSource')}
                >
                  Data Source (Invitee/Attendee)
                </DropdownMenuCheckboxItem>

                {/* Farming Details */}
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Farming Details</DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={tablePreferences.columns.landSize?.visible}
                  onCheckedChange={() => onToggleColumn?.('landSize')}
                >
                  Land Size (Acres)
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={tablePreferences.columns.primaryCrops?.visible}
                  onCheckedChange={() => onToggleColumn?.('primaryCrops')}
                >
                  Primary Crops
                </DropdownMenuCheckboxItem>

                {/* Engagements */}
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Engagements</DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={tablePreferences.columns.engagements.visible}
                  onCheckedChange={() => onToggleColumn?.('engagements')}
                >
                  Product Engagements (Detailed)
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={tablePreferences.columns.activeProducts?.visible}
                  onCheckedChange={() => onToggleColumn?.('activeProducts')}
                >
                  Active Products Count
                </DropdownMenuCheckboxItem>

                {/* Assignments */}
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Assignments</DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={tablePreferences.columns.assignedTMO?.visible}
                  onCheckedChange={() => onToggleColumn?.('assignedTMO')}
                >
                  Assigned TMO
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={tablePreferences.columns.assignedFieldStaff?.visible}
                  onCheckedChange={() => onToggleColumn?.('assignedFieldStaff')}
                >
                  Assigned Field Staff
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={tablePreferences.columns.assignedDealer?.visible}
                  onCheckedChange={() => onToggleColumn?.('assignedDealer')}
                >
                  Assigned Dealer
                </DropdownMenuCheckboxItem>

                {/* Activity */}
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Activity</DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={tablePreferences.columns.lastActivity.visible}
                  onCheckedChange={() => onToggleColumn?.('lastActivity')}
                >
                  Last Activity Date
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={tablePreferences.columns.totalInteractions?.visible}
                  onCheckedChange={() => onToggleColumn?.('totalInteractions')}
                >
                  Total Interactions
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={tablePreferences.columns.registrationDate?.visible}
                  onCheckedChange={() => onToggleColumn?.('registrationDate')}
                >
                  Registration Date
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Row Density</DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={tablePreferences.density === 'compact'}
                  onCheckedChange={() => onUpdateDensity?.('compact')}
                >
                  Compact
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={tablePreferences.density === 'comfortable'}
                  onCheckedChange={() => onUpdateDensity?.('comfortable')}
                >
                  Comfortable
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={tablePreferences.density === 'spacious'}
                  onCheckedChange={() => onUpdateDensity?.('spacious')}
                >
                  Spacious
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onResetPreferences}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset to Default
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Quick Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {quickFilters.map((filter) => (
          <Button
            key={filter.value}
            variant="outline"
            size="sm"
            onClick={() => onQuickFilter(filter.value)}
            className="h-8 border-dashed"
          >
            <filter.icon className={`h-3.5 w-3.5 mr-1.5 ${filter.color}`} />
            {filter.label}
          </Button>
        ))}
      </div>
    </div>
  )
}

function Upload(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" x2="12" y1="3" y2="15" />
    </svg>
  )
}
