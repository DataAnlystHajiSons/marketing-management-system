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

interface DealersImportMappingProps {
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

export function DealersImportMapping({ data, onMappingComplete, onBack }: DealersImportMappingProps) {
  const [loading, setLoading] = useState(true)
  const [unmappedValues, setUnmappedValues] = useState<UnmappedValue[]>([])
  const [mappedData, setMappedData] = useState<any[]>([])
  const [zones, setZones] = useState<any[]>([])
  const [areas, setAreas] = useState<any[]>([])
  const [villages, setVillages] = useState<any[]>([])
  const [fieldStaff, setFieldStaff] = useState<any[]>([])

  useEffect(() => {
    autoMapNames()
  }, [])

  const autoMapNames = async () => {
    setLoading(true)

    try {
      // Load all reference data
      const [zonesRes, areasRes, villagesRes, fsRes] = await Promise.all([
        supabase.from('zones').select('id, name, code').eq('is_active', true).order('name'),
        supabase.from('areas').select('id, name, code, zone_id, zone:zones(id, name, code)').eq('is_active', true).order('name'),
        supabase.from('villages').select('id, name, code, area_id, area:areas(id, name, code, zone_id)').eq('is_active', true).order('name'),
        usersAPI.getFieldStaff(),
      ])

      const zonesData = zonesRes.data || []
      const areasData = areasRes.data || []
      const villagesData = villagesRes.data || []
      const fsData = fsRes.data || []

      setZones(zonesData)
      setAreas(areasData)
      setVillages(villagesData)
      setFieldStaff(fsData)

      // Auto-map each row
      const mappedData = data.map(row => {
        const mapped = { ...row }

        // Map zone
        if (row.zone_name && !row.zone_id) {
          const zone = zonesData.find(z =>
            z.name.toLowerCase() === row.zone_name.toLowerCase() ||
            z.code?.toLowerCase() === row.zone_name.toLowerCase()
          )
          if (zone) mapped.zone_id = zone.id
        }

        // Map area (with zone context)
        if (row.area_name && !row.area_id) {
          const area = areasData.find(a => {
            const nameMatch = a.name.toLowerCase() === row.area_name.toLowerCase() ||
                            a.code?.toLowerCase() === row.area_name.toLowerCase()
            const zoneMatch = !mapped.zone_id || a.zone_id === mapped.zone_id
            return nameMatch && zoneMatch
          })
          if (area) {
            mapped.area_id = area.id
            // If zone wasn't set, set it from area
            if (!mapped.zone_id && area.zone_id) {
              mapped.zone_id = area.zone_id
            }
          }
        }

        // Map village (with area context)
        if (row.village_name && !row.village_id) {
          const village = villagesData.find(v => {
            const nameMatch = v.name.toLowerCase() === row.village_name.toLowerCase()
            const areaMatch = !mapped.area_id || v.area_id === mapped.area_id
            return nameMatch && areaMatch
          })
          if (village) {
            mapped.village_id = village.id
            // If area/zone weren't set, set them from village
            if (village.area) {
              if (!mapped.area_id) mapped.area_id = village.area_id
              if (!mapped.zone_id && village.area.zone_id) {
                mapped.zone_id = village.area.zone_id
              }
            }
          }
        }

        // Map field staff
        if (row.assigned_field_staff_name && !row.assigned_field_staff_id) {
          const fs = fsData.find(f =>
            f.full_name.toLowerCase() === row.assigned_field_staff_name.toLowerCase()
          )
          if (fs) mapped.assigned_field_staff_id = fs.id
        }

        return mapped
      })

      // Find unmapped values
      const unmapped: UnmappedValue[] = []

      const findUnmapped = (
        fieldName: string,
        idField: string,
        refData: any[],
        matchFn: (item: any, value: string) => boolean,
        contextFilter?: (item: any, row: any) => boolean
      ) => {
        const uniqueValues = new Set<string>()
        mappedData.forEach(row => {
          if (row[fieldName] && !row[idField]) {
            uniqueValues.add(row[fieldName])
          }
        })

        uniqueValues.forEach(value => {
          const match = refData.find(item => matchFn(item, value))
          if (!match) {
            const rows = mappedData.map((r, i) => r[fieldName] === value ? i + 2 : -1).filter(i => i > 0)
            const firstRow = mappedData.find(r => r[fieldName] === value)

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
                let displayName = item.name || item.full_name || 'Unnamed'

                if (fieldName === 'village_name' && item.area) {
                  displayName = `${displayName} (${item.area.name})`
                }
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

      // Find unmapped for each field
      findUnmapped(
        'zone_name',
        'zone_id',
        zonesData,
        (z, val) => z.name.toLowerCase() === val.toLowerCase() || z.code?.toLowerCase() === val.toLowerCase()
      )

      findUnmapped(
        'area_name',
        'area_id',
        areasData,
        (a, val) => a.name.toLowerCase() === val.toLowerCase() || a.code?.toLowerCase() === val.toLowerCase(),
        (area, row) => !row.zone_id || area.zone_id === row.zone_id
      )

      findUnmapped(
        'village_name',
        'village_id',
        villagesData,
        (v, val) => v.name.toLowerCase() === val.toLowerCase(),
        (village, row) => {
          if (row.area_id) {
            return village.area_id === row.area_id
          }
          if (row.zone_id && village.area) {
            return village.area.zone_id === row.zone_id
          }
          return true
        }
      )

      findUnmapped(
        'assigned_field_staff_name',
        'assigned_field_staff_id',
        fsData,
        (f, val) => f.full_name.toLowerCase() === val.toLowerCase()
      )

      setUnmappedValues(unmapped)
      setMappedData(mappedData)
      
      // If no unmapped, proceed automatically
      if (unmapped.length === 0) {
        onMappingComplete(mappedData)
      }

    } catch (error) {
      console.error('Error during auto-mapping:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMapping = (unmappedIndex: number, selectedId: string) => {
    const updated = [...unmappedValues]
    updated[unmappedIndex].selectedId = selectedId
    setUnmappedValues(updated)
  }

  const handleApplyMapping = (unmappedIndex: number) => {
    const unmapped = unmappedValues[unmappedIndex]
    if (!unmapped.selectedId) return

    // Update all rows with this unmapped value
    const updatedData = mappedData.map(row => {
      if (row[unmapped.field] === unmapped.value) {
        const idField = unmapped.field.replace('_name', '_id')
        return { ...row, [idField]: unmapped.selectedId }
      }
      return row
    })

    setMappedData(updatedData)

    // Remove this unmapped value
    const updatedUnmapped = unmappedValues.filter((_, i) => i !== unmappedIndex)
    setUnmappedValues(updatedUnmapped)

    // If no more unmapped, auto-proceed
    if (updatedUnmapped.length === 0) {
      onMappingComplete(updatedData)
    }
  }

  const handleSkipAll = () => {
    onMappingComplete(mappedData)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Auto-mapping names to database values...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>Name Mapping</CardTitle>
          <CardDescription>
            Map text names to database records
          </CardDescription>
        </CardHeader>
        <CardContent>
          {unmappedValues.length === 0 ? (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                All values successfully auto-mapped! No manual mapping required.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Found <strong>{unmappedValues.length}</strong> unmapped values that need your attention.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Unmapped Values */}
      {unmappedValues.map((unmapped, index) => (
        <Card key={index}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-base">
                  Unmapped {unmapped.field.replace('_', ' ').replace('name', '').trim()}
                </CardTitle>
                <CardDescription>
                  Value: <strong>"{unmapped.value}"</strong>
                </CardDescription>
              </div>
              <Badge variant="secondary">
                {unmapped.rows.length} row{unmapped.rows.length > 1 ? 's' : ''}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Found in rows: {unmapped.rows.join(', ')}
            </div>

            {unmapped.options.length > 0 ? (
              <div className="space-y-3">
                <Label>Select matching value:</Label>
                <Select
                  value={unmapped.selectedId || ''}
                  onChange={(e) => handleMapping(index, e.target.value)}
                >
                  <option value="">-- Select {unmapped.field.replace('_name', '')} --</option>
                  {unmapped.options.map(option => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </Select>

                <Button
                  onClick={() => handleApplyMapping(index)}
                  disabled={!unmapped.selectedId}
                  size="sm"
                >
                  Apply to {unmapped.rows.length} row{unmapped.rows.length > 1 ? 's' : ''}
                </Button>
              </div>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No matching options found. This value will be skipped during import.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex gap-2">
          {unmappedValues.length > 0 && (
            <Button variant="outline" onClick={handleSkipAll}>
              Skip All Unmapped
            </Button>
          )}
          <Button
            onClick={() => onMappingComplete(mappedData)}
            disabled={unmappedValues.some(u => u.options.length > 0 && !u.selectedId)}
          >
            Continue to Assignment
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
