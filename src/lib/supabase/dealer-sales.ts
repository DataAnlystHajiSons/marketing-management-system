import { supabase } from './client'

export interface DealerSale {
  id: string
  dealer_id: string
  product_id?: string
  transaction_type: 'invoice' | 'credit_memo'
  transaction_date: string
  reference_number: string
  product_name: string
  product_code?: string
  quantity: number
  unit_price: number
  amount: number
  discount_amount?: number
  tax_amount?: number
  net_amount?: number
  payment_status?: 'pending' | 'paid' | 'overdue' | 'cancelled'
  payment_date?: string
  due_date?: string
  notes?: string
  invoice_url?: string
  created_by?: string
  created_at: string
  updated_at?: string
}

export interface DealerSaleWithDetails extends DealerSale {
  dealer?: {
    id: string
    dealer_code: string
    business_name: string
    owner_name: string
  }
  product?: {
    id: string
    product_name: string
    product_code: string
  }
}

export interface SalesFilters {
  dealerId?: string
  productId?: string
  transactionType?: 'invoice' | 'credit_memo'
  paymentStatus?: string
  startDate?: string
  endDate?: string
  searchQuery?: string
}

export interface SalesStats {
  total_sales: number
  invoice_count: number
  credit_memo_count: number
  net_sales: number
  avg_invoice_amount: number
  pending_amount: number
  paid_amount: number
  overdue_amount: number
}

export const dealerSalesAPI = {
  // Get all sales with filters
  getAll: async (filters?: SalesFilters) => {
    let query = supabase
      .from('dealer_sales')
      .select(`
        *,
        dealer:dealers(id, dealer_code, business_name, owner_name),
        product:products(id, product_name, product_code)
      `)
      .order('transaction_date', { ascending: false })

    if (filters?.dealerId) {
      query = query.eq('dealer_id', filters.dealerId)
    }

    if (filters?.productId) {
      query = query.eq('product_id', filters.productId)
    }

    if (filters?.transactionType) {
      query = query.eq('transaction_type', filters.transactionType)
    }

    if (filters?.paymentStatus) {
      query = query.eq('payment_status', filters.paymentStatus)
    }

    if (filters?.startDate) {
      query = query.gte('transaction_date', filters.startDate)
    }

    if (filters?.endDate) {
      query = query.lte('transaction_date', filters.endDate)
    }

    if (filters?.searchQuery) {
      query = query.or(`reference_number.ilike.%${filters.searchQuery}%,product_name.ilike.%${filters.searchQuery}%`)
    }

    const { data, error } = await query

    return { data, error }
  },

  // Get single sale by ID
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('dealer_sales')
      .select(`
        *,
        dealer:dealers(id, dealer_code, business_name, owner_name, phone),
        product:products(id, product_name, product_code, category)
      `)
      .eq('id', id)
      .single()

    return { data, error }
  },

  // Get sales by dealer
  getByDealer: async (dealerId: string, filters?: Omit<SalesFilters, 'dealerId'>) => {
    return dealerSalesAPI.getAll({ ...filters, dealerId })
  },

  // Create new sale
  create: async (sale: Omit<DealerSale, 'id' | 'created_at' | 'updated_at' | 'net_amount'>) => {
    const { data, error } = await supabase
      .from('dealer_sales')
      .insert({
        ...sale,
        created_by: sale.created_by || (await supabase.auth.getUser()).data.user?.id,
      })
      .select(`
        *,
        dealer:dealers(id, dealer_code, business_name),
        product:products(id, product_name, product_code)
      `)
      .single()

    return { data, error }
  },

  // Update sale
  update: async (id: string, sale: Partial<DealerSale>) => {
    const { data, error } = await supabase
      .from('dealer_sales')
      .update(sale)
      .eq('id', id)
      .select(`
        *,
        dealer:dealers(id, dealer_code, business_name),
        product:products(id, product_name, product_code)
      `)
      .single()

    return { data, error }
  },

  // Delete sale
  delete: async (id: string) => {
    const { error } = await supabase
      .from('dealer_sales')
      .delete()
      .eq('id', id)

    return { error }
  },

  // Get sales statistics
  getStats: async (dealerId?: string, startDate?: string, endDate?: string) => {
    let query = supabase
      .from('dealer_sales')
      .select('transaction_type, amount, payment_status')

    if (dealerId) {
      query = query.eq('dealer_id', dealerId)
    }

    if (startDate) {
      query = query.gte('transaction_date', startDate)
    }

    if (endDate) {
      query = query.lte('transaction_date', endDate)
    }

    const { data, error } = await query

    if (error || !data) {
      return { data: null, error }
    }

    // Calculate stats
    const stats: SalesStats = {
      total_sales: 0,
      invoice_count: 0,
      credit_memo_count: 0,
      net_sales: 0,
      avg_invoice_amount: 0,
      pending_amount: 0,
      paid_amount: 0,
      overdue_amount: 0,
    }

    let invoiceTotal = 0
    let invoiceCount = 0

    data.forEach(sale => {
      if (sale.transaction_type === 'invoice') {
        stats.invoice_count++
        stats.total_sales += sale.amount
        invoiceTotal += sale.amount
        invoiceCount++
      } else {
        stats.credit_memo_count++
        stats.total_sales -= sale.amount
      }

      stats.net_sales = stats.total_sales

      if (sale.payment_status === 'pending') {
        stats.pending_amount += sale.amount
      } else if (sale.payment_status === 'paid') {
        stats.paid_amount += sale.amount
      } else if (sale.payment_status === 'overdue') {
        stats.overdue_amount += sale.amount
      }
    })

    stats.avg_invoice_amount = invoiceCount > 0 ? invoiceTotal / invoiceCount : 0

    return { data: stats, error: null }
  },

  // Get top products by revenue
  getTopProducts: async (dealerId?: string, limit: number = 10, startDate?: string, endDate?: string) => {
    let query = supabase
      .from('dealer_sales')
      .select('product_id, product_name, transaction_type, amount, quantity')

    if (dealerId) {
      query = query.eq('dealer_id', dealerId)
    }

    if (startDate) {
      query = query.gte('transaction_date', startDate)
    }

    if (endDate) {
      query = query.lte('transaction_date', endDate)
    }

    const { data, error } = await query

    if (error || !data) {
      return { data: null, error }
    }

    // Aggregate by product
    const productMap = new Map<string, { product_name: string; revenue: number; quantity: number }>()

    data.forEach(sale => {
      const key = sale.product_id || sale.product_name
      const existing = productMap.get(key) || { product_name: sale.product_name, revenue: 0, quantity: 0 }

      if (sale.transaction_type === 'invoice') {
        existing.revenue += sale.amount
        existing.quantity += sale.quantity
      } else {
        existing.revenue -= sale.amount
        existing.quantity -= sale.quantity
      }

      productMap.set(key, existing)
    })

    // Convert to array and sort
    const products = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit)

    return { data: products, error: null }
  },

  // Get sales trend (time series)
  getSalesTrend: async (
    dealerId?: string,
    period: 'daily' | 'weekly' | 'monthly' = 'monthly',
    startDate?: string,
    endDate?: string
  ) => {
    let query = supabase
      .from('dealer_sales')
      .select('transaction_date, transaction_type, amount')
      .order('transaction_date', { ascending: true })

    if (dealerId) {
      query = query.eq('dealer_id', dealerId)
    }

    if (startDate) {
      query = query.gte('transaction_date', startDate)
    }

    if (endDate) {
      query = query.lte('transaction_date', endDate)
    }

    const { data, error } = await query

    if (error || !data) {
      return { data: null, error }
    }

    // Group by period
    const trendMap = new Map<string, { date: string; sales: number; count: number }>()

    data.forEach(sale => {
      const date = new Date(sale.transaction_date)
      let key: string

      if (period === 'daily') {
        key = date.toISOString().split('T')[0]
      } else if (period === 'weekly') {
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        key = weekStart.toISOString().split('T')[0]
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      }

      const existing = trendMap.get(key) || { date: key, sales: 0, count: 0 }

      if (sale.transaction_type === 'invoice') {
        existing.sales += sale.amount
        existing.count++
      } else {
        existing.sales -= sale.amount
      }

      trendMap.set(key, existing)
    })

    const trend = Array.from(trendMap.values()).sort((a, b) => a.date.localeCompare(b.date))

    return { data: trend, error: null }
  },

  // Search sales
  search: async (query: string, dealerId?: string, limit: number = 20) => {
    let searchQuery = supabase
      .from('dealer_sales')
      .select(`
        *,
        dealer:dealers(id, dealer_code, business_name),
        product:products(id, product_name, product_code)
      `)
      .or(`reference_number.ilike.%${query}%,product_name.ilike.%${query}%,notes.ilike.%${query}%`)
      .order('transaction_date', { ascending: false })
      .limit(limit)

    if (dealerId) {
      searchQuery = searchQuery.eq('dealer_id', dealerId)
    }

    const { data, error } = await searchQuery

    return { data, error }
  },

  // Bulk create sales
  bulkCreate: async (sales: Omit<DealerSale, 'id' | 'created_at' | 'updated_at' | 'net_amount'>[]) => {
    const currentUser = (await supabase.auth.getUser()).data.user

    const salesToInsert = sales.map(sale => ({
      ...sale,
      created_by: sale.created_by || currentUser?.id,
    }))

    const { data, error } = await supabase
      .from('dealer_sales')
      .insert(salesToInsert)
      .select()

    return { data, error }
  },

  // Get payment summary
  getPaymentSummary: async (dealerId?: string) => {
    let query = supabase
      .from('dealer_sales')
      .select('payment_status, amount, net_amount')

    if (dealerId) {
      query = query.eq('dealer_id', dealerId)
    }

    const { data, error } = await query

    if (error || !data) {
      return { data: null, error }
    }

    const summary = {
      total: 0,
      paid: 0,
      pending: 0,
      overdue: 0,
      cancelled: 0,
    }

    data.forEach(sale => {
      const amount = sale.net_amount || sale.amount
      summary.total += amount

      if (sale.payment_status === 'paid') {
        summary.paid += amount
      } else if (sale.payment_status === 'pending') {
        summary.pending += amount
      } else if (sale.payment_status === 'overdue') {
        summary.overdue += amount
      } else if (sale.payment_status === 'cancelled') {
        summary.cancelled += amount
      }
    })

    return { data: summary, error: null }
  },
}
