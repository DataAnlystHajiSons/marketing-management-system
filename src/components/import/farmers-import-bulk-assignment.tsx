"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Info, ArrowRight, ArrowLeft, UserCircle } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { villagesAPI } from "@/lib/supabase/villages"
import { usersAPI } from "@/lib/supabase/users"
import { useAuth } from "@/contexts/auth-context"

interface FarmersImportBulkAssignmentProps {
  data: any[]
  onAssignmentComplete: (assignedData: any[]) => void
  onBack: () => void
}

export function FarmersImportBulkAssignment({ data, onAssignmentComplete, onBack }: FarmersImportBulkAssignmentProps) {
  const { user } = useAuth()
  const [zones, setZones] = useState<any[]>([])
  const [areas, setAreas] = useState<any[]>([])
  const [villages, setVillages] = useState<any[]>([])
  const [tmos, setTmos] = useState<any[]>([])
  const [fieldStaff, setFieldStaff] = useState<any[]>([])
  const [dealers, setDealers] = useState<any[]>([])

  const [bulkAssignments, setBulkAssignments] = useState({
    zone_id: '',
    area_id: '',
    village_id: '',
    assigned_tmo_id: '',
    assigned_field_staff_id: '',
    assigned_dealer_id: '',
    assignCurrentUserAsTMO: false,
  })

  // Count records with missing fields
  const missingCounts = {
    zone: data.filter(r => !r.zone_id).length,
    area: data.filter(r => !r.area_id).length,
    village: data.filter(r => !r.village_id).length,
    tmo: data.filter(r => !r.assigned_tmo_id).length,
    fieldStaff: data.filter(r => !r.assigned_field_staff_id).length,
    dealer: data.filter(r => !r.assigned_dealer_id).length,
  }

  useEffect(() => {
    loadReferenceData()
  }, [])

  useEffect(() => {
    if (bulkAssignments.zone_id) {
      loadAreas(bulkAssignments.zone_id)
    } else {
      setAreas([])
      setVillages([])
    }
  }, [bulkAssignments.zone_id])

  useEffect(() => {
    if (bulkAssignments.area_id) {
      loadVillages(bulkAssignments.area_id)
    } else {
      setVillages([])
    }
  }, [bulkAssignments.area_id])

  const loadReferenceData = async () => {
    try {
      const [zonesRes, tmosRes, fsRes, dealersRes] = await Promise.all([
        supabase.from('zones').select('id, name, code').eq('is_active', true).order('name'),
        usersAPI.getTMOs(),
        usersAPI.getFieldStaff(),
        usersAPI.getDealers(),
      ])

      if (zonesRes.data) setZones(zonesRes.data)
      if (tmosRes.data) setTmos(tmosRes.data)
      if (fsRes.data) setFieldStaff(fsRes.data)
      if (dealersRes.data) setDealers(dealersRes.data)
    } catch (error) {
      console.error('Error loading reference data:', error)
    }
  }

  const loadAreas = async (zoneId: string) => {
    const { data } = await supabase
      .from('areas')
      .select('id, name, code')
      .eq('zone_id', zoneId)
      .eq('is_active', true)
      .order('name')
    
    if (data) setAreas(data)
  }

  const loadVillages = async (areaId: string) => {
    const { data } = await villagesAPI.getByArea(areaId)
    if (data) setVillages(data)
  }

  const handleChange = (field: string, value: any) => {
    setBulkAssignments(prev => {
      const updated = { ...prev, [field]: value }
      
      // Reset dependent fields
      if (field === 'zone_id') {
        updated.area_id = ''
        updated.village_id = ''
      } else if (field === 'area_id') {
        updated.village_id = ''
      } else if (field === 'assignCurrentUserAsTMO') {
        if (value) {
          updated.assigned_tmo_id = user?.id || ''
        } else {
          updated.assigned_tmo_id = ''
        }
      }
      
      return updated
    })
  }

  const handleContinue = () => {
    // Apply bulk assignments
    const assignedData = data.map(row => {
      const newRow = { ...row }

      // Apply location assignments to empty fields
      if (!newRow.zone_id && bulkAssignments.zone_id) {
        newRow.zone_id = bulkAssignments.zone_id
      }
      if (!newRow.area_id && bulkAssignments.area_id) {
        newRow.area_id = bulkAssignments.area_id
      }
      if (!newRow.village_id && bulkAssignments.village_id) {
        newRow.village_id = bulkAssignments.village_id
      }

      // Apply user assignments to empty fields
      if (!newRow.assigned_tmo_id && bulkAssignments.assigned_tmo_id) {
        newRow.assigned_tmo_id = bulkAssignments.assigned_tmo_id
      }
      if (!newRow.assigned_field_staff_id && bulkAssignments.assigned_field_staff_id) {
        newRow.assigned_field_staff_id = bulkAssignments.assigned_field_staff_id
      }
      if (!newRow.assigned_dealer_id && bulkAssignments.assigned_dealer_id) {
        newRow.assigned_dealer_id = bulkAssignments.assigned_dealer_id
      }

      return newRow
    })

    onAssignmentComplete(assignedData)
  }

  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Bulk assignments will only apply to records that have empty values. Existing values will not be overwritten.
        </AlertDescription>
      </Alert>

      {/* Location Assignment */}
      <Card>
        <CardHeader>
          <CardTitle>Location Bulk Assignment</CardTitle>
          <CardDescription>
            Apply location to all farmers with missing location data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="bulk-zone">
                Zone/Province
                {missingCounts.zone > 0 && (
                  <Badge variant="secondary" className="ml-2">{missingCounts.zone} empty</Badge>
                )}
              </Label>
              <Select
                id="bulk-zone"
                value={bulkAssignments.zone_id}
                onChange={(e) => handleChange('zone_id', e.target.value)}
                disabled={missingCounts.zone === 0}
              >
                <option value="" style={{ color: 'black', backgroundColor: 'white' }}>-- Select Zone --</option>
                {zones.map(zone => (
                  <option key={zone.id} value={zone.id} style={{ color: 'black', backgroundColor: 'white' }}>
                    {zone.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bulk-area">
                Area/District
                {missingCounts.area > 0 && (
                  <Badge variant="secondary" className="ml-2">{missingCounts.area} empty</Badge>
                )}
              </Label>
              <Select
                id="bulk-area"
                value={bulkAssignments.area_id}
                onChange={(e) => handleChange('area_id', e.target.value)}
                disabled={missingCounts.area === 0 || !bulkAssignments.zone_id}
              >
                <option value="">-- Select Area --</option>
                {areas.map(area => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bulk-village">
                Village/Town
                {missingCounts.village > 0 && (
                  <Badge variant="secondary" className="ml-2">{missingCounts.village} empty</Badge>
                )}
              </Label>
              <Select
                id="bulk-village"
                value={bulkAssignments.village_id}
                onChange={(e) => handleChange('village_id', e.target.value)}
                disabled={missingCounts.village === 0 || !bulkAssignments.area_id}
              >
                <option value="">-- Select Village --</option>
                {villages.map(village => (
                  <option key={village.id} value={village.id}>
                    {village.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Assignment */}
      <Card>
        <CardHeader>
          <CardTitle>Team Bulk Assignment</CardTitle>
          <CardDescription>
            Assign farmers to TMO, field staff, and dealers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="bulk-tmo">
                Assigned TMO
                {missingCounts.tmo > 0 && (
                  <Badge variant="secondary" className="ml-2">{missingCounts.tmo} empty</Badge>
                )}
              </Label>
              <Select
                id="bulk-tmo"
                value={bulkAssignments.assigned_tmo_id}
                onChange={(e) => handleChange('assigned_tmo_id', e.target.value)}
                disabled={missingCounts.tmo === 0 || bulkAssignments.assignCurrentUserAsTMO}
              >
                <option value="">-- Select TMO --</option>
                {tmos.map(tmo => (
                  <option key={tmo.id} value={tmo.id}>
                    {tmo.full_name}
                  </option>
                ))}
              </Select>
              
              <div className="flex items-center gap-2 pt-2">
                <Checkbox
                  id="assign-current-user"
                  checked={bulkAssignments.assignCurrentUserAsTMO}
                  onCheckedChange={(checked) => handleChange('assignCurrentUserAsTMO', checked)}
                />
                <Label htmlFor="assign-current-user" className="text-sm cursor-pointer">
                  <UserCircle className="h-3 w-3 inline mr-1" />
                  Assign to me
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bulk-fs">
                Field Staff
                {missingCounts.fieldStaff > 0 && (
                  <Badge variant="secondary" className="ml-2">{missingCounts.fieldStaff} empty</Badge>
                )}
              </Label>
              <Select
                id="bulk-fs"
                value={bulkAssignments.assigned_field_staff_id}
                onChange={(e) => handleChange('assigned_field_staff_id', e.target.value)}
                disabled={missingCounts.fieldStaff === 0}
              >
                <option value="">-- Select Field Staff --</option>
                {fieldStaff.map(fs => (
                  <option key={fs.id} value={fs.id}>
                    {fs.full_name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bulk-dealer">
                Dealer
                {missingCounts.dealer > 0 && (
                  <Badge variant="secondary" className="ml-2">{missingCounts.dealer} empty</Badge>
                )}
              </Label>
              <Select
                id="bulk-dealer"
                value={bulkAssignments.assigned_dealer_id}
                onChange={(e) => handleChange('assigned_dealer_id', e.target.value)}
                disabled={missingCounts.dealer === 0}
              >
                <option value="">-- Select Dealer --</option>
                {dealers.map(dealer => (
                  <option key={dealer.id} value={dealer.id} style={{ color: 'black', backgroundColor: 'white' }}>
                    {dealer.business_name || dealer.owner_name || 'Unnamed Dealer'}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2 justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button onClick={handleContinue}>
          Continue to Preview
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
