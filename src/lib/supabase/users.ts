import { supabase } from './client'

export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: string
  phone?: string
  is_active: boolean
  created_at: string
  updated_at?: string
}

export const usersAPI = {
  // Get all users
  async getAll() {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('full_name', { ascending: true })
    
    return { data, error }
  },

  // Get all TMOs (Telemarketing Officers)
  async getTMOs() {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('role', 'telemarketing_officer')
      .eq('is_active', true)
      .order('full_name', { ascending: true })
    
    return { data, error }
  },

  // Get users by role
  async getByRole(role: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('role', role)
      .eq('is_active', true)
      .order('full_name', { ascending: true })
    
    return { data, error }
  },

  // Get all field staff
  async getFieldStaff() {
    const { data, error } = await supabase
      .from('field_staff')
      .select('*')
      .eq('is_active', true)
      .order('full_name', { ascending: true })
    
    return { data, error }
  },

  // Get all dealers
  async getDealers() {
    const { data, error } = await supabase
      .from('dealers')
      .select('id, dealer_code, business_name, owner_name, phone, is_active')
      .eq('is_active', true)
      .order('business_name', { ascending: true })
    
    return { data, error }
  },

  // Get user by ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', id)
      .single()
    
    return { data, error }
  },

  // Get all active users
  async getAllUsers() {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('is_active', true)
      .order('full_name', { ascending: true })
    
    return { data, error }
  },

  // Create user profile
  async create(user: Partial<UserProfile>) {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert(user)
      .select()
      .single()
    
    return { data, error }
  },

  // Update user profile
  async update(id: string, user: Partial<UserProfile>) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(user)
      .eq('id', id)
      .select()
      .single()
    
    return { data, error }
  },

  // Delete user profile
  async delete(id: string) {
    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', id)
    
    return { error }
  },
}
