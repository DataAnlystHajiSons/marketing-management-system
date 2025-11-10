"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { farmerEngagementsAPI } from "@/lib/supabase/farmer-engagements"
import { Check, X } from "lucide-react"

type LeadStage = 'new' | 'contacted' | 'qualified' | 'meeting_invited' | 'meeting_attended' | 
  'visit_scheduled' | 'visit_completed' | 'interested' | 'negotiation' | 'converted' | 
  'active_customer' | 'inactive' | 'lost' | 'rejected'

const stageLabels: Record<LeadStage, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  meeting_invited: 'Meeting Invited',
  meeting_attended: 'Meeting Attended',
  visit_scheduled: 'Visit Scheduled',
  visit_completed: 'Visit Completed',
  interested: 'Interested',
  negotiation: 'Negotiation',
  converted: 'Converted',
  active_customer: 'Active Customer',
  inactive: 'Inactive',
  lost: 'Lost',
  rejected: 'Rejected',
}

const stageColors: Record<LeadStage, string> = {
  new: 'bg-slate-100 text-slate-800',
  contacted: 'bg-blue-100 text-blue-800',
  qualified: 'bg-cyan-100 text-cyan-800',
  meeting_invited: 'bg-indigo-100 text-indigo-800',
  meeting_attended: 'bg-purple-100 text-purple-800',
  visit_scheduled: 'bg-violet-100 text-violet-800',
  visit_completed: 'bg-fuchsia-100 text-fuchsia-800',
  interested: 'bg-pink-100 text-pink-800',
  negotiation: 'bg-amber-100 text-amber-800',
  converted: 'bg-green-100 text-green-800',
  active_customer: 'bg-emerald-100 text-emerald-800',
  inactive: 'bg-gray-100 text-gray-800',
  lost: 'bg-red-100 text-red-800',
  rejected: 'bg-orange-100 text-orange-800',
}

interface StageChangeSelectProps {
  engagementId: string
  currentStage: LeadStage
  onStageChanged?: () => void
  userId?: string
}

export function StageChangeSelect({ 
  engagementId, 
  currentStage, 
  onStageChanged,
  userId 
}: StageChangeSelectProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [newStage, setNewStage] = useState<LeadStage>(currentStage)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (newStage === currentStage) {
      setIsEditing(false)
      return
    }

    setLoading(true)
    setError('')

    try {
      const reason = `Stage changed from ${stageLabels[currentStage]} to ${stageLabels[newStage]}`
      
      const { error: updateError } = await farmerEngagementsAPI.updateStage(
        engagementId,
        newStage,
        userId,
        reason
      )

      if (updateError) {
        setError(updateError.message || 'Failed to update stage')
      } else {
        setIsEditing(false)
        if (onStageChanged) onStageChanged()
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setNewStage(currentStage)
    setIsEditing(false)
    setError('')
  }

  if (!isEditing) {
    return (
      <div className="flex items-center gap-2">
        <Label className="text-xs text-muted-foreground">Stage:</Label>
        <Badge className={`${stageColors[currentStage]} text-xs`}>
          {stageLabels[currentStage]}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs"
          onClick={() => setIsEditing(true)}
        >
          Change
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label className="text-xs text-muted-foreground">Change Stage:</Label>
        <Select
          value={newStage}
          onChange={(e) => setNewStage(e.target.value as LeadStage)}
          className="text-sm h-8"
          disabled={loading}
        >
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="qualified">Qualified</option>
          <option value="meeting_invited">Meeting Invited</option>
          <option value="meeting_attended">Meeting Attended</option>
          <option value="visit_scheduled">Visit Scheduled</option>
          <option value="visit_completed">Visit Completed</option>
          <option value="interested">Interested</option>
          <option value="negotiation">Negotiation</option>
          <option value="converted">Converted</option>
          <option value="active_customer">Active Customer</option>
          <option value="inactive">Inactive</option>
          <option value="lost">Lost</option>
          <option value="rejected">Rejected</option>
        </Select>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          className="h-7 text-xs"
          onClick={handleSave}
          disabled={loading || newStage === currentStage}
        >
          <Check className="h-3 w-3 mr-1" />
          {loading ? 'Saving...' : 'Save'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={handleCancel}
          disabled={loading}
        >
          <X className="h-3 w-3 mr-1" />
          Cancel
        </Button>
      </div>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}
