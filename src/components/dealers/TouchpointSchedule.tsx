"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  Clock, 
  Plus, 
  Edit, 
  Trash2, 
  Phone,
  AlertCircle,
  CheckCircle,
  Clock3
} from 'lucide-react'
import { 
  dealerTouchpointsAPI, 
  DealerTouchpoint, 
  touchpointTypeLabels,
  formatFrequency,
  getTouchpointStatusColor
} from '@/lib/supabase/dealer-touchpoints'
import { TouchpointModal } from './TouchpointModal'
import { QuickCallModal } from './QuickCallModal'
import { format } from 'date-fns'

interface TouchpointScheduleProps {
  dealerId: string
}

export function TouchpointSchedule({ dealerId }: TouchpointScheduleProps) {
  const [touchpoints, setTouchpoints] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [callModalOpen, setCallModalOpen] = useState(false)
  const [editingTouchpoint, setEditingTouchpoint] = useState<DealerTouchpoint | null>(null)
  const [selectedTouchpoint, setSelectedTouchpoint] = useState<any>(null)

  useEffect(() => {
    loadTouchpoints()
  }, [dealerId])

  const loadTouchpoints = async () => {
    setLoading(true)
    console.log('Loading touchpoints for dealer:', dealerId)
    const { data, error } = await dealerTouchpointsAPI.getByDealer(dealerId)
    console.log('Touchpoints loaded:', { data, error })
    if (error) {
      console.error('Error loading touchpoints:', error)
    }
    if (data) {
      setTouchpoints(data)
    }
    setLoading(false)
  }

  const handleCreate = () => {
    setEditingTouchpoint(null)
    setModalOpen(true)
  }

  const handleEdit = (touchpoint: DealerTouchpoint) => {
    setEditingTouchpoint(touchpoint)
    setModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this touchpoint?')) return
    
    const { error } = await dealerTouchpointsAPI.delete(id)
    if (!error) {
      loadTouchpoints()
    }
  }

  const handleCall = (touchpoint: any) => {
    setSelectedTouchpoint(touchpoint)
    setCallModalOpen(true)
  }

  const handleCallComplete = async () => {
    setCallModalOpen(false)
    await loadTouchpoints()
  }

  const getStatusBadge = (touchpoint: any) => {
    if (!touchpoint.next_scheduled_date) return null
    
    const status = getTouchpointStatusColor(touchpoint.next_scheduled_date)
    const today = new Date().toISOString().split('T')[0]
    const scheduled = new Date(touchpoint.next_scheduled_date)
    const now = new Date(today)
    const diffDays = Math.floor((scheduled.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (status === 'danger') {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          Overdue ({Math.abs(diffDays)} days)
        </Badge>
      )
    } else if (status === 'warning') {
      return (
        <Badge variant="default" className="bg-amber-500 text-white gap-1">
          <Clock3 className="h-3 w-3" />
          Due Today
        </Badge>
      )
    } else if (diffDays <= 3) {
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="h-3 w-3" />
          Due in {diffDays} days
        </Badge>
      )
    }
    return null
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Loading touchpoints...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Scheduled Touchpoints</CardTitle>
              <CardDescription>
                Manage recurring communication schedules with this dealer
              </CardDescription>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Touchpoint
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {touchpoints.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium text-muted-foreground mb-2">
                No touchpoints scheduled
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Set up recurring communication schedules to maintain consistent contact
              </p>
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Touchpoint
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {touchpoints.map((touchpoint) => (
                <div
                  key={touchpoint.id}
                  className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">
                          {touchpointTypeLabels[touchpoint.touchpoint_type as keyof typeof touchpointTypeLabels]}
                        </h3>
                        {!touchpoint.is_active && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                        {getStatusBadge(touchpoint)}
                      </div>

                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>
                            {formatFrequency(
                              touchpoint.frequency,
                              touchpoint.preferred_day_of_week,
                              touchpoint.preferred_time
                            )}
                          </span>
                        </div>

                        <div className="flex items-center gap-4">
                          {touchpoint.last_executed_date && (
                            <div className="flex items-center gap-1">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span>
                                Last: {format(new Date(touchpoint.last_executed_date), 'MMM d, yyyy')}
                              </span>
                            </div>
                          )}
                          {touchpoint.next_scheduled_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 text-blue-600" />
                              <span>
                                Next: {format(new Date(touchpoint.next_scheduled_date), 'MMM d, yyyy')}
                              </span>
                            </div>
                          )}
                        </div>

                        {touchpoint.assigned_user && (
                          <div className="text-xs">
                            Assigned to: <span className="font-medium">{touchpoint.assigned_user.full_name}</span>
                          </div>
                        )}

                        {touchpoint.notes && (
                          <div className="text-xs italic">
                            Note: {touchpoint.notes}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleCall(touchpoint)}
                        disabled={!touchpoint.is_active}
                      >
                        <Phone className="h-4 w-4 mr-1" />
                        Call
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(touchpoint)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(touchpoint.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <TouchpointModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        dealerId={dealerId}
        touchpoint={editingTouchpoint}
        onSuccess={loadTouchpoints}
      />

      {selectedTouchpoint && (
        <QuickCallModal
          open={callModalOpen}
          onOpenChange={setCallModalOpen}
          dealerId={dealerId}
          touchpoint={selectedTouchpoint}
          onSuccess={handleCallComplete}
        />
      )}
    </>
  )
}
