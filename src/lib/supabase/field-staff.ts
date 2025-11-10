import { supabase } from './client'

export interface FieldStaff {
  id: string
  staff_code: string
  full_name: string
  email?: string
  phone: string
  zone_id?: string
  area_id?: string
  telemarketing_officer_id?: string
  is_active: boolean
  designation?: string
  joining_date?: string
  address?: string
  city?: string
  notes?: string
  created_at: string
  updated_at: string
}

export const fieldStaffAPI = {
  async getAll() {
    const { data, error } = await supabase
      .from('field_staff')
      .select(`
        *,
        zones(id, name, code),
        areas(id, name, code),
        user_profiles!field_staff_telemarketing_officer_id_fkey(id, full_name, email)
      `)
      .order('full_name', { ascending: true })
    
    console.log('fieldStaffAPI.getAll() called')
    console.log('Raw response:', { data, error })
    
    return { data, error }
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('field_staff')
      .select(`
        *,
        zones(id, name, code),
        areas(id, name, code),
        user_profiles!field_staff_telemarketing_officer_id_fkey(id, full_name, email)
      `)
      .eq('id', id)
      .single()
    
    return { data, error }
  },

  async create(fieldStaff: Partial<FieldStaff>) {
    const { data, error } = await supabase
      .from('field_staff')
      .insert(fieldStaff)
      .select()
      .single()
    
    return { data, error }
  },

  async update(id: string, fieldStaff: Partial<FieldStaff>) {
    const { data, error } = await supabase
      .from('field_staff')
      .update(fieldStaff)
      .eq('id', id)
      .select()
      .single()
    
    return { data, error }
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('field_staff')
      .delete()
      .eq('id', id)
    
    return { error }
  },

  async generateStaffCode() {
    const { data, error } = await supabase
      .from('field_staff')
      .select('staff_code')
      .not('staff_code', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
    
    if (error || !data || data.length === 0 || !data[0].staff_code) {
      return 'FS-001'
    }

    const lastCode = data[0].staff_code
    const match = lastCode.match(/FS-(\d+)/)
    
    if (!match) {
      return 'FS-001'
    }

    const lastNumber = parseInt(match[1], 10)
    const nextNumber = lastNumber + 1
    
    return `FS-${String(nextNumber).padStart(3, '0')}`
  },
}
