import { supabase } from './client'

export interface Zone {
  id: string
  code: string
  name: string
  country?: string
  manager_id?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export const zonesAPI = {
  async getAll() {
    const { data, error } = await supabase
      .from('zones')
      .select('*')
      .order('name', { ascending: true })
    
    return { data, error }
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('zones')
      .select('*')
      .eq('id', id)
      .single()
    
    return { data, error }
  },

  async create(zone: Partial<Zone>) {
    const { data, error } = await supabase
      .from('zones')
      .insert(zone)
      .select()
      .single()
    
    return { data, error }
  },

  async update(id: string, zone: Partial<Zone>) {
    const { data, error } = await supabase
      .from('zones')
      .update(zone)
      .eq('id', id)
      .select()
      .single()
    
    return { data, error }
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('zones')
      .delete()
      .eq('id', id)
    
    return { error }
  },
}
