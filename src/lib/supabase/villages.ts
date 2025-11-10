import { supabase } from './client'

export interface Village {
  id: string
  area_id: string
  name: string
  code?: string
  village_type?: 'rural' | 'urban' | 'semi-urban'
  population?: number
  postal_code?: string
  latitude?: number
  longitude?: number
  is_active: boolean
  notes?: string
  created_by?: string
  created_at: string
  updated_at?: string
}

export interface VillageWithHierarchy extends Village {
  area?: {
    id: string
    name: string
    code?: string
    zone_id: string
  }
  zone?: {
    id: string
    name: string
    code?: string
  }
  full_path?: string
}

export const villagesAPI = {
  // Get all villages with optional filters
  getAll: async (filters?: {
    area_id?: string
    zone_id?: string
    village_type?: string
    is_active?: boolean
  }) => {
    let query = supabase
      .from('villages')
      .select(`
        *,
        area:areas(id, name, code, zone_id),
        area:areas(zone:zones(id, name, code))
      `)
      .order('name', { ascending: true })

    if (filters?.area_id) {
      query = query.eq('area_id', filters.area_id)
    }

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    } else {
      query = query.eq('is_active', true) // Default: only active
    }

    if (filters?.village_type) {
      query = query.eq('village_type', filters.village_type)
    }

    const { data, error } = await query

    return { data, error }
  },

  // Get villages by area
  getByArea: async (areaId: string) => {
    const { data, error } = await supabase
      .from('villages')
      .select('*')
      .eq('area_id', areaId)
      .eq('is_active', true)
      .order('name', { ascending: true })

    return { data, error }
  },

  // Get villages by zone (across all areas in zone)
  getByZone: async (zoneId: string) => {
    const { data, error } = await supabase
      .from('villages')
      .select(`
        *,
        area:areas!inner(id, name, zone_id)
      `)
      .eq('area.zone_id', zoneId)
      .eq('is_active', true)
      .order('name', { ascending: true })

    return { data, error }
  },

  // Get village by ID with full hierarchy
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('villages')
      .select(`
        *,
        area:areas(
          id, 
          name, 
          code,
          zone:zones(id, name, code)
        )
      `)
      .eq('id', id)
      .single()

    return { data, error }
  },

  // Search villages by name
  search: async (searchTerm: string, areaId?: string) => {
    let query = supabase
      .from('villages')
      .select(`
        *,
        area:areas(id, name, code)
      `)
      .eq('is_active', true)
      .ilike('name', `%${searchTerm}%`)
      .order('name', { ascending: true })
      .limit(20)

    if (areaId) {
      query = query.eq('area_id', areaId)
    }

    const { data, error } = await query

    return { data, error }
  },

  // Create village
  create: async (village: Omit<Village, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('villages')
      .insert({
        ...village,
        created_by: village.created_by || (await supabase.auth.getUser()).data.user?.id,
      })
      .select(`
        *,
        area:areas(
          id, 
          name,
          zone:zones(id, name)
        )
      `)
      .single()

    return { data, error }
  },

  // Update village
  update: async (id: string, village: Partial<Village>) => {
    const { data, error } = await supabase
      .from('villages')
      .update(village)
      .eq('id', id)
      .select(`
        *,
        area:areas(
          id, 
          name,
          zone:zones(id, name)
        )
      `)
      .single()

    return { data, error }
  },

  // Delete village (soft delete)
  delete: async (id: string) => {
    const { error } = await supabase
      .from('villages')
      .update({ is_active: false })
      .eq('id', id)

    return { error }
  },

  // Permanently delete village
  hardDelete: async (id: string) => {
    // Check if any farmers are assigned to this village
    const { data: farmers, error: checkError } = await supabase
      .from('farmers')
      .select('id')
      .eq('village_id', id)
      .limit(1)

    if (checkError) {
      return { error: checkError }
    }

    if (farmers && farmers.length > 0) {
      return { 
        error: { 
          message: 'Cannot delete village. Farmers are assigned to it. Please reassign farmers first.' 
        } as any
      }
    }

    const { error } = await supabase
      .from('villages')
      .delete()
      .eq('id', id)

    return { error }
  },

  // Restore soft-deleted village
  restore: async (id: string) => {
    const { data, error } = await supabase
      .from('villages')
      .update({ is_active: true })
      .eq('id', id)
      .select()
      .single()

    return { data, error }
  },

  // Get village statistics
  getStats: async (villageId: string) => {
    const { data, error } = await supabase.rpc('get_village_farmer_stats', {
      p_village_id: villageId
    })

    return { data, error }
  },

  // Get villages with hierarchy view
  getWithHierarchy: async () => {
    const { data, error } = await supabase
      .from('v_villages_with_hierarchy')
      .select('*')
      .order('zone_name', { ascending: true })
      .order('area_name', { ascending: true })
      .order('village_name', { ascending: true })

    return { data, error }
  },

  // Bulk import villages
  bulkCreate: async (villages: Omit<Village, 'id' | 'created_at' | 'updated_at'>[]) => {
    const currentUser = (await supabase.auth.getUser()).data.user

    const villagesToInsert = villages.map(v => ({
      ...v,
      created_by: v.created_by || currentUser?.id,
    }))

    const { data, error } = await supabase
      .from('villages')
      .insert(villagesToInsert)
      .select()

    return { data, error }
  },

  // Get villages count by area
  getCountByArea: async (areaId: string) => {
    const { count, error } = await supabase
      .from('villages')
      .select('*', { count: 'exact', head: true })
      .eq('area_id', areaId)
      .eq('is_active', true)

    return { count, error }
  },

  // Check if village name exists in area (for validation)
  checkNameExists: async (name: string, areaId: string, excludeId?: string) => {
    let query = supabase
      .from('villages')
      .select('id')
      .eq('area_id', areaId)
      .ilike('name', name)
      .limit(1)

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data, error } = await query

    if (error) return { exists: false, error }

    return { exists: data && data.length > 0, error: null }
  },
}
