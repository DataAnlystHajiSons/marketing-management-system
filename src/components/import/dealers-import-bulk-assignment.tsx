"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowRight, ArrowLeft, Users, AlertCircle, CheckCircle2 } from "lucide-react"
import { usersAPI } from "@/lib/supabase/users"

interface DealersImportBulkAssignmentProps {
  data: any[]
  onAssignmentComplete: (data: any[]) => void
  onBack: () => void
}

export function DealersImportBulkAssignment({
  data,
  onAssignmentComplete,
  onBack
}: DealersImportBulkAssignmentProps) {
  const [fieldStaff, setFieldStaff] = useState<any[]>([])
  const [assignments, setAssignments] = useState({
    field_staff_id: '',
    relationship_status: '',
    performance_rating: '',
    is_active: '',
  })
  const [applyTo, setApplyTo] = useState({
    field_staff: false,
    relationship_status: false,
    performance_rating: false,
    is_active: false,
  })

  useEffect(() => {
    loadFieldStaff()
  }, [])

  const loadFieldStaff = async () => {
    const { data: fsData } = await usersAPI.getFieldStaff()
    if (fsData) setFieldStaff(fsData)
  }

  const handleAssignmentChange = (field: string, value: string) => {
    setAssignments({ ...assignments, [field]: value })
  }

  const handleApplyToChange = (field: string, checked: boolean) => {
    setApplyTo({ ...applyTo, [field]: checked })
  }

  const getAffectedCount = (field: string) => {
    const dataField = field === 'field_staff' ? 'assigned_field_staff_id' : field
    return data.filter(row => !row[dataField]).length
  }

  const handleContinue = () => {
    const updatedData = data.map(row => {
      const updated = { ...row }

      if (applyTo.field_staff && assignments.field_staff_id && !row.assigned_field_staff_id) {
        updated.assigned_field_staff_id = assignments.field_staff_id
      }

      if (applyTo.relationship_status && assignments.relationship_status && !row.relationship_status) {
        updated.relationship_status = assignments.relationship_status
      }

      if (applyTo.performance_rating && assignments.performance_rating && !row.performance_rating) {
        updated.performance_rating = assignments.performance_rating
      }

      if (applyTo.is_active && assignments.is_active && row.is_active === undefined) {
        updated.is_active = assignments.is_active === 'true'
      }

      return updated
    })

    onAssignmentComplete(updatedData)
  }

  const getTotalApplied = () => {
    let count = 0
    if (applyTo.field_staff && assignments.field_staff_id) count += getAffectedCount('field_staff')
    if (applyTo.relationship_status && assignments.relationship_status) count += getAffectedCount('relationship_status')
    if (applyTo.performance_rating && assignments.performance_rating) count += getAffectedCount('performance_rating')
    if (applyTo.is_active && assignments.is_active) count += getAffectedCount('is_active')
    return count
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bulk Assignment</CardTitle>
          <CardDescription>
            Apply common values to multiple dealers at once
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              These values will only be applied to rows that don't already have them set.
              Existing values in your file will not be overwritten.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Field Staff Assignment */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Assign Field Staff</CardTitle>
              <CardDescription>
                Assign a field staff member to dealers
              </CardDescription>
            </div>
            <Badge variant="secondary">
              {getAffectedCount('field_staff')} without assignment
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="apply_field_staff"
              checked={applyTo.field_staff}
              onCheckedChange={(checked) => handleApplyToChange('field_staff', checked as boolean)}
            />
            <Label htmlFor="apply_field_staff" className="cursor-pointer">
              Apply to all dealers without field staff
            </Label>
          </div>

          {applyTo.field_staff && (
            <div className="space-y-2 pl-6">
              <Label>Select Field Staff</Label>
              <Select
                value={assignments.field_staff_id}
                onChange={(e) => handleAssignmentChange('field_staff_id', e.target.value)}
              >
                <option value="">-- Select Field Staff --</option>
                {fieldStaff.map(fs => (
                  <option key={fs.id} value={fs.id}>
                    {fs.full_name} ({fs.staff_code})
                  </option>
                ))}
              </Select>
              {assignments.field_staff_id && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    Will be applied to {getAffectedCount('field_staff')} dealers
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Relationship Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Relationship Status</CardTitle>
              <CardDescription>
                Set default relationship status
              </CardDescription>
            </div>
            <Badge variant="secondary">
              {getAffectedCount('relationship_status')} without status
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="apply_relationship_status"
              checked={applyTo.relationship_status}
              onCheckedChange={(checked) => handleApplyToChange('relationship_status', checked as boolean)}
            />
            <Label htmlFor="apply_relationship_status" className="cursor-pointer">
              Apply to all dealers without status
            </Label>
          </div>

          {applyTo.relationship_status && (
            <div className="space-y-2 pl-6">
              <Label>Select Status</Label>
              <Select
                value={assignments.relationship_status}
                onChange={(e) => handleAssignmentChange('relationship_status', e.target.value)}
              >
                <option value="">-- Select Status --</option>
                <option value="active">Active</option>
                <option value="preferred">Preferred</option>
                <option value="platinum">Platinum</option>
                <option value="at_risk">At Risk</option>
                <option value="inactive">Inactive</option>
              </Select>
              {assignments.relationship_status && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    Will be applied to {getAffectedCount('relationship_status')} dealers
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Rating */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Performance Rating</CardTitle>
              <CardDescription>
                Set default performance rating
              </CardDescription>
            </div>
            <Badge variant="secondary">
              {getAffectedCount('performance_rating')} without rating
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="apply_performance_rating"
              checked={applyTo.performance_rating}
              onCheckedChange={(checked) => handleApplyToChange('performance_rating', checked as boolean)}
            />
            <Label htmlFor="apply_performance_rating" className="cursor-pointer">
              Apply to all dealers without rating
            </Label>
          </div>

          {applyTo.performance_rating && (
            <div className="space-y-2 pl-6">
              <Label>Select Rating</Label>
              <Select
                value={assignments.performance_rating}
                onChange={(e) => handleAssignmentChange('performance_rating', e.target.value)}
              >
                <option value="">-- Select Rating --</option>
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="average">Average</option>
                <option value="below_average">Below Average</option>
                <option value="poor">Poor</option>
              </Select>
              {assignments.performance_rating && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    Will be applied to {getAffectedCount('performance_rating')} dealers
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Active Status</CardTitle>
              <CardDescription>
                Set default active/inactive status
              </CardDescription>
            </div>
            <Badge variant="secondary">
              {getAffectedCount('is_active')} without status
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="apply_is_active"
              checked={applyTo.is_active}
              onCheckedChange={(checked) => handleApplyToChange('is_active', checked as boolean)}
            />
            <Label htmlFor="apply_is_active" className="cursor-pointer">
              Apply to all dealers without status
            </Label>
          </div>

          {applyTo.is_active && (
            <div className="space-y-2 pl-6">
              <Label>Select Status</Label>
              <Select
                value={assignments.is_active}
                onChange={(e) => handleAssignmentChange('is_active', e.target.value)}
              >
                <option value="">-- Select Status --</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </Select>
              {assignments.is_active && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    Will be applied to {getAffectedCount('is_active')} dealers
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      {getTotalApplied() > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <strong>{getTotalApplied()}</strong> assignments will be applied across your dealers
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleContinue}>
          Continue to Preview
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
