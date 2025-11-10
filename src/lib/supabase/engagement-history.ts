import { supabase } from './client'

export interface EngagementHistoryEntry {
  id: string
  engagement_id: string
  changed_at: string
  field_changed: string
  old_value: string | null
  new_value: string | null
  changed_by: string | null
  change_reason: string | null
  metadata: Record<string, any> | null
  created_at: string
  // Relations
  changed_by_user?: {
    id: string
    full_name: string
    email: string
  }
  product?: {
    id: string
    product_name: string
    product_code: string
  }
}

export interface EngagementHistoryWithContext extends EngagementHistoryEntry {
  display_text: string
  display_icon: string
  display_color: string
}

// Data source labels and icons
const DATA_SOURCE_INFO: Record<string, { label: string; icon: string; color: string }> = {
  fm_invitees: { label: 'Event Invitee', icon: '✉️', color: 'blue' },
  fm_attendees: { label: 'Event Attendee', icon: '🎯', color: 'purple' },
  fd_invitees: { label: 'Field Day Invitee', icon: '🌾', color: 'green' },
  fd_attendees: { label: 'Field Day Attendee', icon: '🌾', color: 'emerald' },
  data_bank: { label: 'Data Bank', icon: '📊', color: 'slate' },
  repzo: { label: 'Repzo Import', icon: '🔄', color: 'indigo' },
  manual_entry: { label: 'Manual Entry', icon: '✍️', color: 'gray' },
  api_integration: { label: 'API Integration', icon: '🔗', color: 'cyan' },
  other: { label: 'Other Source', icon: '📁', color: 'gray' },
}

// Lead stage labels and icons
const LEAD_STAGE_INFO: Record<string, { label: string; icon: string; color: string }> = {
  new: { label: 'New Lead', icon: '🆕', color: 'slate' },
  contacted: { label: 'Contacted', icon: '📞', color: 'blue' },
  qualified: { label: 'Qualified', icon: '✅', color: 'cyan' },
  meeting_invited: { label: 'Meeting Invited', icon: '📧', color: 'indigo' },
  meeting_attended: { label: 'Meeting Attended', icon: '🤝', color: 'purple' },
  visit_scheduled: { label: 'Visit Scheduled', icon: '📅', color: 'violet' },
  visit_completed: { label: 'Visit Completed', icon: '✓', color: 'fuchsia' },
  interested: { label: 'Interested', icon: '💡', color: 'pink' },
  negotiation: { label: 'In Negotiation', icon: '💬', color: 'amber' },
  converted: { label: 'Converted', icon: '🎉', color: 'green' },
  active_customer: { label: 'Active Customer', icon: '⭐', color: 'emerald' },
  inactive: { label: 'Inactive', icon: '💤', color: 'gray' },
  lost: { label: 'Lost', icon: '❌', color: 'red' },
  rejected: { label: 'Rejected', icon: '⛔', color: 'orange' },
}

/**
 * Format history entry for display
 */
function formatHistoryEntry(entry: EngagementHistoryEntry): EngagementHistoryWithContext {
  let displayText = ''
  let displayIcon = '📝'
  let displayColor = 'gray'
  
  // Get product name prefix if available
  const productPrefix = entry.product?.product_name ? `${entry.product.product_name}: ` : ''

  if (entry.field_changed === 'created') {
    displayText = productPrefix + (entry.change_reason || 'Engagement created')
    displayIcon = '✨'
    displayColor = 'green'
  } else if (entry.field_changed === 'data_source') {
    const oldSource = entry.old_value ? DATA_SOURCE_INFO[entry.old_value] : null
    const newSource = entry.new_value ? DATA_SOURCE_INFO[entry.new_value] : null
    
    if (!oldSource && newSource) {
      displayText = productPrefix + `Added as ${newSource.label}`
      displayIcon = newSource.icon
      displayColor = newSource.color
    } else if (oldSource && newSource) {
      displayText = productPrefix + `Updated from ${oldSource.label} to ${newSource.label}`
      displayIcon = '🔄'
      displayColor = newSource.color
    }
  } else if (entry.field_changed === 'lead_stage') {
    const oldStage = entry.old_value ? LEAD_STAGE_INFO[entry.old_value] : null
    const newStage = entry.new_value ? LEAD_STAGE_INFO[entry.new_value] : null
    
    if (!oldStage && newStage) {
      displayText = productPrefix + `Stage set to ${newStage.label}`
      displayIcon = newStage.icon
      displayColor = newStage.color
    } else if (oldStage && newStage) {
      displayText = productPrefix + `Stage changed from ${oldStage.label} to ${newStage.label}`
      displayIcon = '➡️'
      displayColor = newStage.color
    }
  } else if (entry.field_changed === 'is_converted') {
    if (entry.new_value === 'true') {
      displayText = productPrefix + 'Converted to customer! 🎉'
      displayIcon = '🎉'
      displayColor = 'green'
    } else {
      displayText = productPrefix + 'Conversion status changed'
      displayIcon = '🔄'
      displayColor = 'gray'
    }
  } else if (entry.field_changed === 'assigned_tmo_id') {
    displayText = productPrefix + (entry.old_value 
      ? 'TMO assignment changed' 
      : 'TMO assigned')
    displayIcon = '👤'
    displayColor = 'blue'
  } else if (entry.field_changed === 'assigned_field_staff_id') {
    displayText = productPrefix + (entry.old_value 
      ? 'Field staff assignment changed' 
      : 'Field staff assigned')
    displayIcon = '👨‍🌾'
    displayColor = 'green'
  } else {
    displayText = productPrefix + (entry.change_reason || `${entry.field_changed} changed`)
    displayIcon = '📝'
    displayColor = 'gray'
  }

  return {
    ...entry,
    display_text: displayText,
    display_icon: displayIcon,
    display_color: displayColor,
  }
}

// Helper function to calculate funnel from data
function getConversionFunnelFromData(data: any[]) {
  const funnel = {
    fm_invitees: 0,
    fm_attendees: 0,
    fd_invitees: 0,
    fd_attendees: 0,
    invitee_to_attendee_rate: 0,
  }

  data?.forEach(entry => {
    if (entry.new_value === 'fm_invitees') funnel.fm_invitees++
    if (entry.new_value === 'fm_attendees') funnel.fm_attendees++
    if (entry.new_value === 'fd_invitees') funnel.fd_invitees++
    if (entry.new_value === 'fd_attendees') funnel.fd_attendees++
  })

  if (funnel.fm_invitees > 0) {
    funnel.invitee_to_attendee_rate = 
      (funnel.fm_attendees / funnel.fm_invitees) * 100
  }

  return { data: funnel, error: null }
}

export const engagementHistoryAPI = {
  /**
   * Get complete history for an engagement
   */
  getByEngagementId: async (engagementId: string) => {
    // First get engagement with product info
    const { data: engagement } = await supabase
      .from('farmer_product_engagements')
      .select(`
        id,
        product:products(
          id,
          product_name,
          product_code
        )
      `)
      .eq('id', engagementId)
      .single()

    const { data, error } = await supabase
      .from('engagement_history')
      .select('*')
      .eq('engagement_id', engagementId)
      .order('changed_at', { ascending: false })

    if (error) return { data: null, error }

    // Get unique user IDs
    const userIds = [...new Set(data?.map(e => e.changed_by).filter(Boolean) || [])]
    
    // Fetch user profiles separately if needed
    let userProfiles: any = {}
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, full_name, email')
        .in('id', userIds)
      
      profiles?.forEach(p => {
        userProfiles[p.id] = p
      })
    }

    // Format entries for display
    const formattedData = data?.map(entry => {
      const userProfile = entry.changed_by ? userProfiles[entry.changed_by] : null
      const formattedEntry = formatHistoryEntry({
        ...entry,
        product: engagement?.product || undefined, // Add product info
        changed_by_user: userProfile ? {
          id: userProfile.id,
          email: userProfile.email || 'Unknown',
          full_name: userProfile.full_name || 'System',
        } : undefined,
      })
      return formattedEntry
    })

    return { data: formattedData, error: null }
  },

  /**
   * Get history for all engagements of a farmer
   */
  getByFarmerId: async (farmerId: string) => {
    // First, get all engagements for this farmer WITH product info
    const { data: engagements } = await supabase
      .from('farmer_product_engagements')
      .select(`
        id,
        product_id,
        product:products(
          id,
          product_name,
          product_code
        )
      `)
      .eq('farmer_id', farmerId)

    if (!engagements || engagements.length === 0) {
      return { data: [], error: null }
    }

    const engagementIds = engagements.map(e => e.id)
    
    // Create a map of engagement_id -> product info
    const engagementProductMap: Record<string, any> = {}
    engagements.forEach(eng => {
      engagementProductMap[eng.id] = eng.product
    })

    // Then get history for those engagements
    const { data, error } = await supabase
      .from('engagement_history')
      .select('*')
      .in('engagement_id', engagementIds)
      .order('changed_at', { ascending: false })

    if (error) return { data: null, error }

    // Get unique user IDs
    const userIds = [...new Set(data?.map(e => e.changed_by).filter(Boolean) || [])]
    
    // Fetch user profiles separately if needed
    let userProfiles: any = {}
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, full_name, email')
        .in('id', userIds)
      
      profiles?.forEach(p => {
        userProfiles[p.id] = p
      })
    }

    // Format entries for display with product info
    const formattedData = data?.map(entry => {
      const userProfile = entry.changed_by ? userProfiles[entry.changed_by] : null
      const product = engagementProductMap[entry.engagement_id]
      
      return formatHistoryEntry({
        ...entry,
        product, // Add product info to each entry
        changed_by_user: userProfile ? {
          id: userProfile.id,
          email: userProfile.email || 'Unknown',
          full_name: userProfile.full_name || 'System',
        } : undefined,
      })
    })

    return { data: formattedData, error: null }
  },

  /**
   * Manually log a change (for custom events)
   */
  logChange: async (data: {
    engagement_id: string
    field_changed: string
    old_value?: string | null
    new_value?: string | null
    change_reason?: string
    metadata?: Record<string, any>
  }) => {
    const { data: result, error } = await supabase
      .from('engagement_history')
      .insert({
        ...data,
        changed_by: (await supabase.auth.getUser()).data.user?.id,
      })
      .select()
      .single()

    return { data: result, error }
  },

  /**
   * Get conversion funnel data (analytics)
   */
  getConversionFunnel: async (filters?: {
    startDate?: string
    endDate?: string
    productId?: string
  }) => {
    let query = supabase
      .from('engagement_history')
      .select('*')
      .eq('field_changed', 'data_source')

    if (filters?.startDate) {
      query = query.gte('changed_at', filters.startDate)
    }
    if (filters?.endDate) {
      query = query.lte('changed_at', filters.endDate)
    }

    const { data, error } = await query

    if (error) return { data: null, error }
    
    // Filter by product if needed
    if (filters?.productId) {
      const { data: engagements } = await supabase
        .from('farmer_product_engagements')
        .select('id')
        .eq('product_id', filters.productId)
      
      const engagementIds = engagements?.map(e => e.id) || []
      // Filter data to only include matching engagements
      const filteredData = data?.filter(entry => 
        engagementIds.includes(entry.engagement_id)
      )
      return getConversionFunnelFromData(filteredData || [])
    }

    // Analyze conversion funnel
    return getConversionFunnelFromData(data || [])
  },
}
