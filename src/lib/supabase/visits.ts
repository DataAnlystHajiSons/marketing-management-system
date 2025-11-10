import { supabase } from './client'

export interface Visit {
  id: string
  farmer_id: string
  field_staff_id: string
  visit_date: string
  visit_type: string
  purpose: string
  outcome?: string
  next_action?: string
  next_visit_date?: string
  is_successful?: boolean
  created_at: string
}

export const visitsAPI = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('visits')
      .select('*')
      .order('visit_date', { ascending: false })
    return { data, error }
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('visits')
      .select('*')
      .eq('id', id)
      .single()
    return { data, error }
  },

  create: async (visit: Partial<Visit>) => {
    const { data, error } = await supabase
      .from('visits')
      .insert(visit)
      .select()
      .single()
    return { data, error }
  },

  getByFarmer: async (farmerId: string) => {
    const { data, error } = await supabase
      .from('visits')
      .select('*')
      .eq('farmer_id', farmerId)
      .order('visit_date', { ascending: false })
    return { data, error }
  },
}
