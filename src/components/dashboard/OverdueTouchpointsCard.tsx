"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertCircle, Phone, Calendar, Clock } from 'lucide-react'
import { dealerTouchpointsAPI, touchpointTypeLabels } from '@/lib/supabase/dealer-touchpoints'
import { format, differenceInDays } from 'date-fns'
import Link from 'next/link'

export function OverdueTouchpointsCard() {
  const [touchpoints, setTouchpoints] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOverdueTouchpoints()
  }, [])

  const loadOverdueTouchpoints = async () => {
    setLoading(true)
    const { data, error } = await dealerTouchpointsAPI.getOverdue()
    if (!error && data) {
      setTouchpoints(data.slice(0, 5)) // Show top 5
    }
    setLoading(false)
  }

  const getDaysOverdue = (scheduledDate: string) => {
    const today = new Date()
    const scheduled = new Date(scheduledDate)
    return differenceInDays(today, scheduled)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Overdue Touchpoints
          </CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="border-red-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Overdue Touchpoints
              {touchpoints.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {touchpoints.length}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Touchpoints that need immediate attention</CardDescription>
          </div>
          {touchpoints.length > 0 && (
            <Link href="/crm/dealers">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {touchpoints.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
            <p className="font-medium">All caught up!</p>
            <p className="text-sm">No overdue touchpoints</p>
          </div>
        ) : (
          <div className="space-y-3">
            {touchpoints.map((touchpoint) => (
              <div
                key={touchpoint.id}
                className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm truncate">
                      {touchpoint.dealer?.business_name}
                    </span>
                    <Badge variant="destructive" className="text-xs">
                      {getDaysOverdue(touchpoint.next_scheduled_date)} days overdue
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      {touchpointTypeLabels[touchpoint.touchpoint_type as keyof typeof touchpointTypeLabels]}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <Calendar className="h-3 w-3" />
                    <span>Due: {format(new Date(touchpoint.next_scheduled_date), 'MMM d, yyyy')}</span>
                  </div>

                  {touchpoint.assigned_user && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Assigned to: {touchpoint.assigned_user.full_name}
                    </div>
                  )}
                </div>

                <Link href={`/crm/dealers/${touchpoint.dealer_id}`}>
                  <Button size="sm" variant="destructive" className="flex-shrink-0">
                    <Phone className="h-3 w-3 mr-1" />
                    Call Now
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function CheckCircle({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
