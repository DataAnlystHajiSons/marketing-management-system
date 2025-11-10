"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle, ArrowRight, ArrowLeft, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { villagesAPI } from "@/lib/supabase/villages"
import { usersAPI } from "@/lib/supabase/users"

interface FarmersImportMappingProps {
  data: any[]
  onMappingComplete: (mappedData: any[]) => void
  onBack: () => void
}

interface UnmappedValue {
  field: string
  value: string
  rows: number[]
  options: Array<{ id: string; name: string }>
  selectedId?: string
}

export function FarmersImportMapping({ data, onMappingComplete, onBack }: FarmersImportMappingProps) {
  const [loading, setLoading] = useState(true)
  const [unmappedValues, setUnmappedValues] = useState<UnmappedValue[]>([])
  const [zones, setZones] = useState<any[]>([])
  const [areas, setAreas] = useState<any[]>([])
  const [villages, setVillages] = useState<any[]>([])
  const [tmos, setTmos] = useState<any[]>([])
  const [fieldStaff, setFieldStaff] = useState<any[]>([])
  const [dealers, setDealers] = useState<any[]>([])

  useEffect(() => {
    autoMapNames()
  }, [])

  const autoMapNames = async () => {
    setLoading(true)

    try {
      // Load all reference data using existing APIs
      const [zonesRes, areasRes, villagesRes, tmosRes, fsRes, dealersRes] = await Promise.all([
        supabase.from('zones').select('id, name, code').eq('is_active', true).order('name'),
        supabase.from('areas').select('id, name, code, zone_id, zone:zones(id, name, code)').eq('is_active', true).order('name'),
        supabase.from('villages').select('id, name, code, area_id, area:areas(id, name, code, zone_id)').eq('is_active', true).order('name'),
        usersAPI.getTMOs(),
        usersAPI.getFieldStaff(),
        usersAPI.getDealers(),
      ])

      const zonesData = zonesRes.data || []
      const areasData = areasRes.data || []
      const villagesData = villagesRes.data || []
      const tmosData = tmosRes.data || []
      const fsData = fsRes.data || []
      const dealersData = dealersRes.data || []

    setZones(zonesData)
    setAreas(areasData)
    setVillages(villagesData)
    setTmos(tmosData)
    setFieldStaff(fsData)
    setDealers(dealersData)

    // Find unmapped values
    const unmapped: UnmappedValue[] = []

    // Helper to find unique unmapped values with smart filtering
    const findUnmapped = (
      fieldName: string, 
      idField: string, 
      refData: any[], 
      matchFn: (item: any, value: string) => boolean,
      contextFilter?: (item: any, row: any) => boolean
    ) => {
      const uniqueValues = new Set<string>()
      data.forEach(row => {
        if (row[fieldName] && !row[idField]) {
          uniqueValues.add(row[fieldName])
        }
      })

      uniqueValues.forEach(value => {
        const match = refData.find(item => matchFn(item, value))
        if (!match) {
          const rows = data.map((r, i) => r[fieldName] === value ? i + 2 : -1).filter(i => i > 0)
          
          // Get first row with this value to check context
          const firstRow = data.find(r => r[fieldName] === value)
          
          // Filter options based on context (e.g., filter villages by area)
          let filteredOptions = refData
          if (contextFilter && firstRow) {
            const contextFiltered = refData.filter(item => contextFilter(item, firstRow))
            if (contextFiltered.length > 0) {
              filteredOptions = contextFiltered
            }
          }
          
          unmapped.push({
            field: fieldName,
            value,
            rows,
            options: filteredOptions.map(item => {
              let displayName = item.name || item.full_name || item.business_name || item.owner_name || 'Unnamed'
              
              // Add area context for villages
              if (fieldName === 'village_name' && item.area) {
                displayName = `${displayName} (${item.area.name})`
              }
              // Add zone context for areas
              if (fieldName === 'area_name' && item.zone) {
                displayName = `${displayName} (${item.zone.name})`
              }
              
              return { 
                id: item.id, 
                name: displayName
              }
            }),
          })
        }
      })
    }

    // Find unmapped for each field with smart contextual filtering
    
    // Zone - no filter needed (top level)
    findUnmapped(
      'zone_name', 
      'zone_id', 
      zonesData, 
      (z, val) => z.name.toLowerCase() === val.toLowerCase() || z.code?.toLowerCase() === val.toLowerCase()
    )
    
    // Area - filter by zone if zone_id exists in row
    findUnmapped(
      'area_name', 
      'area_id', 
      areasData, 
      (a, val) => a.name.toLowerCase() === val.toLowerCase() || a.code?.toLowerCase() === val.toLowerCase(),
      (area, row) => !row.zone_id || area.zone_id === row.zone_id // Filter by zone if available
    )
    
    // Village - filter by area_id if exists, or zone if only zone exists
    findUnmapped(
      'village_name', 
      'village_id', 
      villagesData, 
      (v, val) => v.name.toLowerCase() === val.toLowerCase(),
      (village, row) => {
        // If row has area_id, only show villages from that area
        if (row.area_id) {
          return village.area_id === row.area_id
        }
        // If row has zone_id (but no area_id), show villages from that zone
        if (row.zone_id && village.area) {
          return village.area.zone_id === row.zone_id
        }
        // Otherwise show all villages
        return true
      }
    )
    
    // TMO - no filter needed
    findUnmapped(
      'assigned_tmo_name', 
      'assigned_tmo_id', 
      tmosData, 
      (t, val) => t.full_name.toLowerCase() === val.toLowerCase()
    )
    
    // Field Staff - no filter needed
    findUnmapped(
      'assigned_field_staff_name', 
      'assigned_field_staff_id', 
      fsData, 
      (f, val) => f.full_name.toLowerCase() === val.toLowerCase()
    )
    
    // Dealer - no filter needed
    findUnmapped(
      'assigned_dealer_name', 
      'assigned_dealer_id', 
      dealersData, 
      (d, val) => d.business_name?.toLowerCase() === val.toLowerCase() || d.owner_name?.toLowerCase() === val.toLowerCase()
    )

      console.log('Unmapped values:', unmapped)
      unmapped.forEach(uv => {
        console.log(`Field: ${uv.field}, Options count: ${uv.options.length}, First option:`, uv.options[0])
      })
      
      setUnmappedValues(unmapped)
    } catch (error) {
      console.error('Error in autoMapNames:', error)
      // Continue with empty unmapped values on error
      setUnmappedValues([])
    } finally {
      setLoading(false)
    }
  }

  const handleMappingChange = (index: number, selectedId: string) => {
    setUnmappedValues(prev => {
      const updated = [...prev]
      updated[index].selectedId = selectedId
      return updated
    })
  }

  const handleContinue = () => {
    const allMapped = unmappedValues.every(uv => uv.selectedId)
    if (!allMapped) {
      alert('Please map all values before continuing')
      return
    }

    // Apply mappings
    const mappedData = data.map(row => {
      const newRow = { ...row }

      unmappedValues.forEach(uv => {
        if (row[uv.field] === uv.value && uv.selectedId) {
          const idField = uv.field.replace('_name', '_id')
          newRow[idField] = uv.selectedId
        }
      })

      // Auto-map matched values
      if (row.zone_name && !row.zone_id) {
        const match = zones.find(z => 
          z.name.toLowerCase() === row.zone_name.toLowerCase() || 
          z.code?.toLowerCase() === row.zone_name.toLowerCase()
        )
        if (match) newRow.zone_id = match.id
      }

      if (row.area_name && !row.area_id) {
        const match = areas.find(a => 
          a.name.toLowerCase() === row.area_name.toLowerCase() || 
          a.code?.toLowerCase() === row.area_name.toLowerCase()
        )
        if (match) newRow.area_id = match.id
      }

      if (row.village_name && !row.village_id) {
        const match = villages.find(v => v.name.toLowerCase() === row.village_name.toLowerCase())
        if (match) newRow.village_id = match.id
      }

      if (row.assigned_tmo_name && !row.assigned_tmo_id) {
        const match = tmos.find(t => t.full_name.toLowerCase() === row.assigned_tmo_name.toLowerCase())
        if (match) newRow.assigned_tmo_id = match.id
      }

      if (row.assigned_field_staff_name && !row.assigned_field_staff_id) {
        const match = fieldStaff.find(f => f.full_name.toLowerCase() === row.assigned_field_staff_name.toLowerCase())
        if (match) newRow.assigned_field_staff_id = match.id
      }

      if (row.assigned_dealer_name && !row.assigned_dealer_id) {
        const match = dealers.find(d => d.name.toLowerCase() === row.assigned_dealer_name.toLowerCase())
        if (match) newRow.assigned_dealer_id = match.id
      }

      return newRow
    })

    onMappingComplete(mappedData)
  }

  const getFieldLabel = (field: string) => {
    const labels: Record<string, string> = {
      zone_name: 'Zone',
      area_name: 'Area',
      village_name: 'Village',
      assigned_tmo_name: 'TMO',
      assigned_field_staff_name: 'Field Staff',
      assigned_dealer_name: 'Dealer',
    }
    return labels[field] || field
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Analyzing data and auto-mapping names...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Name to ID Mapping</CardTitle>
          <CardDescription>
            Review and map names to system IDs. Auto-matched values are already resolved.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {unmappedValues.length === 0 ? (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600">
                <strong>All names auto-mapped successfully!</strong> No manual mapping needed.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Found {unmappedValues.length} value(s) that need manual mapping.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                {unmappedValues.map((unmapped, index) => (
                  <Card key={index} className="border-2">
                    <CardContent className="pt-6">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <Label className="text-xs text-muted-foreground">Field Type</Label>
                          <div className="mt-1">
                            <Badge variant="secondary">{getFieldLabel(unmapped.field)}</Badge>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Rows</Label>
                          <div className="mt-1 text-sm font-mono">{unmapped.rows.join(', ')}</div>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Value in CSV</Label>
                          <div className="mt-1 font-medium text-red-600">{unmapped.value}</div>
                        </div>
                        <div>
                          <Label htmlFor={`mapping-${index}`}>Select Match *</Label>
                          <Select
                            id={`mapping-${index}`}
                            value={unmapped.selectedId || ''}
                            onChange={(e) => handleMappingChange(index, e.target.value)}
                          >
                            <option value="" style={{ color: 'black', backgroundColor: 'white' }}>
                              -- Select --
                            </option>
                            {unmapped.options.map(opt => (
                              <option 
                                key={opt.id} 
                                value={opt.id}
                                style={{ color: 'black', backgroundColor: 'white' }}
                              >
                                {opt.name || opt.id || 'Unknown'}
                              </option>
                            ))}
                          </Select>
                          {unmapped.options.length === 0 ? (
                            <p className="text-xs text-red-600 mt-1">
                              No options available for this field type
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground mt-1">
                              {unmapped.options.length} option(s) available
                              {unmapped.field === 'village_name' && ' (filtered by area/zone from CSV)'}
                              {unmapped.field === 'area_name' && ' (filtered by zone from CSV)'}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2 justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button 
          onClick={handleContinue}
          disabled={unmappedValues.some(uv => !uv.selectedId)}
        >
          Continue to Assignment
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
