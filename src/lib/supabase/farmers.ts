import { supabase } from './client'

export interface Farmer {
  id: string
  farmer_code: string
  full_name: string
  phone: string
  alternate_phone?: string
  email?: string
  // Hierarchical location (new)
  zone_id?: string
  area_id?: string
  village_id?: string
  zone?: {
    id: string
    name: string
    code?: string
  }
  area?: {
    id: string
    name: string
    code?: string
    zone_id?: string
  }
  village?: {
    id: string
    name: string
    code?: string
    area_id?: string
  }
  // Old flat fields (deprecated but kept for backward compatibility)
  city?: string
  district?: string
  address?: string
  land_size_acres?: number
  primary_crops?: string[]
  lead_stage: string
  lead_score: number
  lead_quality: string
  is_customer: boolean
  data_source?: string
  total_interactions: number
  total_purchases: number
  last_activity_date?: string
  registration_date?: string
  conversion_date?: string
  stage_changed_at?: string
  days_in_current_stage?: number
  assigned_tmo?: {
    id: string
    full_name: string
    email: string
  }
  assigned_field_staff?: {
    id: string
    staff_code: string
    full_name: string
  }
  assigned_dealer?: {
    id: string
    dealer_code: string
    business_name: string
  }
  created_at: string
}

export const farmersAPI = {
  // Get all farmers
  getAll: async () => {
    try {
      // First get all farmers with relationships
      const { data: farmersData, error: farmersError } = await supabase
        .from('farmers')
        .select(`
          *,
          zone:zones!farmers_zone_id_fkey(id, name, code),
          area:areas!farmers_area_id_fkey(id, name, code, zone_id),
          village:villages!farmers_village_id_fkey(id, name, code, area_id),
          assigned_tmo:user_profiles!farmers_assigned_tmo_id_fkey(id, full_name, email),
          assigned_field_staff:field_staff!farmers_assigned_field_staff_id_fkey(id, staff_code, full_name),
          assigned_dealer:dealers!farmers_assigned_dealer_id_fkey(id, dealer_code, business_name)
        `)
        .order('created_at', { ascending: false })

      if (farmersError || !farmersData) {
        return { data: null, error: farmersError }
      }

      // Get last activity date for each farmer
      const farmerIds = farmersData.map(f => f.id)
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('farmer_activities')
        .select('farmer_id, activity_date')
        .in('farmer_id', farmerIds)
        .order('activity_date', { ascending: false })

      // Create a map of farmer_id to last activity date
      const lastActivityMap = new Map<string, string>()
      if (activitiesData) {
        activitiesData.forEach(activity => {
          if (!lastActivityMap.has(activity.farmer_id)) {
            lastActivityMap.set(activity.farmer_id, activity.activity_date)
          }
        })
      }

      // Merge last activity date into farmers data
      const enrichedFarmers = farmersData.map(farmer => ({
        ...farmer,
        last_activity_date: lastActivityMap.get(farmer.id) || null
      }))

      return { data: enrichedFarmers, error: null }
    } catch (error: any) {
      console.error('Error fetching farmers:', error)
      return { data: null, error }
    }
  },

  // Get farmer by ID with related data
  getById: async (id: string) => {
    // First get the farmer data
    const { data: farmerData, error: farmerError } = await supabase
      .from('farmers')
      .select('*')
      .eq('id', id)
      .single()
    
    if (farmerError || !farmerData) {
      console.error('Error fetching farmer:', farmerError)
      return { data: null, error: farmerError }
    }

    // Debug log
    console.log('Farmer data fetched:', {
      id: farmerData.id,
      name: farmerData.full_name,
      assigned_tmo_id: farmerData.assigned_tmo_id,
      assigned_field_staff_id: farmerData.assigned_field_staff_id,
      assigned_dealer_id: farmerData.assigned_dealer_id,
    })

    // Then fetch related data manually if IDs exist
    let assigned_tmo = null
    let assigned_field_staff = null
    let assigned_dealer = null
    let zone = null
    let area = null
    let village = null

    // Fetch TMO if assigned
    if (farmerData.assigned_tmo_id) {
      const { data: tmoData, error: tmoError } = await supabase
        .from('user_profiles')
        .select('id, full_name, email')
        .eq('id', farmerData.assigned_tmo_id)
        .single()
      
      if (tmoError) {
        console.error('Error fetching TMO:', tmoError)
      } else {
        assigned_tmo = tmoData
        console.log('TMO fetched:', tmoData)
      }
    } else {
      console.log('No TMO assigned (assigned_tmo_id is null)')
    }

    // Fetch Field Staff if assigned
    if (farmerData.assigned_field_staff_id) {
      const { data: fsData, error: fsError } = await supabase
        .from('field_staff')
        .select('id, staff_code, full_name')
        .eq('id', farmerData.assigned_field_staff_id)
        .single()
      
      if (fsError) {
        console.error('Error fetching Field Staff:', fsError)
      } else {
        assigned_field_staff = fsData
        console.log('Field Staff fetched:', fsData)
      }
    } else {
      console.log('No Field Staff assigned (assigned_field_staff_id is null)')
    }

    // Fetch Dealer if assigned
    if (farmerData.assigned_dealer_id) {
      const { data: dealerData, error: dealerError } = await supabase
        .from('dealers')
        .select('id, dealer_code, business_name')
        .eq('id', farmerData.assigned_dealer_id)
        .single()
      
      if (dealerError) {
        console.error('Error fetching Dealer:', dealerError)
      } else {
        assigned_dealer = dealerData
        console.log('Dealer fetched:', dealerData)
      }
    } else {
      console.log('No Dealer assigned (assigned_dealer_id is null)')
    }

    // Fetch Zone if assigned
    if (farmerData.zone_id) {
      console.log('Fetching zone with ID:', farmerData.zone_id)
      const { data: zoneData, error: zoneError } = await supabase
        .from('zones')
        .select('id, name, code')
        .eq('id', farmerData.zone_id)
        .single()
      
      if (zoneError) {
        console.error('Error fetching Zone:', zoneError)
      } else if (zoneData) {
        zone = zoneData
        console.log('Zone fetched:', zoneData)
      } else {
        console.warn('No zone data returned for ID:', farmerData.zone_id)
      }
    } else {
      console.log('No zone_id in farmer data')
    }

    // Fetch Area if assigned
    if (farmerData.area_id) {
      console.log('Fetching area with ID:', farmerData.area_id)
      const { data: areaData, error: areaError } = await supabase
        .from('areas')
        .select('id, name, code, zone_id')
        .eq('id', farmerData.area_id)
        .single()
      
      if (areaError) {
        console.error('Error fetching Area:', areaError)
      } else if (areaData) {
        area = areaData
        console.log('Area fetched:', areaData)
      } else {
        console.warn('No area data returned for ID:', farmerData.area_id)
      }
    } else {
      console.log('No area_id in farmer data')
    }

    // Fetch Village if assigned
    if (farmerData.village_id) {
      console.log('Fetching village with ID:', farmerData.village_id)
      const { data: villageData, error: villageError } = await supabase
        .from('villages')
        .select('id, name, code, area_id')
        .eq('id', farmerData.village_id)
        .single()
      
      if (villageError) {
        console.error('Error fetching Village:', villageError)
      } else if (villageData) {
        village = villageData
        console.log('Village fetched:', villageData)
      } else {
        console.warn('No village data returned for ID:', farmerData.village_id)
      }
    } else {
      console.log('No village_id in farmer data')
    }

    // Combine all data
    const data = {
      ...farmerData,
      assigned_tmo,
      assigned_field_staff,
      assigned_dealer,
      zone,
      area,
      village,
    }
    
    console.log('Final farmer data with relations:', {
      id: data.id,
      name: data.full_name,
      zone_id: data.zone_id,
      zone: data.zone,
      area_id: data.area_id,
      area: data.area,
      village_id: data.village_id,
      village: data.village,
    })
    
    return { data, error: null }
  },

  // Generate next farmer code
  generateFarmerCode: async () => {
    // Get the last farmer code
    const { data, error } = await supabase
      .from('farmers')
      .select('farmer_code')
      .not('farmer_code', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
    
    if (error) {
      console.error('Error fetching last farmer code:', error)
      return 'F-001' // Default if error
    }

    if (!data || data.length === 0 || !data[0].farmer_code) {
      return 'F-001' // First farmer
    }

    // Extract number from last code (e.g., "F-001" -> 1)
    const lastCode = data[0].farmer_code
    const match = lastCode.match(/F-(\d+)/)
    
    if (!match) {
      return 'F-001' // Fallback if format doesn't match
    }

    const lastNumber = parseInt(match[1], 10)
    const nextNumber = lastNumber + 1
    
    // Pad with zeros (F-001, F-002, etc.)
    return `F-${String(nextNumber).padStart(3, '0')}`
  },

  // Create farmer
  create: async (farmer: Partial<Farmer>) => {
    // Generate farmer code if not provided
    if (!farmer.farmer_code) {
      farmer.farmer_code = await farmersAPI.generateFarmerCode()
    }

    const { data, error } = await supabase
      .from('farmers')
      .insert(farmer)
      .select()
      .single()
    return { data, error }
  },

  // Update farmer
  update: async (id: string, farmer: Partial<Farmer>) => {
    const { data, error } = await supabase
      .from('farmers')
      .update(farmer)
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  },

  // Delete farmer
  delete: async (id: string) => {
    const { error } = await supabase
      .from('farmers')
      .delete()
      .eq('id', id)
    return { error }
  },

  // Search farmers
  search: async (query: string) => {
    const { data, error } = await supabase
      .from('farmers')
      .select('*')
      .or(`full_name.ilike.%${query}%,phone.ilike.%${query}%,village.ilike.%${query}%`)
    return { data, error }
  },
}
