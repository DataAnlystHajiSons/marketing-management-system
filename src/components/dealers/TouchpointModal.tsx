"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  dealerTouchpointsAPI,
  DealerTouchpoint,
  TouchpointType,
  TouchpointFrequency,
  touchpointTypeLabels
} from '@/lib/supabase/dealer-touchpoints'
import { supabase } from '@/lib/supabase/client'

interface TouchpointModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dealerId: string
  touchpoint?: DealerTouchpoint | null
  onSuccess: () => void
}

export function TouchpointModal({
  open,
  onOpenChange,
  dealerId,
  touchpoint,
  onSuccess
}: TouchpointModalProps) {
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [formData, setFormData] = useState<{
    touchpoint_type: TouchpointType | undefined
    frequency: TouchpointFrequency | undefined
    preferred_day_of_week?: number
    preferred_time: string
    assigned_to: string
    notes: string
    is_active: boolean
  }>({
    touchpoint_type: undefined,
    frequency: undefined,
    preferred_day_of_week: undefined,
    preferred_time: '',
    assigned_to: '',
    notes: '',
    is_active: true
  })

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    if (touchpoint) {
      setFormData({
        touchpoint_type: touchpoint.touchpoint_type,
        frequency: touchpoint.frequency,
        preferred_day_of_week: touchpoint.preferred_day_of_week,
        preferred_time: touchpoint.preferred_time || '',
        assigned_to: touchpoint.assigned_to || '',
        notes: touchpoint.notes || '',
        is_active: touchpoint.is_active
      })
    } else {
      setFormData({
        touchpoint_type: undefined,
        frequency: undefined,
        preferred_day_of_week: undefined,
        preferred_time: '',
        assigned_to: '',
        notes: '',
        is_active: true
      })
    }
  }, [touchpoint, open])

  const loadUsers = async () => {
    const { data } = await supabase
      .from('user_profiles')
      .select('id, full_name, email')
      .eq('is_active', true)
      .order('full_name')
    
    if (data) setUsers(data)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.touchpoint_type || !formData.frequency) {
      alert('Please fill in all required fields')
      return
    }
    
    setLoading(true)

    try {
      const payload: any = {
        dealer_id: dealerId,
        touchpoint_type: formData.touchpoint_type,
        frequency: formData.frequency,
        is_active: formData.is_active
      }

      // Only add optional fields if they have values
      if (formData.preferred_day_of_week) {
        payload.preferred_day_of_week = formData.preferred_day_of_week
      }
      if (formData.preferred_time) {
        payload.preferred_time = formData.preferred_time
      }
      if (formData.assigned_to) {
        payload.assigned_to = formData.assigned_to
      }
      if (formData.notes) {
        payload.notes = formData.notes
      }

      console.log('Creating touchpoint with payload:', payload)

      let result
      if (touchpoint) {
        result = await dealerTouchpointsAPI.update(touchpoint.id, payload)
      } else {
        result = await dealerTouchpointsAPI.create(payload)
      }

      console.log('Touchpoint save result:', result)

      if (result.error) {
        throw new Error(result.error.message || 'Failed to save touchpoint')
      }

      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error('Error saving touchpoint:', error)
      alert(`Failed to save touchpoint: ${error.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const touchpointTypes = Object.entries(touchpointTypeLabels) as [TouchpointType, string][]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader className="space-y-3">
          <DialogTitle>
            {touchpoint ? 'Edit Touchpoint' : 'Create New Touchpoint'}
          </DialogTitle>
          <DialogDescription>
            Set up a recurring communication schedule for this dealer
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Touchpoint Type */}
          <div className="space-y-2">
            <Label htmlFor="touchpoint_type">Touchpoint Type *</Label>
            <Select
              value={formData.touchpoint_type || undefined}
              onValueChange={(value) => setFormData({ ...formData, touchpoint_type: value as TouchpointType })}
              required
            >
              <SelectTrigger id="touchpoint_type">
                <SelectValue placeholder="Select touchpoint type" />
              </SelectTrigger>
              <SelectContent>
                {touchpointTypes.map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <Label htmlFor="frequency">Frequency *</Label>
            <Select
              value={formData.frequency || undefined}
              onValueChange={(value) => setFormData({ ...formData, frequency: value as TouchpointFrequency })}
              required
            >
              <SelectTrigger id="frequency">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Conditional Day Selection */}
          {formData.frequency === 'weekly' && (
            <div className="space-y-2">
              <Label htmlFor="preferred_day_of_week">Preferred Day of Week</Label>
              <Select
                value={formData.preferred_day_of_week?.toString() || undefined}
                onValueChange={(value) => setFormData({ ...formData, preferred_day_of_week: parseInt(value) })}
              >
                <SelectTrigger id="preferred_day_of_week">
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Monday</SelectItem>
                  <SelectItem value="2">Tuesday</SelectItem>
                  <SelectItem value="3">Wednesday</SelectItem>
                  <SelectItem value="4">Thursday</SelectItem>
                  <SelectItem value="5">Friday</SelectItem>
                  <SelectItem value="6">Saturday</SelectItem>
                  <SelectItem value="7">Sunday</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}



          {/* Preferred Time */}
          <div className="space-y-2">
            <Label htmlFor="preferred_time">Preferred Time (Optional)</Label>
            <Input
              id="preferred_time"
              type="time"
              value={formData.preferred_time}
              onChange={(e) => setFormData({ ...formData, preferred_time: e.target.value })}
            />
          </div>

          {/* Assigned To */}
          <div className="space-y-2">
            <Label htmlFor="assigned_to">Assign To (Optional)</Label>
            <Select
              value={formData.assigned_to || undefined}
              onValueChange={(value) => setFormData({ ...formData, assigned_to: value === 'unassigned' ? '' : value })}
            >
              <SelectTrigger id="assigned_to">
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any additional notes about this touchpoint..."
              rows={3}
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="is_active" className="cursor-pointer">
              Active (uncheck to pause this touchpoint)
            </Label>
          </div>

          <DialogFooter className="gap-2 mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : touchpoint ? 'Update Touchpoint' : 'Create Touchpoint'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
