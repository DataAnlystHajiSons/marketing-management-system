import { supabase } from './client'

export interface ActivityFormData {
  farmer_id: string
  activity_type: string
  activity_title: string
  activity_description?: string
  activity_outcome?: string
  performed_by?: string
  engagement_id?: string
  next_action?: string
  next_action_date?: string
  tags?: string[]
}

export interface Activity {
  id: string
  farmer_id: string
  activity_type: string
  activity_date: string
  activity_title: string
  activity_description: string | null
  activity_outcome: string | null
  performed_by: string | null
  engagement_id: string | null
  related_id: string | null
  next_action: string | null
  next_action_date: string | null
  tags: string[] | null
  created_at: string
}

export const activitiesAPI = {
  // Create a new activity
  async create(data: ActivityFormData) {
    try {
      // Sanitize data: convert empty strings to undefined for date fields
      const insertData = {
        ...data,
        activity_date: new Date().toISOString(),
        next_action_date: data.next_action_date || undefined, // Convert empty string to undefined
        activity_description: data.activity_description || undefined,
        activity_outcome: data.activity_outcome || undefined,
        next_action: data.next_action || undefined,
        engagement_id: data.engagement_id || undefined,
      }
      
      console.log('=== ACTIVITY CREATE DEBUG ===')
      console.log('1. Input data:', JSON.stringify(data, null, 2))
      console.log('2. Insert data:', JSON.stringify(insertData, null, 2))
      
      const { data: result, error } = await supabase
        .from('farmer_activities')
        .insert([insertData])
        .select()
        .single()

      console.log('3. Supabase response - result:', result)
      console.log('4. Supabase response - error:', error)

      if (error) {
        console.error('5. Full error object:', JSON.stringify(error, null, 2))
        console.error('6. Error properties:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          ...error
        })
        return { data: null, error }
      }
      
      console.log('7. Success! Activity created:', result)
      return { data: result, error: null }
    } catch (error: any) {
      console.error('8. Caught exception:', error)
      console.error('9. Exception stringified:', JSON.stringify(error, null, 2))
      return { data: null, error }
    }
  },

  // Get all activities for a farmer
  async getByFarmerId(farmerId: string) {
    try {
      const { data, error } = await supabase
        .from('farmer_activities')
        .select(`
          *,
          user_profiles:performed_by (
            id,
            full_name,
            email,
            role
          )
        `)
        .eq('farmer_id', farmerId)
        .order('activity_date', { ascending: false })

      if (error) throw error
      return { data, error: null }
    } catch (error: any) {
      console.error('Error fetching activities:', error)
      return { data: null, error }
    }
  },

  // Get recent activities across all farmers
  async getRecent(limit: number = 20) {
    try {
      const { data, error } = await supabase
        .from('farmer_activities')
        .select(`
          *,
          farmers (
            id,
            farmer_code,
            full_name,
            phone
          ),
          user_profiles:performed_by (
            id,
            full_name
          )
        `)
        .order('activity_date', { ascending: false })
        .limit(limit)

      if (error) throw error
      return { data, error: null }
    } catch (error: any) {
      console.error('Error fetching recent activities:', error)
      return { data: null, error }
    }
  },

  // Update an activity
  async update(id: string, data: Partial<ActivityFormData>) {
    try {
      const { data: result, error } = await supabase
        .from('farmer_activities')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return { data: result, error: null }
    } catch (error: any) {
      console.error('Error updating activity:', error)
      return { data: null, error }
    }
  },

  // Delete an activity
  async delete(id: string) {
    try {
      const { error } = await supabase
        .from('farmer_activities')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { error: null }
    } catch (error: any) {
      console.error('Error deleting activity:', error)
      return { error }
    }
  },

  // Get activity statistics for a farmer
  async getStats(farmerId: string) {
    try {
      const { data, error } = await supabase
        .from('farmer_activities')
        .select('activity_type')
        .eq('farmer_id', farmerId)

      if (error) throw error

      const stats = {
        total: data?.length || 0,
        calls: data?.filter(a => a.activity_type === 'call').length || 0,
        visits: data?.filter(a => a.activity_type === 'visit').length || 0,
        meetings: data?.filter(a => a.activity_type === 'meeting').length || 0,
        notes: data?.filter(a => a.activity_type === 'note').length || 0,
      }

      return { data: stats, error: null }
    } catch (error: any) {
      console.error('Error fetching activity stats:', error)
      return { data: null, error }
    }
  }
}
