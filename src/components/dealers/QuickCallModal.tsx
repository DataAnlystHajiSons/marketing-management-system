"use client"

import React, { useState } from 'react'
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
import { dealerTouchpointsAPI, touchpointTypeLabels } from '@/lib/supabase/dealer-touchpoints'
import { supabase } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { Loader2 } from 'lucide-react'

interface QuickCallModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dealerId: string
  touchpoint: any
  onSuccess: () => void
}

export function QuickCallModal({
  open,
  onOpenChange,
  dealerId,
  touchpoint,
  onSuccess
}: QuickCallModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    call_date: new Date().toISOString().slice(0, 16),
    duration_seconds: 0,
    call_status: 'completed',
    notes: '',
    follow_up_required: false,
    follow_up_date: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log('Starting call log process...')
      
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      console.log('Auth result:', { user: user?.id, authError })
      
      if (authError) throw new Error(`Authentication error: ${authError.message}`)
      if (!user) throw new Error('Not authenticated')

      // Prepare call data - convert datetime-local to ISO timestamp
      const callDate = new Date(formData.call_date).toISOString()
      const durationSeconds = formData.duration_seconds > 0 ? Math.floor(formData.duration_seconds * 60) : null
      
      const callPayload: any = {
        caller_id: user.id,
        stakeholder_type: 'dealer',
        stakeholder_id: dealerId,
        call_date: callDate,
        call_purpose: touchpoint.touchpoint_type,
        call_status: formData.call_status,
        notes: formData.notes || '',
        follow_up_required: formData.follow_up_required
      }
      
      // Only add duration if provided
      if (durationSeconds !== null) {
        callPayload.call_duration_seconds = durationSeconds
      }
      
      // Only add follow_up_date if provided and not empty
      if (formData.follow_up_date && formData.follow_up_date.trim() !== '') {
        callPayload.follow_up_date = formData.follow_up_date
      }
      
      console.log('Call payload:', callPayload)
      console.log('Duration (minutes):', formData.duration_seconds, '→ (seconds):', durationSeconds)

      // Log the call
      const { data: callData, error: callError } = await supabase
        .from('calls_log')
        .insert(callPayload)
        .select()
        .single()

      console.log('Call log result:', { callData, callError })
      
      if (callError) {
        throw new Error(`Failed to insert call log: ${callError.message}`)
      }

      // Complete the touchpoint (updates next_scheduled_date) - only if touchpoint exists
      if (touchpoint.id) {
        console.log('Completing touchpoint:', touchpoint.id)
        const completeResult = await dealerTouchpointsAPI.complete(touchpoint.id, callData.id)
        console.log('Touchpoint complete result:', completeResult)
        
        if (completeResult.error) {
          throw new Error(`Failed to complete touchpoint: ${completeResult.error.message}`)
        }
      } else {
        console.log('No touchpoint to complete - logging call only')
      }

      // Update dealer's last_contact_date
      console.log('Updating dealer contact info...')
      const { error: dealerError } = await supabase
        .from('dealers')
        .update({
          last_contact_date: new Date().toISOString()
        })
        .eq('id', dealerId)
      
      if (dealerError) {
        console.error('Dealer update error (non-critical):', dealerError)
      }

      console.log('Call logged successfully!')
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error('Error logging call:', error)
      alert(`Failed to log call: ${error.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader className="space-y-3">
          <DialogTitle>Log Call - {touchpoint.dealer?.business_name}</DialogTitle>
          <DialogDescription>
            {touchpoint.id 
              ? `Complete touchpoint: ${touchpointTypeLabels[touchpoint.touchpoint_type as keyof typeof touchpointTypeLabels]}`
              : 'Log general call (no scheduled touchpoint)'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Touchpoint Info Display */}
          {touchpoint.id ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-blue-900">
                  {touchpointTypeLabels[touchpoint.touchpoint_type as keyof typeof touchpointTypeLabels]}
                </span>
                <span className="text-sm text-blue-700">
                  Last: {touchpoint.last_executed_date 
                    ? format(new Date(touchpoint.last_executed_date), 'MMM d, yyyy')
                    : 'Never'}
                </span>
              </div>
              <div className="text-sm text-blue-600">
                Next scheduled after this call: {format(
                  new Date(new Date(touchpoint.next_scheduled_date).getTime() + 7 * 24 * 60 * 60 * 1000), 
                  'MMM d, yyyy'
                )}
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> This dealer has no scheduled touchpoint. You're logging a general call.
                Consider setting up a touchpoint schedule for regular communication.
              </p>
            </div>
          )}

          {/* Call Date & Time */}
          <div className="space-y-2">
            <Label htmlFor="call_date">Call Date & Time</Label>
            <Input
              id="call_date"
              type="datetime-local"
              value={formData.call_date}
              onChange={(e) => setFormData({ ...formData, call_date: e.target.value })}
              required
            />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              min="0"
              value={formData.duration_seconds || ''}
              onChange={(e) => setFormData({ ...formData, duration_seconds: parseInt(e.target.value) || 0 })}
              placeholder="e.g., 15"
            />
          </div>

          {/* Call Status */}
          <div className="space-y-2">
            <Label htmlFor="call_status">Call Status *</Label>
            <Select
              value={formData.call_status}
              onValueChange={(value) => setFormData({ ...formData, call_status: value })}
              required
            >
              <SelectTrigger id="call_status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="no_answer">No Answer</SelectItem>
                <SelectItem value="busy">Busy</SelectItem>
                <SelectItem value="callback_requested">Callback Requested</SelectItem>
                <SelectItem value="wrong_number">Wrong Number</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Discussion Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Discussion Points / Notes *</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="What was discussed? Any concerns or action items?"
              rows={5}
              required
            />
          </div>

          {/* Follow-up Required */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="follow_up_required"
                checked={formData.follow_up_required}
                onChange={(e) => setFormData({ ...formData, follow_up_required: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="follow_up_required" className="cursor-pointer">
                Follow-up required
              </Label>
            </div>

            {formData.follow_up_required && (
              <div className="ml-6 space-y-2">
                <Label htmlFor="follow_up_date">Follow-up Date</Label>
                <Input
                  id="follow_up_date"
                  type="date"
                  value={formData.follow_up_date}
                  onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
                />
              </div>
            )}
          </div>

          {/* Confirmation Message */}
          {touchpoint.id ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                ✓ This touchpoint will be marked as completed and automatically rescheduled
              </p>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                ℹ️ This call will be logged to the dealer's activity history
              </p>
            </div>
          )}

          <DialogFooter className="gap-2 mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="min-w-[200px]">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                touchpoint.id ? 'Save & Complete Touchpoint' : 'Save Call Log'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
