"use client"

import { useEffect, useState } from 'react'
import { activitiesAPI } from '@/lib/supabase/activities'

export interface Activity {
  id: string
  type: string
  title: string
  date: string
  time: string
  performedBy: string
  outcome: string
  notes: string
}

export function useFarmerActivities(farmerId: string) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchActivities() {
      if (!farmerId) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        // Use the farmer_activities table which consolidates all activities
        const { data, error: err } = await activitiesAPI.getByFarmerId(farmerId)

        if (err) throw err

        // Format activities for display
        const formattedActivities: Activity[] = (data || []).map((activity: any) => {
          const activityDate = new Date(activity.activity_date)
          const dateStr = activityDate.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          })
          const timeStr = activityDate.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })

          return {
            id: activity.id,
            type: activity.activity_type,
            title: activity.activity_title,
            date: dateStr,
            time: timeStr,
            performedBy: activity.user_profiles?.full_name || 'Unknown',
            outcome: activity.activity_outcome || 'N/A',
            notes: activity.activity_description || 'No notes'
          }
        })

        setActivities(formattedActivities)
      } catch (err: any) {
        console.error('Error fetching activities:', err)
        setError(err.message || 'Failed to load activities')
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [farmerId])

  return { activities, activitiesLoading: loading, activitiesError: error }
}
