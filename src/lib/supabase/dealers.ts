import { supabase } from './client'

export interface Dealer {
  id: string
  dealer_code: string
  business_name: string
  owner_name: string
  phone: string
  alternate_phone?: string
  email?: string
  zone_id?: string
  area_id?: string
  village_id?: string
  field_staff_id?: string
  credit_limit?: number
  current_balance?: number
  relationship_status: string
  relationship_score: number
  performance_rating?: string
  city?: string
  address?: string
  is_active: boolean
  created_at: string
}

export const dealersAPI = {
  getAll: async () => {
    // Try with joins first
    let { data, error } = await supabase
      .from('dealers')
      .select(`
        *,
        zone:zones(id, name),
        area:areas(id, name),
        village:villages(id, name),
        field_staff:user_profiles(id, full_name)
      `)
      .order('created_at', { ascending: false })
    
    // If joins fail, fallback to basic query
    if (error) {
      console.warn('Joins failed, falling back to basic query:', error)
      const result = await supabase
        .from('dealers')
        .select('*')
        .order('created_at', { ascending: false })
      data = result.data
      error = result.error
    }
    
    return { data, error }
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('dealers')
      .select('*')
      .eq('id', id)
      .single()
    return { data, error }
  },

  create: async (dealer: Partial<Dealer>) => {
    const { data, error } = await supabase
      .from('dealers')
      .insert(dealer)
      .select()
      .single()
    return { data, error }
  },

  update: async (id: string, dealer: Partial<Dealer>) => {
    const { data, error } = await supabase
      .from('dealers')
      .update(dealer)
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from('dealers')
      .delete()
      .eq('id', id)
    return { error }
  },

  search: async (query: string) => {
    const { data, error } = await supabase
      .from('dealers')
      .select('*')
      .or(`business_name.ilike.%${query}%,owner_name.ilike.%${query}%,phone.ilike.%${query}%`)
    return { data, error }
  },
}
