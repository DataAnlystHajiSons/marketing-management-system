"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, MapPin, Loader2 } from "lucide-react"
import { villagesAPI } from "@/lib/supabase/villages"
import { supabase } from "@/lib/supabase/client"

interface LocationSelectorProps {
  selectedZone?: string
  selectedArea?: string
  selectedVillage?: string
  onLocationChange: (location: {
    zoneId?: string
    areaId?: string
    villageId?: string
  }) => void
  required?: boolean
  disabled?: boolean
  showAddVillage?: boolean
  onAddVillage?: () => void
}

interface Zone {
  id: string
  name: string
  code?: string
}

interface Area {
  id: string
  name: string
  code?: string
  zone_id: string
}

interface Village {
  id: string
  name: string
  code?: string
  area_id: string
}

export function LocationSelector({
  selectedZone,
  selectedArea,
  selectedVillage,
  onLocationChange,
  required = false,
  disabled = false,
  showAddVillage = false,
  onAddVillage,
}: LocationSelectorProps) {
  const [zones, setZones] = useState<Zone[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [villages, setVillages] = useState<Village[]>([])

  const [loadingZones, setLoadingZones] = useState(true)
  const [loadingAreas, setLoadingAreas] = useState(false)
  const [loadingVillages, setLoadingVillages] = useState(false)

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

  const loadZones = async () => {
    setLoadingZones(true)
    try {
      const { data, error } = await supabase
        .from('zones')
        .select('id, name, code')
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (error) {
        console.error('Error loading zones:', error)
      } else {
        setZones(data || [])
      }
    } catch (err) {
      console.error('Error loading zones:', err)
    } finally {
      setLoadingZones(false)
    }
  }

  const loadAreas = async (zoneId: string) => {
    setLoadingAreas(true)
    try {
      const { data, error } = await supabase
        .from('areas')
        .select('id, name, code, zone_id')
        .eq('zone_id', zoneId)
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (error) {
        console.error('Error loading areas:', error)
      } else {
        setAreas(data || [])
      }
    } catch (err) {
      console.error('Error loading areas:', err)
    } finally {
      setLoadingAreas(false)
    }
  }

  const loadVillages = async (areaId: string) => {
    setLoadingVillages(true)
    try {
      const { data, error } = await villagesAPI.getByArea(areaId)

      if (error) {
        console.error('Error loading villages:', error)
      } else {
        setVillages(data || [])
      }
    } catch (err) {
      console.error('Error loading villages:', err)
    } finally {
      setLoadingVillages(false)
    }
  }

  const handleZoneChange = (zoneId: string) => {
    onLocationChange({
      zoneId: zoneId || undefined,
      areaId: undefined,
      villageId: undefined,
    })
  }

  const handleAreaChange = (areaId: string) => {
    onLocationChange({
      zoneId: selectedZone,
      areaId: areaId || undefined,
      villageId: undefined,
    })
  }

  const handleVillageChange = (villageId: string) => {
    onLocationChange({
      zoneId: selectedZone,
      areaId: selectedArea,
      villageId: villageId || undefined,
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <MapPin className="h-4 w-4" />
        <span>Select location hierarchy</span>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Zone Selector */}
        <div className="space-y-2">
          <Label htmlFor="location-zone">
            Zone/Province
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <div className="relative">
            <Select
              id="location-zone"
              value={selectedZone || ''}
              onChange={(e) => handleZoneChange(e.target.value)}
              disabled={disabled || loadingZones}
              required={required}
            >
              <option value="">Select Zone</option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                  {zone.code && ` (${zone.code})`}
                </option>
              ))}
            </Select>
            {loadingZones && (
              <Loader2 className="absolute right-8 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
          {!selectedZone && (
            <p className="text-xs text-muted-foreground">
              e.g., Punjab, Sindh
            </p>
          )}
        </div>

        {/* Area Selector */}
        <div className="space-y-2">
          <Label htmlFor="location-area">
            Area/District
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <div className="relative">
            <Select
              id="location-area"
              value={selectedArea || ''}
              onChange={(e) => handleAreaChange(e.target.value)}
              disabled={disabled || !selectedZone || loadingAreas}
              required={required}
            >
              <option value="">
                {selectedZone ? 'Select Area' : 'Select zone first'}
              </option>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name}
                  {area.code && ` (${area.code})`}
                </option>
              ))}
            </Select>
            {loadingAreas && (
              <Loader2 className="absolute right-8 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
          {selectedZone && areas.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {areas.length} area{areas.length !== 1 ? 's' : ''} available
            </p>
          )}
        </div>

        {/* Village Selector */}
        <div className="space-y-2">
          <Label htmlFor="location-village">
            Village/Town
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <div className="relative">
            <Select
              id="location-village"
              value={selectedVillage || ''}
              onChange={(e) => handleVillageChange(e.target.value)}
              disabled={disabled || !selectedArea || loadingVillages}
              required={required}
            >
              <option value="">
                {selectedArea ? 'Select Village' : 'Select area first'}
              </option>
              {villages.map((village) => (
                <option key={village.id} value={village.id}>
                  {village.name}
                  {village.code && ` (${village.code})`}
                </option>
              ))}
            </Select>
            {loadingVillages && (
              <Loader2 className="absolute right-8 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
          {selectedArea && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {villages.length} village{villages.length !== 1 ? 's' : ''} available
              </p>
              {showAddVillage && onAddVillage && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onAddVillage}
                  className="h-6 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Village
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Selected Location Display */}
      {(selectedZone || selectedArea || selectedVillage) && (
        <div className="rounded-lg bg-muted/50 p-3 border">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Selected Location:
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedZone && (
              <Badge variant="secondary">
                Zone: {zones.find((z) => z.id === selectedZone)?.name || selectedZone}
              </Badge>
            )}
            {selectedArea && (
              <Badge variant="secondary">
                Area: {areas.find((a) => a.id === selectedArea)?.name || selectedArea}
              </Badge>
            )}
            {selectedVillage && (
              <Badge variant="secondary">
                Village: {villages.find((v) => v.id === selectedVillage)?.name || selectedVillage}
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
