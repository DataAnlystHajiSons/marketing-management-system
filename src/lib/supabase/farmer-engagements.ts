import { supabase } from './client'

export type DataSourceType = 
  | 'data_bank'
  | 'fm_invitees'
  | 'fm_attendees'
  | 'fd_invitees'
  | 'fd_attendees'
  | 'repzo'
  | 'manual_entry'
  | 'api_integration'
  | 'other'

export type LeadStage = 
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'meeting_invited'
  | 'meeting_attended'
  | 'visit_scheduled'
  | 'visit_completed'
  | 'interested'
  | 'negotiation'
  | 'converted'
  | 'active_customer'
  | 'inactive'
  | 'lost'
  | 'rejected'

export interface FarmerEngagement {
  id: string
  farmer_id: string
  product_id: string | null
  season: string
  data_source: DataSourceType
  entry_date: string
  source_reference?: string
  lead_stage: LeadStage
  lead_score: number
  lead_quality: 'hot' | 'warm' | 'cold'
  stage_changed_at: string
  days_in_current_stage: number
  is_converted: boolean
  conversion_date?: string
  total_purchases: number
  last_contact_date?: string
  last_activity_date?: string
  next_follow_up_date?: string
  follow_up_required: boolean
  follow_up_notes?: string
  total_interactions: number
  assigned_tmo_id?: string
  assigned_field_staff_id?: string
  source_meeting_id?: string
  source_event_id?: string
  source_list_id?: string
  is_active: boolean
  closure_reason?: string
  closure_date?: string
  notes?: string
  tags?: string[]
  created_by?: string
  created_at: string
  updated_at: string
}

export interface EngagementWithRelations extends FarmerEngagement {
  farmer?: {
    id: string
    farmer_code: string
    full_name: string
    phone: string
    village?: string
  }
  product?: {
    id: string
    product_code: string
    product_name: string
    category?: string
  }
  assigned_tmo?: {
    id: string
    full_name: string
    email: string
  }
  assigned_field_staff?: {
    id: string
    staff_code: string
    full_name: string
  }
}

export interface CreateEngagementData {
  farmer_id: string
  product_id?: string
  season: string
  data_source: DataSourceType
  source_reference?: string
  lead_stage?: LeadStage
  assigned_tmo_id?: string
  assigned_field_staff_id?: string
  source_meeting_id?: string
  source_event_id?: string
  source_list_id?: string
  notes?: string
  tags?: string[]
}

export interface UpdateEngagementData {
  lead_stage?: LeadStage
  lead_score?: number
  next_follow_up_date?: string
  follow_up_required?: boolean
  follow_up_notes?: string
  is_converted?: boolean
  conversion_date?: string
  total_purchases?: number
  closure_reason?: string
  is_active?: boolean
  notes?: string
  tags?: string[]
}

export const farmerEngagementsAPI = {
  // Get all engagements with filters
  getAll: async (filters?: {
    farmer_id?: string
    product_id?: string
    season?: string
    data_source?: DataSourceType
    lead_stage?: LeadStage
    is_active?: boolean
    assigned_tmo_id?: string
  }) => {
    let query = supabase
      .from('farmer_product_engagements')
      .select(`
        *,
        farmer:farmers!farmer_product_engagements_farmer_id_fkey(
          id,
          farmer_code,
          full_name,
          phone,
          village
        ),
        product:products!farmer_product_engagements_product_id_fkey(
          id,
          product_code,
          product_name,
          category
        ),
        assigned_tmo:user_profiles!farmer_product_engagements_assigned_tmo_id_fkey(
          id,
          full_name,
          email
        ),
        assigned_field_staff:field_staff!farmer_product_engagements_assigned_field_staff_id_fkey(
          id,
          staff_code,
          full_name
        )
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters?.farmer_id) query = query.eq('farmer_id', filters.farmer_id)
    if (filters?.product_id) query = query.eq('product_id', filters.product_id)
    if (filters?.season) query = query.eq('season', filters.season)
    if (filters?.data_source) query = query.eq('data_source', filters.data_source)
    if (filters?.lead_stage) query = query.eq('lead_stage', filters.lead_stage)
    if (filters?.is_active !== undefined) query = query.eq('is_active', filters.is_active)
    if (filters?.assigned_tmo_id) query = query.eq('assigned_tmo_id', filters.assigned_tmo_id)

    const { data, error } = await query
    return { data: data as EngagementWithRelations[] | null, error }
  },

  // Get engagement by ID
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('farmer_product_engagements')
      .select(`
        *,
        farmer:farmers!farmer_product_engagements_farmer_id_fkey(
          id,
          farmer_code,
          full_name,
          phone,
          village,
          city,
          district,
          land_size_acres,
          primary_crops
        ),
        product:products!farmer_product_engagements_product_id_fkey(
          id,
          product_code,
          product_name,
          category,
          sub_category
        ),
        assigned_tmo:user_profiles!farmer_product_engagements_assigned_tmo_id_fkey(
          id,
          full_name,
          email,
          role
        ),
        assigned_field_staff:field_staff!farmer_product_engagements_assigned_field_staff_id_fkey(
          id,
          staff_code,
          full_name,
          phone
        )
      `)
      .eq('id', id)
      .single()

    return { data: data as EngagementWithRelations | null, error }
  },

  // Get active engagements for a farmer
  getByFarmerId: async (farmerId: string, activeOnly: boolean = true) => {
    let query = supabase
      .from('farmer_product_engagements')
      .select(`
        *,
        product:products!farmer_product_engagements_product_id_fkey(
          id,
          product_code,
          product_name,
          category
        ),
        assigned_tmo:user_profiles!farmer_product_engagements_assigned_tmo_id_fkey(
          id,
          full_name
        )
      `)
      .eq('farmer_id', farmerId)
      .order('created_at', { ascending: false })

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query
    return { data, error }
  },

  // Create new engagement
  create: async (engagementData: CreateEngagementData) => {
    // Get current user for created_by
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('farmer_product_engagements')
      .insert({
        ...engagementData,
        created_by: user?.id,
      })
      .select()
      .single()

    return { data, error }
  },

  // Update engagement
  update: async (id: string, updateData: UpdateEngagementData) => {
    const { data, error } = await supabase
      .from('farmer_product_engagements')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    return { data, error }
  },

  // Update lead stage (with history tracking via database function)
  updateStage: async (id: string, newStage: LeadStage, changedBy?: string, reason?: string) => {
    try {
      // Call the database function to update stage and track history
      const { error } = await supabase.rpc('update_engagement_stage', {
        p_engagement_id: id,
        p_new_stage: newStage,
        p_changed_by: changedBy || null,
        p_reason: reason || null,
        p_triggered_by: 'manual',
      })

      if (error) throw error

      // Fetch updated engagement
      const { data, error: fetchError } = await supabase
        .from('farmer_product_engagements')
        .select()
        .eq('id', id)
        .single()

      return { data, error: fetchError }
    } catch (error: any) {
      return { data: null, error }
    }
  },

  // Mark as converted
  markConverted: async (id: string, totalPurchases?: number) => {
    const { data, error } = await supabase
      .from('farmer_product_engagements')
      .update({
        is_converted: true,
        conversion_date: new Date().toISOString(),
        lead_stage: 'converted',
        total_purchases: totalPurchases || 0,
      })
      .eq('id', id)
      .select()
      .single()

    return { data, error }
  },

  // Close engagement
  close: async (id: string, reason: string) => {
    const { data, error } = await supabase
      .from('farmer_product_engagements')
      .update({
        is_active: false,
        closure_reason: reason,
        closure_date: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    return { data, error }
  },

  // Reopen engagement
  reopen: async (id: string) => {
    const { data, error } = await supabase
      .from('farmer_product_engagements')
      .update({
        is_active: true,
        closure_reason: null,
        closure_date: null,
      })
      .eq('id', id)
      .select()
      .single()

    return { data, error }
  },

  // Calculate and update engagement score
  recalculateScore: async (id: string) => {
    const { data, error } = await supabase.rpc('calculate_engagement_score', {
      p_engagement_id: id,
    })

    if (error) return { data: null, error }

    // Update the engagement with new score
    return await supabase
      .from('farmer_product_engagements')
      .update({ lead_score: data })
      .eq('id', id)
      .select()
      .single()
  },

  // Bulk create engagements (for list upload)
  bulkCreate: async (engagements: CreateEngagementData[]) => {
    const { data: { user } } = await supabase.auth.getUser()

    const engagementsWithCreator = engagements.map(eng => ({
      ...eng,
      created_by: user?.id,
    }))

    const { data, error } = await supabase
      .from('farmer_product_engagements')
      .insert(engagementsWithCreator)
      .select()

    return { data, error }
  },

  // Get engagement statistics
  getStats: async (filters?: {
    product_id?: string
    season?: string
    data_source?: DataSourceType
    assigned_tmo_id?: string
  }) => {
    let query = supabase
      .from('farmer_product_engagements')
      .select('id, lead_stage, is_converted, lead_quality, data_source')
      .eq('is_active', true)

    if (filters?.product_id) query = query.eq('product_id', filters.product_id)
    if (filters?.season) query = query.eq('season', filters.season)
    if (filters?.data_source) query = query.eq('data_source', filters.data_source)
    if (filters?.assigned_tmo_id) query = query.eq('assigned_tmo_id', filters.assigned_tmo_id)

    const { data, error } = await query

    if (error || !data) return { data: null, error }

    const stats = {
      total: data.length,
      converted: data.filter(e => e.is_converted).length,
      conversionRate: data.length > 0 
        ? ((data.filter(e => e.is_converted).length / data.length) * 100).toFixed(2)
        : '0',
      hot: data.filter(e => e.lead_quality === 'hot').length,
      warm: data.filter(e => e.lead_quality === 'warm').length,
      cold: data.filter(e => e.lead_quality === 'cold').length,
      byStage: data.reduce((acc, e) => {
        acc[e.lead_stage] = (acc[e.lead_stage] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      bySource: data.reduce((acc, e) => {
        acc[e.data_source] = (acc[e.data_source] || 0) + 1
        return acc
      }, {} as Record<string, number>),
    }

    return { data: stats, error: null }
  },

  // Get seasons list
  getSeasons: async () => {
    const { data, error } = await supabase
      .from('farmer_product_engagements')
      .select('season')
      .order('season', { ascending: false })

    if (error || !data) return { data: [], error }

    // Get unique seasons
    const uniqueSeasons = [...new Set(data.map(item => item.season))]
    return { data: uniqueSeasons, error: null }
  },

  // Check if engagement exists
  exists: async (farmerId: string, productId: string, season: string) => {
    const { data, error } = await supabase
      .from('farmer_product_engagements')
      .select('id')
      .eq('farmer_id', farmerId)
      .eq('product_id', productId)
      .eq('season', season)
      .single()

    return { exists: !!data, engagementId: data?.id, error }
  },

  // =============================================
  // FOLLOW-UP MANAGEMENT
  // =============================================

  // Set follow-up for an engagement
  setFollowUp: async (engagementId: string, followUpDate: string, notes?: string) => {
    const { data, error } = await supabase
      .from('farmer_product_engagements')
      .update({
        follow_up_required: true,
        next_follow_up_date: followUpDate,
        follow_up_notes: notes,
      })
      .eq('id', engagementId)
      .select()
      .single()

    return { data, error }
  },

  // Mark follow-up as complete
  completeFollowUp: async (engagementId: string) => {
    const { data, error } = await supabase
      .from('farmer_product_engagements')
      .update({
        follow_up_required: false,
        last_contact_date: new Date().toISOString(),
      })
      .eq('id', engagementId)
      .select()
      .single()

    return { data, error }
  },

  // Get engagements needing follow-up
  getFollowUpsDue: async (filters?: {
    tmoId?: string
    dueDate?: string // 'today', 'overdue', 'this_week', or specific date
    productId?: string
    season?: string
  }) => {
    let query = supabase
      .from('farmer_product_engagements')
      .select(`
        *,
        farmer:farmers (
          id,
          farmer_code,
          full_name,
          phone,
          village,
          city
        ),
        product:products (
          id,
          product_code,
          product_name
        ),
        assigned_tmo:user_profiles!farmer_product_engagements_assigned_tmo_id_fkey (
          id,
          full_name,
          email
        )
      `)
      .eq('follow_up_required', true)
      .eq('is_active', true)
      .order('next_follow_up_date', { ascending: true })

    // Filter by TMO
    if (filters?.tmoId) {
      query = query.eq('assigned_tmo_id', filters.tmoId)
    }

    // Filter by product
    if (filters?.productId) {
      query = query.eq('product_id', filters.productId)
    }

    // Filter by season
    if (filters?.season) {
      query = query.eq('season', filters.season)
    }

    // Filter by due date
    if (filters?.dueDate) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      switch (filters.dueDate) {
        case 'today':
          const endOfToday = new Date(today)
          endOfToday.setHours(23, 59, 59, 999)
          query = query
            .gte('next_follow_up_date', today.toISOString().split('T')[0])
            .lte('next_follow_up_date', endOfToday.toISOString().split('T')[0])
          break
        
        case 'overdue':
          query = query.lt('next_follow_up_date', today.toISOString().split('T')[0])
          break
        
        case 'this_week':
          const endOfWeek = new Date(today)
          endOfWeek.setDate(today.getDate() + 7)
          query = query
            .gte('next_follow_up_date', today.toISOString().split('T')[0])
            .lte('next_follow_up_date', endOfWeek.toISOString().split('T')[0])
          break
        
        default:
          // Specific date
          query = query.eq('next_follow_up_date', filters.dueDate)
      }
    }

    const { data, error } = await query
    return { data, error }
  },

  // Get follow-up statistics
  getFollowUpStats: async (tmoId?: string) => {
    let query = supabase
      .from('farmer_product_engagements')
      .select('next_follow_up_date, follow_up_required, is_active')
      .eq('follow_up_required', true)
      .eq('is_active', true)

    if (tmoId) {
      query = query.eq('assigned_tmo_id', tmoId)
    }

    const { data, error } = await query

    if (error || !data) return { data: null, error }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const endOfWeek = new Date(today)
    endOfWeek.setDate(today.getDate() + 7)

    const stats = {
      total: data.length,
      overdue: data.filter(e => {
        const followUpDate = new Date(e.next_follow_up_date!)
        return followUpDate < today
      }).length,
      today: data.filter(e => {
        const followUpDate = new Date(e.next_follow_up_date!)
        return followUpDate.toDateString() === today.toDateString()
      }).length,
      thisWeek: data.filter(e => {
        const followUpDate = new Date(e.next_follow_up_date!)
        return followUpDate >= today && followUpDate <= endOfWeek
      }).length,
      upcoming: data.filter(e => {
        const followUpDate = new Date(e.next_follow_up_date!)
        return followUpDate > endOfWeek
      }).length,
    }

    return { data: stats, error: null }
  },

  // =============================================
  // STAGE HISTORY MANAGEMENT
  // =============================================

  // Get stage history for an engagement
  getStageHistory: async (engagementId: string) => {
    const { data, error } = await supabase
      .from('engagement_stage_history')
      .select(`
        *,
        changed_by_user:user_profiles!engagement_stage_history_changed_by_fkey (
          id,
          full_name,
          email
        )
      `)
      .eq('engagement_id', engagementId)
      .order('created_at', { ascending: false })

    return { data, error }
  },

  // Get stage timeline using database function
  getStageTimeline: async (engagementId: string) => {
    const { data, error } = await supabase.rpc('get_engagement_stage_timeline', {
      p_engagement_id: engagementId
    })

    return { data, error }
  },

  // Get engagement journey view
  getEngagementJourney: async (filters?: { farmerId?: string, productId?: string, season?: string }) => {
    let query = supabase
      .from('v_engagement_journey')
      .select('*')
      .order('engagement_start_date', { ascending: false })

    if (filters?.farmerId) {
      query = query.eq('farmer_id', filters.farmerId)
    }

    if (filters?.productId) {
      query = query.eq('product_id', filters.productId)
    }

    if (filters?.season) {
      query = query.eq('season', filters.season)
    }

    const { data, error } = await query
    return { data, error }
  },

  // Get stage performance analytics
  getStagePerformance: async () => {
    const { data, error } = await supabase
      .from('v_engagement_stage_performance')
      .select('*')

    return { data, error }
  },
}
