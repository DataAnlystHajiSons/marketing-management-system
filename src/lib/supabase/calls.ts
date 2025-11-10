import { supabase } from './client'

export interface Call {
  id: string
  caller_id: string
  stakeholder_type: 'farmer' | 'dealer' | 'field_staff'
  stakeholder_id: string
  call_date: string
  call_duration_seconds?: number
  call_purpose: string
  call_status: string
  notes?: string
  follow_up_required?: boolean
  follow_up_date?: string
  created_at: string
}

export const callsAPI = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('calls_log')
      .select('*')
      .order('call_date', { ascending: false })
    return { data, error }
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('calls_log')
      .select('*')
      .eq('id', id)
      .single()
    return { data, error }
  },

  create: async (call: Partial<Call>) => {
    const { data, error } = await supabase
      .from('calls_log')
      .insert(call)
      .select()
      .single()
    return { data, error }
  },

  getByStakeholder: async (stakeholderType: string, stakeholderId: string) => {
    const { data, error } = await supabase
      .from('calls_log')
      .select('*')
      .eq('stakeholder_type', stakeholderType)
      .eq('stakeholder_id', stakeholderId)
      .order('call_date', { ascending: false })
    return { data, error }
  },
}
