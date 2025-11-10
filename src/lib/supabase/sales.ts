import { supabase } from './client'

export interface SalesTransaction {
  id: string
  transaction_number: string
  transaction_date: string
  dealer_id?: string
  farmer_id?: string
  field_staff_id?: string
  total_amount: number
  payment_status: string
  payment_date?: string
  notes?: string
  created_at: string
}

export const salesAPI = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('sales_transactions')
      .select('*')
      .order('transaction_date', { ascending: false })
    return { data, error }
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('sales_transactions')
      .select('*')
      .eq('id', id)
      .single()
    return { data, error }
  },

  create: async (transaction: Partial<SalesTransaction>) => {
    const { data, error } = await supabase
      .from('sales_transactions')
      .insert(transaction)
      .select()
      .single()
    return { data, error }
  },

  getByDealer: async (dealerId: string) => {
    const { data, error } = await supabase
      .from('sales_transactions')
      .select('*')
      .eq('dealer_id', dealerId)
      .order('transaction_date', { ascending: false })
    return { data, error }
  },

  getByFarmer: async (farmerId: string) => {
    const { data, error } = await supabase
      .from('sales_transactions')
      .select('*')
      .eq('farmer_id', farmerId)
      .order('transaction_date', { ascending: false })
    return { data, error }
  },
}
