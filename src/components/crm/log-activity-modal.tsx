"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { activitiesAPI, ActivityFormData } from "@/lib/supabase/activities"
import { useFarmerEngagements } from "@/hooks/use-farmer-engagements"
import { farmerEngagementsAPI } from "@/lib/supabase/farmer-engagements"
import { 
  Phone, 
  Users, 
  MapPin, 
  FileText, 
  Clock, 
  Mail, 
  MessageCircle, 
  MoreHorizontal,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  ArrowRight,
  Bell
} from "lucide-react"

interface LogActivityModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  farmerId: string
  farmerName: string
  onSuccess?: () => void
}

const activityTypes = [
  { value: "call", label: "Phone Call", icon: Phone, color: "text-blue-600", hint: "Record a phone conversation" },
  { value: "meeting", label: "Meeting", icon: Users, color: "text-purple-600", hint: "Log a face-to-face meeting" },
  { value: "visit", label: "Field Visit", icon: MapPin, color: "text-green-600", hint: "Document an on-site visit" },
  { value: "note", label: "Note/Update", icon: FileText, color: "text-gray-600", hint: "Add a general note or update" },
  { value: "follow_up", label: "Follow-up", icon: Clock, color: "text-amber-600", hint: "Record a follow-up action" },
  { value: "email", label: "Email", icon: Mail, color: "text-red-600", hint: "Log email communication" },
  { value: "whatsapp", label: "WhatsApp", icon: MessageCircle, color: "text-emerald-600", hint: "Track WhatsApp chat" },
  { value: "other", label: "Other", icon: MoreHorizontal, color: "text-slate-600", hint: "Any other activity type" },
]

const outcomeOptions = [
  { value: "successful", label: "✅ Successful", color: "text-green-600" },
  { value: "no_response", label: "📵 No Response", color: "text-gray-600" },
  { value: "callback_required", label: "📞 Callback Required", color: "text-blue-600" },
  { value: "interested", label: "⭐ Interested", color: "text-purple-600" },
  { value: "not_interested", label: "❌ Not Interested", color: "text-red-600" },
  { value: "follow_up_scheduled", label: "📅 Follow-up Scheduled", color: "text-amber-600" },
  { value: "information_shared", label: "📄 Information Shared", color: "text-cyan-600" },
  { value: "complaint_raised", label: "⚠️ Complaint Raised", color: "text-orange-600" },
  { value: "order_placed", label: "🛒 Order Placed", color: "text-emerald-600" },
  { value: "pending", label: "⏳ Pending", color: "text-yellow-600" },
]

export function LogActivityModal({
  open,
  onOpenChange,
  farmerId,
  farmerName,
  onSuccess,
}: LogActivityModalProps) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedEngagement, setSelectedEngagement] = useState<string>("")
  const [engagementFollowUpDate, setEngagementFollowUpDate] = useState<string>("")
  const [engagementFollowUpNotes, setEngagementFollowUpNotes] = useState<string>("")
  const [formData, setFormData] = useState<Partial<ActivityFormData>>({
    activity_type: "call",
    activity_title: "",
    activity_description: "",
    activity_outcome: "",
    next_action: "",
    next_action_date: "",
  })

  // Fetch farmer's active engagements
  const { engagements, loading: engagementsLoading } = useFarmerEngagements({ 
    farmer_id: farmerId,
    is_active: true 
  })

  // Get selected activity type details
  const selectedType = activityTypes.find(t => t.value === formData.activity_type)
  const SelectedIcon = selectedType?.icon || Phone

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setSuccess(false)
      setError(null)
      setSelectedEngagement("")
      setEngagementFollowUpDate("")
      setEngagementFollowUpNotes("")
      setFormData({
        activity_type: "call",
        activity_title: "",
        activity_description: "",
        activity_outcome: "",
        next_action: "",
        next_action_date: "",
      })
    }
  }, [open])

  // Auto-dismiss success message
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        onOpenChange(false)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [success, onOpenChange])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validate follow-up date if outcome is "follow_up_scheduled" and engagement selected
    if (formData.activity_outcome === "follow_up_scheduled" && selectedEngagement && !engagementFollowUpDate) {
      setError("Follow-up date is required when outcome is 'Follow-up Scheduled' for a product engagement")
      setLoading(false)
      return
    }

    try {
      // Get current user ID from Supabase auth
      const { data: { user } } = await (await import("@/lib/supabase/client")).supabase.auth.getUser()

      const activityData: any = {
        farmer_id: farmerId,
        engagement_id: selectedEngagement || undefined,
        activity_type: formData.activity_type || "call",
        activity_title: formData.activity_title || "",
        activity_description: formData.activity_description,
        activity_outcome: formData.activity_outcome,
        performed_by: user?.id,
        next_action: formData.next_action,
        next_action_date: formData.next_action_date,
      }

      const { data, error: apiError } = await activitiesAPI.create(activityData)

      if (apiError) {
        setError(apiError.message || "Failed to log activity")
        return
      }

      // Handle engagement follow-up based on outcome
      if (selectedEngagement) {
        if (formData.activity_outcome === "follow_up_scheduled" && engagementFollowUpDate) {
          // Reschedule follow-up: Update to new date
          const { error: followUpError } = await farmerEngagementsAPI.setFollowUp(
            selectedEngagement,
            engagementFollowUpDate,
            engagementFollowUpNotes || formData.activity_description || "Follow-up scheduled from activity"
          )
          
          if (followUpError) {
            console.error("Error setting engagement follow-up:", followUpError)
          }
        } else if (formData.activity_outcome && formData.activity_outcome !== "follow_up_scheduled") {
          // Any other outcome: Mark follow-up as complete (action taken)
          const { error: completeError } = await farmerEngagementsAPI.completeFollowUp(selectedEngagement)
          
          if (completeError) {
            console.error("Error completing engagement follow-up:", completeError)
          }
        }
      }

      setSuccess(true)
      
      // Reset form
      setFormData({
        activity_type: "call",
        activity_title: "",
        activity_description: "",
        activity_outcome: "",
        next_action: "",
        next_action_date: "",
      })
      setSelectedEngagement("")
      setEngagementFollowUpDate("")
      setEngagementFollowUpNotes("")

      onSuccess?.()
    } catch (error: any) {
      console.error("Error:", error)
      setError(error.message || "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setFormData({
        activity_type: "call",
        activity_title: "",
        activity_description: "",
        activity_outcome: "",
        next_action: "",
        next_action_date: "",
      })
      setError(null)
      setSuccess(false)
      onOpenChange(false)
    }
  }

  // Success state render
  if (success) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-4 rounded-full bg-green-100 p-3">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold">Activity Logged Successfully!</h3>
            <p className="text-sm text-muted-foreground mt-2">
              The activity for <strong>{farmerName}</strong> has been recorded.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SelectedIcon className={`h-5 w-5 ${selectedType?.color}`} />
              Log Activity
            </DialogTitle>
            <div className="space-y-2">
              <DialogDescription>
                Record an activity for <strong className="text-foreground">{farmerName}</strong>
              </DialogDescription>
              {selectedType && (
                <Badge variant="outline" className="text-xs">
                  {selectedType.label}
                </Badge>
              )}
            </div>
          </DialogHeader>

          <div className="space-y-5 p-6">
            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                <XCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Error logging activity</p>
                  <p className="text-red-700 mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Product/Engagement Context */}
            {engagements && engagements.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="engagement" className="text-base">
                  Product Context
                  <Badge variant="secondary" className="ml-2 text-xs">Optional</Badge>
                </Label>
                <select
                  id="engagement"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
                  value={selectedEngagement}
                  onChange={(e) => setSelectedEngagement(e.target.value)}
                  disabled={engagementsLoading}
                >
                  <option value="">General activity (not linked to specific product)</option>
                  {engagements.map((eng) => (
                    <option key={eng.id} value={eng.id}>
                      {eng.product?.product_name || 'General'} - {eng.season} ({eng.lead_stage})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Link this activity to a specific product engagement for better tracking
                </p>
              </div>
            )}

            {engagementsLoading && (
              <div className="text-sm text-muted-foreground">
                Loading product engagements...
              </div>
            )}

            {/* Activity Type - Visual Grid */}
            <div className="space-y-2">
              <Label className="text-base">Activity Type *</Label>
              <div className="grid grid-cols-4 gap-2">
                {activityTypes.map((type) => {
                  const Icon = type.icon
                  const isSelected = formData.activity_type === type.value
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, activity_type: type.value })}
                      className={`flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all hover:border-primary/50 ${
                        isSelected 
                          ? 'border-primary bg-primary/5 shadow-sm' 
                          : 'border-border hover:bg-accent'
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${isSelected ? type.color : 'text-muted-foreground'}`} />
                      <span className={`text-xs font-medium ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {type.label}
                      </span>
                    </button>
                  )
                })}
              </div>
              {selectedType?.hint && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                  <AlertCircle className="h-3 w-3" />
                  {selectedType.hint}
                </p>
              )}
            </div>

            {/* Activity Title */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="activity_title" className="text-base">Activity Title *</Label>
                <span className="text-xs text-muted-foreground">
                  {formData.activity_title?.length || 0}/100
                </span>
              </div>
              <Input
                id="activity_title"
                placeholder={`e.g., "Discussed ${selectedType?.label.toLowerCase() || 'activity'} about product interest"`}
                required
                maxLength={100}
                value={formData.activity_title}
                onChange={(e) =>
                  setFormData({ ...formData, activity_title: e.target.value })
                }
                className="text-base"
              />
            </div>

            {/* Activity Description */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="activity_description" className="text-base">Details</Label>
                <span className="text-xs text-muted-foreground">Optional</span>
              </div>
              <Textarea
                id="activity_description"
                placeholder="Add detailed notes about the discussion, farmer's response, concerns raised, products mentioned, etc..."
                rows={4}
                value={formData.activity_description}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    activity_description: e.target.value,
                  })
                }
                className="resize-none"
              />
            </div>

            {/* Outcome */}
            <div className="space-y-2">
              <Label htmlFor="activity_outcome" className="text-base">Outcome</Label>
              <select
                id="activity_outcome"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
                value={formData.activity_outcome}
                onChange={(e) =>
                  setFormData({ ...formData, activity_outcome: e.target.value })
                }
              >
                <option value="">Select outcome...</option>
                {outcomeOptions.map((outcome) => (
                  <option key={outcome.value} value={outcome.value}>
                    {outcome.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                What was the result of this activity?
              </p>
            </div>

            {/* Product Engagement Follow-up - Shows when outcome is "follow_up_scheduled" AND engagement selected */}
            {formData.activity_outcome === "follow_up_scheduled" && selectedEngagement ? (
              <div className="rounded-lg border-2 border-amber-200 bg-amber-50 p-4 space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-amber-900">
                  <Bell className="h-4 w-4" />
                  Schedule Follow-up for Product Engagement
                  <Badge variant="default" className="text-xs bg-amber-600">Required</Badge>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="engagement_follow_up_date" className="flex items-center gap-2 text-amber-900">
                    <Calendar className="h-4 w-4" />
                    Follow-up Date *
                  </Label>
                  <Input
                    id="engagement_follow_up_date"
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={engagementFollowUpDate}
                    onChange={(e) => setEngagementFollowUpDate(e.target.value)}
                    required
                    className="bg-white"
                  />
                  <p className="text-xs text-amber-700">
                    This will schedule a follow-up for the selected product engagement
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="engagement_follow_up_notes" className="text-amber-900">
                    Follow-up Notes
                  </Label>
                  <Textarea
                    id="engagement_follow_up_notes"
                    placeholder="Why is this follow-up needed? What should be discussed?"
                    rows={3}
                    value={engagementFollowUpNotes}
                    onChange={(e) => setEngagementFollowUpNotes(e.target.value)}
                    className="bg-white resize-none"
                  />
                </div>
              </div>
            ) : (
              /* General Follow-up Section - Only shows when engagement NOT selected or outcome NOT "follow_up_scheduled" */
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <ArrowRight className="h-4 w-4 text-primary" />
                  Follow-up Actions
                  <Badge variant="secondary" className="text-xs">Optional</Badge>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="next_action">What needs to be done next?</Label>
                  <Input
                    id="next_action"
                    placeholder="e.g., Schedule field visit, Send product brochure, Follow up on quotation"
                    value={formData.next_action}
                    onChange={(e) =>
                      setFormData({ ...formData, next_action: e.target.value })
                    }
                  />
                </div>

                {formData.next_action && (
                  <div className="space-y-2">
                    <Label htmlFor="next_action_date" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      When should this be done?
                    </Label>
                    <Input
                      id="next_action_date"
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={formData.next_action_date}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          next_action_date: e.target.value,
                        })
                      }
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !formData.activity_title}
              className="w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging Activity...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Log Activity
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
