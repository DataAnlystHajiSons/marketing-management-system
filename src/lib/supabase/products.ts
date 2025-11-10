import { supabase } from './client'

export type ProductStage = 'research' | 'development' | 'trial' | 'pre_commercial' | 'commercial' | 'discontinued'

export interface Product {
  id: string
  product_code: string
  product_name: string
  category?: string
  sub_category?: string
  current_stage: ProductStage
  description?: string
  technical_details?: any
  unit_price?: number
  unit_of_measure?: string
  is_active: boolean
  launch_date?: string
  discontinue_date?: string
  image_url?: string
  created_at: string
  updated_at: string
}

export interface ProductFormData {
  product_code: string
  product_name: string
  category?: string
  sub_category?: string
  current_stage: ProductStage
  description?: string
  technical_details?: any
  unit_price?: number
  unit_of_measure?: string
  is_active?: boolean
  launch_date?: string
  discontinue_date?: string
  image_url?: string
}

export const productsAPI = {
  // Get all products
  getAll: async (activeOnly: boolean = true, stage?: string) => {
    let query = supabase
      .from('products')
      .select('*')
      .order('product_name', { ascending: true })

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    if (stage) {
      query = query.eq('current_stage', stage)
    }

    const { data, error } = await query
    return { data, error }
  },

  // Get product by ID
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()

    return { data, error }
  },

  // Create new product
  create: async (productData: ProductFormData) => {
    const { data, error } = await supabase
      .from('products')
      .insert([{
        ...productData,
        is_active: productData.is_active ?? true,
      }])
      .select()
      .single()

    return { data, error }
  },

  // Update product
  update: async (id: string, productData: Partial<ProductFormData>) => {
    const { data, error } = await supabase
      .from('products')
      .update(productData)
      .eq('id', id)
      .select()
      .single()

    return { data, error }
  },

  // Delete product (soft delete by setting is_active to false)
  delete: async (id: string) => {
    const { error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', id)

    return { error }
  },

  // Hard delete product
  hardDelete: async (id: string) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    return { error }
  },

  // Search products
  search: async (query: string) => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .or(`product_name.ilike.%${query}%,product_code.ilike.%${query}%`)
      .eq('is_active', true)
      .limit(10)

    return { data, error }
  },

  // Get product statistics
  getStats: async () => {
    const { data, error } = await supabase
      .from('products')
      .select('current_stage, is_active, category')

    if (error) return { data: null, error }

    const stats = {
      total: data?.length || 0,
      active: data?.filter(p => p.is_active).length || 0,
      commercial: data?.filter(p => p.current_stage === 'commercial' && p.is_active).length || 0,
      inDevelopment: data?.filter(p => ['development', 'trial', 'pre_commercial'].includes(p.current_stage) && p.is_active).length || 0,
      categories: new Set(data?.map(p => p.category).filter(Boolean)).size,
    }

    return { data: stats, error: null }
  },
}
