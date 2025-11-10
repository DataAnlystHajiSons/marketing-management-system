import { supabase } from './client'

export type TouchpointType = 
  | 'monthly_stock_report'
  | 'weekly_review'
  | 'sales_target_review'
  | 'payment_followup'
  | 'order_confirmation'
  | 'product_promotion'
  | 'training_invitation'
  | 'relationship_building'

export type TouchpointFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly'

export interface DealerTouchpoint {
  id: string
  dealer_id: string
  touchpoint_type: TouchpointType
  frequency: TouchpointFrequency
  preferred_day_of_week?: number // 1-7 (Monday-Sunday)
  preferred_time?: string // HH:MM format
  assigned_to?: string
  last_executed_date?: string
  next_scheduled_date?: string
  is_active: boolean
  auto_reminder?: boolean
  reminder_days_before?: number
  notes?: string
  created_at: string
  updated_at: string
}

export const touchpointTypeLabels: Record<TouchpointType, string> = {
  monthly_stock_report: 'Monthly Stock Report',
  weekly_review: 'Weekly Review',
  sales_target_review: 'Sales Target Review',
  payment_followup: 'Payment Follow-up',
  order_confirmation: 'Order Confirmation',
  product_promotion: 'Product Promotion',
  training_invitation: 'Training Invitation',
  relationship_building: 'Relationship Building'
}

export const dealerTouchpointsAPI = {
  // Get all touchpoints for a dealer
  getByDealer: async (dealerId: string) => {
    const { data, error } = await supabase
      .from('dealer_touchpoint_schedule')
      .select(`
        *,
        assigned_user:user_profiles(id, full_name, email)
      `)
      .eq('dealer_id', dealerId)
      .order('created_at', { ascending: false })
    
    return { data, error }
  },

  // Get overdue touchpoints for a user
  getOverdue: async (userId?: string) => {
    let query = supabase
      .from('dealer_touchpoint_schedule')
      .select(`
        *,
        dealer:dealers(id, dealer_code, business_name, phone),
        assigned_user:user_profiles(id, full_name)
      `)
      .eq('is_active', true)
      .lt('next_scheduled_date', new Date().toISOString().split('T')[0])
    
    if (userId) {
      query = query.eq('assigned_to', userId)
    }
    
    const { data, error } = await query.order('next_scheduled_date', { ascending: true })
    
    return { data, error }
  },

  // Get today's scheduled touchpoints
  getToday: async (userId?: string) => {
    const today = new Date().toISOString().split('T')[0]
    
    let query = supabase
      .from('dealer_touchpoint_schedule')
      .select(`
        *,
        dealer:dealers(id, dealer_code, business_name, phone),
        assigned_user:user_profiles(id, full_name)
      `)
      .eq('is_active', true)
      .eq('next_scheduled_date', today)
    
    if (userId) {
      query = query.eq('assigned_to', userId)
    }
    
    const { data, error } = await query.order('preferred_time', { ascending: true })
    
    return { data, error }
  },

  // Get upcoming touchpoints (next 7 days)
  getUpcoming: async (userId?: string, days: number = 7) => {
    const today = new Date().toISOString().split('T')[0]
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + days)
    const endDate = futureDate.toISOString().split('T')[0]
    
    let query = supabase
      .from('dealer_touchpoint_schedule')
      .select(`
        *,
        dealer:dealers(id, dealer_code, business_name, phone),
        assigned_user:user_profiles(id, full_name)
      `)
      .eq('is_active', true)
      .gte('next_scheduled_date', today)
      .lte('next_scheduled_date', endDate)
    
    if (userId) {
      query = query.eq('assigned_to', userId)
    }
    
    const { data, error } = await query.order('next_scheduled_date', { ascending: true })
    
    return { data, error }
  },

  // Create a new touchpoint
  create: async (touchpoint: Partial<DealerTouchpoint>) => {
    // Calculate initial next_scheduled_date
    const nextDate = calculateNextScheduledDate(
      touchpoint.frequency!,
      touchpoint.preferred_day_of_week,
      touchpoint.preferred_day_of_month
    )

    const { data, error } = await supabase
      .from('dealer_touchpoint_schedule')
      .insert({
        ...touchpoint,
        next_scheduled_date: nextDate,
        is_active: true
      })
      .select()
      .single()
    
    return { data, error }
  },

  // Update touchpoint
  update: async (id: string, updates: Partial<DealerTouchpoint>) => {
    // Recalculate next_scheduled_date if frequency or preferred days changed
    if (updates.frequency || updates.preferred_day_of_week || updates.preferred_day_of_month) {
      const { data: existing } = await supabase
        .from('dealer_touchpoint_schedule')
        .select('*')
        .eq('id', id)
        .single()
      
      if (existing) {
        updates.next_scheduled_date = calculateNextScheduledDate(
          updates.frequency || existing.frequency,
          updates.preferred_day_of_week !== undefined ? updates.preferred_day_of_week : existing.preferred_day_of_week,
          updates.preferred_day_of_month !== undefined ? updates.preferred_day_of_month : existing.preferred_day_of_month
        )
      }
    }

    const { data, error } = await supabase
      .from('dealer_touchpoint_schedule')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    return { data, error }
  },

  // Delete touchpoint
  delete: async (id: string) => {
    const { error } = await supabase
      .from('dealer_touchpoint_schedule')
      .delete()
      .eq('id', id)
    
    return { error }
  },

  // Complete touchpoint (called after logging a call)
  complete: async (id: string, callId?: string) => {
    const { data: touchpoint } = await supabase
      .from('dealer_touchpoint_schedule')
      .select('*')
      .eq('id', id)
      .single()
    
    if (!touchpoint) {
      return { data: null, error: { message: 'Touchpoint not found' } }
    }

    // Calculate next scheduled date
    const nextDate = calculateNextScheduledDate(
      touchpoint.frequency,
      touchpoint.preferred_day_of_week
    )

    const { data, error } = await supabase
      .from('dealer_touchpoint_schedule')
      .update({
        last_executed_date: new Date().toISOString().split('T')[0],
        next_scheduled_date: nextDate,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    return { data, error }
  },

  // Get touchpoint history (completed touchpoints with call logs)
  getHistory: async (dealerId: string, limit: number = 50) => {
    const { data, error } = await supabase
      .from('calls_log')
      .select(`
        *,
        caller:user_profiles(id, full_name)
      `)
      .eq('stakeholder_type', 'dealer')
      .eq('stakeholder_id', dealerId)
      .order('call_date', { ascending: false })
      .limit(limit)
    
    return { data, error }
  }
}

// Helper function to calculate next scheduled date
function calculateNextScheduledDate(
  frequency: TouchpointFrequency,
  preferredDayOfWeek?: number
): string {
  const now = new Date()
  let nextDate = new Date(now)

  switch (frequency) {
    case 'daily':
      nextDate.setDate(now.getDate() + 1)
      break
    
    case 'weekly':
      // Calculate next occurrence of preferred day of week
      const currentDay = now.getDay() || 7 // Convert Sunday (0) to 7
      const targetDay = preferredDayOfWeek || 1 // Default to Monday
      let daysUntilNext = targetDay - currentDay
      if (daysUntilNext <= 0) daysUntilNext += 7
      nextDate.setDate(now.getDate() + daysUntilNext)
      break
    
    case 'monthly':
      // Schedule for same day next month
      nextDate.setMonth(now.getMonth() + 1)
      break
    
    case 'quarterly':
      // Schedule for same day in 3 months
      nextDate.setMonth(now.getMonth() + 3)
      break
  }

  return nextDate.toISOString().split('T')[0]
}

// Helper to format frequency display
export function formatFrequency(
  frequency: TouchpointFrequency,
  preferredDayOfWeek?: number,
  preferredTime?: string
): string {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const time = preferredTime ? ` at ${preferredTime}` : ''

  switch (frequency) {
    case 'daily':
      return `Every day${time}`
    case 'weekly':
      const day = preferredDayOfWeek ? dayNames[preferredDayOfWeek === 7 ? 0 : preferredDayOfWeek] : 'week'
      return `Every ${day}${time}`
    case 'monthly':
      return `Every month${time}`
    case 'quarterly':
      return `Every quarter${time}`
    default:
      return frequency
  }
}

// Helper to get status color
export function getTouchpointStatusColor(nextScheduledDate?: string): 'default' | 'warning' | 'danger' {
  if (!nextScheduledDate) return 'default'
  
  const today = new Date().toISOString().split('T')[0]
  const scheduled = new Date(nextScheduledDate)
  const now = new Date(today)
  
  const diffDays = Math.floor((scheduled.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) return 'danger' // Overdue
  if (diffDays === 0) return 'warning' // Today
  return 'default' // Future
}
