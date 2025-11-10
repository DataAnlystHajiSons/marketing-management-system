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

interface VillagesImportMappingProps {
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

export function VillagesImportMapping({ data, onMappingComplete, onBack }: VillagesImportMappingProps) {
  const [loading, setLoading] = useState(true)
  const [unmappedValues, setUnmappedValues] = useState<UnmappedValue[]>([])
  const [zones, setZones] = useState<any[]>([])
  const [areas, setAreas] = useState<any[]>([])
  const [mappedData, setMappedData] = useState<any[]>([])

  useEffect(() => {
    autoMapNames()
  }, [])

  const autoMapNames = async () => {
    setLoading(true)

    try {
      // Load reference data
      const [zonesRes, areasRes] = await Promise.all([
        supabase.from('zones').select('id, name, code').eq('is_active', true).order('name'),
        supabase.from('areas').select('id, name, code, zone_id, zone:zones(id, name, code)').eq('is_active', true).order('name'),
      ])

      const zonesData = zonesRes.data || []
      const areasData = areasRes.data || []

      setZones(zonesData)
      setAreas(areasData)

      // Auto-map each row
      const mapped = data.map(row => {
        const mappedRow = { ...row }

        // Map zone
        if (row.zone_name && !row.zone_id) {
          const zone = zonesData.find(z =>
            z.name.toLowerCase() === row.zone_name.toLowerCase() ||
            z.code?.toLowerCase() === row.zone_name.toLowerCase()
          )
          if (zone) mappedRow.zone_id = zone.id
        }

        // Map area (with zone context)
        if (row.area_name && !row.area_id) {
          const area = areasData.find(a => {
            const nameMatch = a.name.toLowerCase() === row.area_name.toLowerCase() ||
                            a.code?.toLowerCase() === row.area_name.toLowerCase()
            const zoneMatch = !mappedRow.zone_id || a.zone_id === mappedRow.zone_id
            return nameMatch && zoneMatch
          })
          if (area) {
            mappedRow.area_id = area.id
            // If zone wasn't set, set it from area
            if (!mappedRow.zone_id && area.zone_id) {
              mappedRow.zone_id = area.zone_id
            }
          }
        }

        return mappedRow
      })

      setMappedData(mapped)

      // Find unmapped values
      const unmapped: UnmappedValue[] = []

      // Helper function to find unmapped
      const findUnmapped = (
        fieldName: string,
        idField: string,
        refData: any[],
        matchFn: (item: any, value: string) => boolean,
        contextFilter?: (item: any, row: any) => boolean
      ) => {
        const uniqueValues = new Set<string>()
        mapped.forEach(row => {
          if (row[fieldName] && !row[idField]) {
            uniqueValues.add(row[fieldName])
          }
        })

        uniqueValues.forEach(value => {
          const match = refData.find(item => matchFn(item, value))
          if (!match) {
            const rows = mapped.map((r, i) => r[fieldName] === value ? i + 2 : -1).filter(i => i > 0)
            const firstRow = mapped.find(r => r[fieldName] === value)

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
                let displayName = item.name || 'Unnamed'

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

      // Find unmapped zones
      findUnmapped(
        'zone_name',
        'zone_id',
        zonesData,
        (z, val) => z.name.toLowerCase() === val.toLowerCase() || z.code?.toLowerCase() === val.toLowerCase()
      )

      // Find unmapped areas (filter by zone if available)
      findUnmapped(
        'area_name',
        'area_id',
        areasData,
        (a, val) => a.name.toLowerCase() === val.toLowerCase() || a.code?.toLowerCase() === val.toLowerCase(),
        (area, row) => !row.zone_id || area.zone_id === row.zone_id
      )

      setUnmappedValues(unmapped)

      // If no unmapped, proceed automatically
      if (unmapped.length === 0) {
        onMappingComplete(mapped)
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
            <p className="text-muted-foreground">Auto-mapping zone and area names...</p>
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
          <CardTitle>Zone & Area Name Mapping</CardTitle>
          <CardDescription>
            Map zone and area text names to database records
          </CardDescription>
        </CardHeader>
        <CardContent>
          {unmappedValues.length === 0 ? (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                All zone and area names successfully auto-mapped! No manual mapping required.
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
                  Unmapped {unmapped.field.replace('_name', '').replace('_', ' ')}
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
                <Label>Select matching {unmapped.field.replace('_name', '')}:</Label>
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
                  No matching {unmapped.field.replace('_name', '')} found in database. 
                  This value will be skipped during import.
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
            Continue to Preview
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
