import { supabase } from './client'

export interface Area {
  id: string
  code: string
  name: string
  zone_id: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export const areasAPI = {
  async getAll() {
    const { data, error } = await supabase
      .from('areas')
      .select('*, zones(id, name, code)')
      .order('name', { ascending: true })
    
    console.log('areasAPI.getAll() called')
    console.log('Raw response:', { data, error })
    
    return { data, error }
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('areas')
      .select('*, zones(id, name, code)')
      .eq('id', id)
      .single()
    
    return { data, error }
  },

  async getByZone(zoneId: string) {
    const { data, error } = await supabase
      .from('areas')
      .select('*')
      .eq('zone_id', zoneId)
      .order('name', { ascending: true })
    
    return { data, error }
  },

  async create(area: Partial<Area>) {
    const { data, error } = await supabase
      .from('areas')
      .insert(area)
      .select()
      .single()
    
    return { data, error }
  },

  async update(id: string, area: Partial<Area>) {
    const { data, error } = await supabase
      .from('areas')
      .update(area)
      .eq('id', id)
      .select()
      .single()
    
    return { data, error }
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('areas')
      .delete()
      .eq('id', id)
    
    return { error }
  },
}
