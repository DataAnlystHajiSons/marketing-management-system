"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CalendarDays, Clock } from 'lucide-react'
import { dealerTouchpointsAPI, touchpointTypeLabels } from '@/lib/supabase/dealer-touchpoints'
import { format, differenceInDays } from 'date-fns'
import Link from 'next/link'

export function UpcomingTouchpointsCard() {
  const [touchpoints, setTouchpoints] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUpcomingTouchpoints()
  }, [])

  const loadUpcomingTouchpoints = async () => {
    setLoading(true)
    const { data, error } = await dealerTouchpointsAPI.getUpcoming()
    if (!error && data) {
      setTouchpoints(data.slice(0, 5)) // Show next 5
    }
    setLoading(false)
  }

  const getDaysUntil = (scheduledDate: string) => {
    const today = new Date()
    const scheduled = new Date(scheduledDate)
    const days = differenceInDays(scheduled, today)
    
    if (days === 0) return 'Today'
    if (days === 1) return 'Tomorrow'
    return `In ${days} days`
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-purple-500" />
            Upcoming This Week
          </CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="border-purple-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-purple-500" />
              Upcoming This Week
              {touchpoints.length > 0 && (
                <Badge variant="secondary" className="ml-2 bg-purple-100 text-purple-700">
                  {touchpoints.length}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Next 7 days touchpoints</CardDescription>
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
            <CalendarDays className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="font-medium">No upcoming touchpoints</p>
            <p className="text-sm">All clear for the week!</p>
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
                    <Badge variant="outline" className="text-xs">
                      {getDaysUntil(touchpoint.next_scheduled_date)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      {touchpointTypeLabels[touchpoint.touchpoint_type as keyof typeof touchpointTypeLabels]}
                    </span>
                  </div>

                  <div className="text-xs text-muted-foreground mt-1">
                    {format(new Date(touchpoint.next_scheduled_date), 'EEEE, MMM d')}
                    {touchpoint.preferred_time && ` at ${touchpoint.preferred_time}`}
                  </div>

                  {touchpoint.assigned_user && (
                    <div className="text-xs text-muted-foreground">
                      Assigned to: {touchpoint.assigned_user.full_name}
                    </div>
                  )}
                </div>

                <Link href={`/crm/dealers/${touchpoint.dealer_id}`}>
                  <Button size="sm" variant="outline" className="flex-shrink-0">
                    View
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
