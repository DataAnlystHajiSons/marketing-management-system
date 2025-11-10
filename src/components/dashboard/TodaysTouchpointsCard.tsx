"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, Phone, Calendar, CheckCircle2 } from 'lucide-react'
import { dealerTouchpointsAPI, touchpointTypeLabels } from '@/lib/supabase/dealer-touchpoints'
import { format } from 'date-fns'
import Link from 'next/link'

export function TodaysTouchpointsCard() {
  const [touchpoints, setTouchpoints] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTodaysTouchpoints()
  }, [])

  const loadTodaysTouchpoints = async () => {
    setLoading(true)
    const { data, error } = await dealerTouchpointsAPI.getToday()
    if (!error && data) {
      setTouchpoints(data)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            Today's Schedule
          </CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const completedCount = touchpoints.filter(t => t.last_executed_date === new Date().toISOString().split('T')[0]).length
  const totalCount = touchpoints.length

  return (
    <Card className="border-blue-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              Today's Schedule
              {totalCount > 0 && (
                <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700">
                  {completedCount}/{totalCount}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Touchpoints scheduled for today</CardDescription>
          </div>
          {totalCount > 0 && (
            <Link href="/crm/dealers">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {totalCount === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="font-medium">No touchpoints today</p>
            <p className="text-sm">Enjoy your free schedule!</p>
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
                    {touchpoint.preferred_time && (
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {touchpoint.preferred_time}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      {touchpointTypeLabels[touchpoint.touchpoint_type as keyof typeof touchpointTypeLabels]}
                    </span>
                  </div>

                  {touchpoint.assigned_user && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Assigned to: {touchpoint.assigned_user.full_name}
                    </div>
                  )}
                </div>

                <Link href={`/crm/dealers/${touchpoint.dealer_id}`}>
                  <Button size="sm" variant="default" className="flex-shrink-0">
                    <Phone className="h-3 w-3 mr-1" />
                    Call
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
