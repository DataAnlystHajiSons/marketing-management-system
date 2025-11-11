"use client"

import React, { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Receipt, 
  CreditCard,
  DollarSign,
  Calendar,
  Search,
  Download,
  Plus,
  Filter,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Eye,
  Trophy,
  Award,
  Star
} from "lucide-react"
import { dealerSalesAPI, DealerSaleWithDetails, SalesStats } from "@/lib/supabase/dealer-sales"
import { dealersAPI } from "@/lib/supabase/dealers"
import { LoadingPage } from "@/components/ui/loading-spinner"
import { ErrorMessage } from "@/components/ui/error-message"
import { formatCurrency } from "@/lib/utils"
import { AddDealerSaleModal } from "@/components/crm/add-dealer-sale-modal"
import { SalesTrendChart } from "@/components/crm/sales-trend-chart"

export default function DealerSalesPage() {
  const params = useParams()
  const dealerId = params.id as string

  const [dealer, setDealer] = useState<any>(null)
  const [sales, setSales] = useState<DealerSaleWithDetails[]>([])
  const [stats, setStats] = useState<SalesStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal state
  const [addSaleModalOpen, setAddSaleModalOpen] = useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [transactionType, setTransactionType] = useState<string>('all')
  const [paymentStatus, setPaymentStatus] = useState<string>('all')
  const [dateRange, setDateRange] = useState<string>('6months')

  // View toggle
  const [activeView, setActiveView] = useState<'transactions' | 'products'>('transactions')
  
  // Product view state
  const [sortColumn, setSortColumn] = useState<'product' | 'invoices' | 'qty' | 'revenue'>('revenue')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null)

  // Transaction view state
  const [txnSortColumn, setTxnSortColumn] = useState<'date' | 'reference' | 'type' | 'product' | 'qty' | 'price' | 'amount' | 'status'>('date')
  const [txnSortDirection, setTxnSortDirection] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    loadData()
  }, [dealerId, transactionType, paymentStatus, dateRange])

  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Calculate date range
      const endDate = new Date().toISOString().split('T')[0]
      let startDate = ''

      if (dateRange === '7days') {
        const date = new Date()
        date.setDate(date.getDate() - 7)
        startDate = date.toISOString().split('T')[0]
      } else if (dateRange === '30days') {
        const date = new Date()
        date.setDate(date.getDate() - 30)
        startDate = date.toISOString().split('T')[0]
      } else if (dateRange === '6months') {
        const date = new Date()
        date.setMonth(date.getMonth() - 6)
        startDate = date.toISOString().split('T')[0]
      } else if (dateRange === 'year') {
        const date = new Date()
        date.setFullYear(date.getFullYear() - 1)
        startDate = date.toISOString().split('T')[0]
      }

      // Load dealer info
      const { data: dealerData, error: dealerError } = await dealersAPI.getById(dealerId)
      if (dealerError) throw new Error(dealerError.message)
      setDealer(dealerData)

      // Load sales with filters
      const filters: any = {
        dealerId,
        startDate: startDate || undefined,
        endDate,
      }

      if (transactionType !== 'all') {
        filters.transactionType = transactionType
      }

      if (paymentStatus !== 'all') {
        filters.paymentStatus = paymentStatus
      }

      const { data: salesData, error: salesError } = await dealerSalesAPI.getAll(filters)
      if (salesError) throw new Error(salesError.message)
      setSales(salesData || [])

      // Load stats
      const { data: statsData, error: statsError } = await dealerSalesAPI.getStats(dealerId, startDate || undefined, endDate)
      if (statsError) throw new Error(statsError.message)
      setStats(statsData)

    } catch (err: any) {
      setError(err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const filteredSales = sales.filter(sale => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      sale.reference_number.toLowerCase().includes(query) ||
      sale.product_name.toLowerCase().includes(query) ||
      sale.notes?.toLowerCase().includes(query)
    )
  })

  // Aggregate sales by product
  interface ProductSummary {
    product_name: string
    product_code?: string
    total_quantity: number
    total_revenue: number
    total_invoices: number
    total_credit_memos: number
    net_quantity: number
    net_revenue: number
    avg_price: number
  }

  const productSummaries: ProductSummary[] = (() => {
    const productMap = new Map<string, ProductSummary>()

    filteredSales.forEach(sale => {
      const key = sale.product_name.toLowerCase()
      if (!productMap.has(key)) {
        productMap.set(key, {
          product_name: sale.product_name,
          product_code: sale.product_code,
          total_quantity: 0,
          total_revenue: 0,
          total_invoices: 0,
          total_credit_memos: 0,
          net_quantity: 0,
          net_revenue: 0,
          avg_price: 0
        })
      }

      const summary = productMap.get(key)!
      
      if (sale.transaction_type === 'invoice') {
        summary.total_invoices++
        summary.total_quantity += sale.quantity
        summary.total_revenue += sale.amount
      } else {
        summary.total_credit_memos++
        // Credit memos have negative quantities and amounts
        summary.total_quantity += Math.abs(sale.quantity)
        summary.total_revenue += Math.abs(sale.amount)
      }

      summary.net_quantity += sale.quantity // Keep sign for net
      summary.net_revenue += sale.amount // Keep sign for net
    })

    // Calculate average price
    productMap.forEach(summary => {
      if (summary.total_quantity > 0) {
        summary.avg_price = summary.total_revenue / summary.total_quantity
      }
    })

    return Array.from(productMap.values())
  })()

  // Sorted product summaries
  const sortedProductSummaries = [...productSummaries].sort((a, b) => {
    let comparison = 0
    
    switch (sortColumn) {
      case 'product':
        comparison = a.product_name.localeCompare(b.product_name)
        break
      case 'invoices':
        comparison = a.total_invoices - b.total_invoices
        break
      case 'qty':
        comparison = a.net_quantity - b.net_quantity
        break
      case 'revenue':
        comparison = a.net_revenue - b.net_revenue
        break
    }
    
    return sortDirection === 'asc' ? comparison : -comparison
  })

  // Top 3 and Bottom 3 products by net revenue
  const topProducts = [...productSummaries]
    .sort((a, b) => b.net_revenue - a.net_revenue)
    .slice(0, 3)
  
  const bottomProducts = [...productSummaries]
    .sort((a, b) => a.net_revenue - b.net_revenue)
    .slice(0, 3)

  const handleSort = (column: 'product' | 'invoices' | 'qty' | 'revenue') => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('desc')
    }
  }

  const getProductTransactions = (productName: string) => {
    return filteredSales.filter(
      sale => sale.product_name.toLowerCase() === productName.toLowerCase()
    )
  }

  const handleTxnSort = (column: typeof txnSortColumn) => {
    if (txnSortColumn === column) {
      setTxnSortDirection(txnSortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setTxnSortColumn(column)
      setTxnSortDirection('desc')
    }
  }

  // Sorted transactions
  const sortedTransactions = [...filteredSales].sort((a, b) => {
    let comparison = 0
    
    switch (txnSortColumn) {
      case 'date':
        comparison = new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
        break
      case 'reference':
        comparison = a.reference_number.localeCompare(b.reference_number)
        break
      case 'type':
        comparison = a.transaction_type.localeCompare(b.transaction_type)
        break
      case 'product':
        comparison = a.product_name.localeCompare(b.product_name)
        break
      case 'qty':
        comparison = a.quantity - b.quantity
        break
      case 'price':
        comparison = a.unit_price - b.unit_price
        break
      case 'amount':
        comparison = a.amount - b.amount
        break
      case 'status':
        comparison = (a.payment_status || 'pending').localeCompare(b.payment_status || 'pending')
        break
    }
    
    return txnSortDirection === 'asc' ? comparison : -comparison
  })

  if (loading) return <LoadingPage />
  if (error) return <ErrorMessage message={error} retry={loadData} />
  if (!dealer) return <ErrorMessage message="Dealer not found" />

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/crm/dealers/${dealerId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{dealer.business_name}</h1>
          <p className="text-muted-foreground">
            {dealer.dealer_code} • {dealer.owner_name}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setAddSaleModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Sale
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.net_sales || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.invoice_count || 0} invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invoices</CardTitle>
            <Receipt className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.invoice_count || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg: {formatCurrency(stats?.avg_invoice_amount || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credit Memos</CardTitle>
            <CreditCard className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats?.credit_memo_count || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Returns/Adjustments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {formatCurrency(stats?.pending_amount || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Outstanding
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by reference or product..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="year">Last Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>

            <Select value={transactionType} onValueChange={setTransactionType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="invoice">Invoices</SelectItem>
                <SelectItem value="credit_memo">Credit Memos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={paymentStatus} onValueChange={setPaymentStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sales Trend Chart */}
      <SalesTrendChart
        dealerId={dealerId}
        startDate={(() => {
          if (dateRange === '7days') {
            const date = new Date()
            date.setDate(date.getDate() - 7)
            return date.toISOString().split('T')[0]
          } else if (dateRange === '30days') {
            const date = new Date()
            date.setDate(date.getDate() - 30)
            return date.toISOString().split('T')[0]
          } else if (dateRange === '6months') {
            const date = new Date()
            date.setMonth(date.getMonth() - 6)
            return date.toISOString().split('T')[0]
          } else if (dateRange === 'year') {
            const date = new Date()
            date.setFullYear(date.getFullYear() - 1)
            return date.toISOString().split('T')[0]
          }
          return undefined
        })()}
        endDate={new Date().toISOString().split('T')[0]}
      />

      {/* View Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveView('transactions')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeView === 'transactions'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Receipt className="inline-block mr-2 h-4 w-4" />
          Sales Transactions
        </button>
        <button
          onClick={() => setActiveView('products')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeView === 'products'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <TrendingUp className="inline-block mr-2 h-4 w-4" />
          Sales by Products
        </button>
      </div>

      {/* Sales Transactions View */}
      {activeView === 'transactions' && (
        <Card>
          <CardHeader>
            <CardTitle>Sales Transactions</CardTitle>
            <CardDescription>
              Showing {filteredSales.length} of {sales.length} transactions
            </CardDescription>
          </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <table className="w-full">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    <button
                      onClick={() => handleTxnSort('date')}
                      className="flex items-center gap-2 hover:text-primary transition-colors group"
                    >
                      Date
                      {txnSortColumn === 'date' ? (
                        txnSortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ArrowUpDown className="h-4 w-4 opacity-0 group-hover:opacity-50" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    <button
                      onClick={() => handleTxnSort('reference')}
                      className="flex items-center gap-2 hover:text-primary transition-colors group"
                    >
                      Reference
                      {txnSortColumn === 'reference' ? (
                        txnSortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ArrowUpDown className="h-4 w-4 opacity-0 group-hover:opacity-50" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    <button
                      onClick={() => handleTxnSort('type')}
                      className="flex items-center gap-2 hover:text-primary transition-colors group"
                    >
                      Type
                      {txnSortColumn === 'type' ? (
                        txnSortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ArrowUpDown className="h-4 w-4 opacity-0 group-hover:opacity-50" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    <button
                      onClick={() => handleTxnSort('product')}
                      className="flex items-center gap-2 hover:text-primary transition-colors group"
                    >
                      Product
                      {txnSortColumn === 'product' ? (
                        txnSortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ArrowUpDown className="h-4 w-4 opacity-0 group-hover:opacity-50" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium">
                    <button
                      onClick={() => handleTxnSort('qty')}
                      className="flex items-center gap-2 ml-auto hover:text-primary transition-colors group"
                    >
                      Qty
                      {txnSortColumn === 'qty' ? (
                        txnSortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ArrowUpDown className="h-4 w-4 opacity-0 group-hover:opacity-50" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium">
                    <button
                      onClick={() => handleTxnSort('price')}
                      className="flex items-center gap-2 ml-auto hover:text-primary transition-colors group"
                    >
                      Price
                      {txnSortColumn === 'price' ? (
                        txnSortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ArrowUpDown className="h-4 w-4 opacity-0 group-hover:opacity-50" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium">
                    <button
                      onClick={() => handleTxnSort('amount')}
                      className="flex items-center gap-2 ml-auto hover:text-primary transition-colors group"
                    >
                      Amount
                      {txnSortColumn === 'amount' ? (
                        txnSortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ArrowUpDown className="h-4 w-4 opacity-0 group-hover:opacity-50" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    <button
                      onClick={() => handleTxnSort('status')}
                      className="flex items-center gap-2 hover:text-primary transition-colors group"
                    >
                      Status
                      {txnSortColumn === 'status' ? (
                        txnSortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ArrowUpDown className="h-4 w-4 opacity-0 group-hover:opacity-50" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                      No sales transactions found
                    </td>
                  </tr>
                ) : (
                  sortedTransactions.slice(0, 50).map((sale) => (
                    <tr key={sale.id} className="border-t hover:bg-muted/50">
                      <td className="px-4 py-3 text-sm">
                        {new Date(sale.transaction_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-sm">{sale.reference_number}</div>
                      </td>
                      <td className="px-4 py-3">
                        {sale.transaction_type === 'invoice' ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            Invoice
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            Credit Memo
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium">{sale.product_name}</div>
                        {sale.product_code && (
                          <div className="text-xs text-muted-foreground">{sale.product_code}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-sm">
                        {sale.quantity}
                      </td>
                      <td className="px-4 py-3 text-right text-sm">
                        {formatCurrency(sale.unit_price)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatCurrency(sale.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={
                          sale.payment_status === 'paid' ? 'default' :
                          sale.payment_status === 'overdue' ? 'destructive' :
                          'secondary'
                        }>
                          {sale.payment_status || 'pending'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {sortedTransactions.length > 50 && (
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Showing first 50 of {sortedTransactions.length} transactions
            </div>
          )}
        </CardContent>
        </Card>
      )}

      {/* Sales by Products View */}
      {activeView === 'products' && (
        <>
          {/* Top and Bottom Products */}
          {productSummaries.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 mb-6">
              {/* Top 3 Products */}
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <Trophy className="h-5 w-5" />
                    Top 3 Products
                  </CardTitle>
                  <CardDescription>Highest revenue generators</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topProducts.map((product, idx) => (
                      <div 
                        key={product.product_name} 
                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                            idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                            idx === 1 ? 'bg-gray-100 text-gray-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                          </div>
                          <div>
                            <div className="font-semibold text-sm">{product.product_name}</div>
                            <div className="text-xs text-muted-foreground">
                              {product.total_invoices} invoices • {product.net_quantity.toFixed(2)} qty
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-700">
                            {formatCurrency(product.net_revenue)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatCurrency(product.avg_price)}/unit
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Bottom 3 Products */}
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-700">
                    <TrendingDown className="h-5 w-5" />
                    Lowest 3 Products
                  </CardTitle>
                  <CardDescription>Products needing attention</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {bottomProducts.map((product, idx) => (
                      <div 
                        key={product.product_name} 
                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-700 font-semibold text-sm">
                            {idx + 1}
                          </div>
                          <div>
                            <div className="font-semibold text-sm">{product.product_name}</div>
                            <div className="text-xs text-muted-foreground">
                              {product.total_invoices} invoices • {product.net_quantity.toFixed(2)} qty
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-red-700">
                            {formatCurrency(product.net_revenue)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatCurrency(product.avg_price)}/unit
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

        <Card>
          <CardHeader>
            <CardTitle>Sales by Products</CardTitle>
            <CardDescription>
              Product-wise sales summary ({productSummaries.length} products)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <table className="w-full">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      <button
                        onClick={() => handleSort('product')}
                        className="flex items-center gap-2 hover:text-primary transition-colors group"
                      >
                        Product
                        {sortColumn === 'product' ? (
                          sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ArrowUpDown className="h-4 w-4 opacity-0 group-hover:opacity-50" />
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium">
                      <button
                        onClick={() => handleSort('invoices')}
                        className="flex items-center gap-2 ml-auto hover:text-primary transition-colors group"
                      >
                        Invoices
                        {sortColumn === 'invoices' ? (
                          sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ArrowUpDown className="h-4 w-4 opacity-0 group-hover:opacity-50" />
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Credit Memos</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Total Qty</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">
                      <button
                        onClick={() => handleSort('qty')}
                        className="flex items-center gap-2 ml-auto hover:text-primary transition-colors group"
                      >
                        Net Qty
                        {sortColumn === 'qty' ? (
                          sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ArrowUpDown className="h-4 w-4 opacity-0 group-hover:opacity-50" />
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Avg Price</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Total Revenue</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">
                      <button
                        onClick={() => handleSort('revenue')}
                        className="flex items-center gap-2 ml-auto hover:text-primary transition-colors group"
                      >
                        Net Revenue
                        {sortColumn === 'revenue' ? (
                          sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ArrowUpDown className="h-4 w-4 opacity-0 group-hover:opacity-50" />
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {productSummaries.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                        No product sales found
                      </td>
                    </tr>
                  ) : (
                    sortedProductSummaries.map((product, idx) => {
                      const isExpanded = expandedProduct === product.product_name
                      const transactions = getProductTransactions(product.product_name)
                      const uniqueKey = `${product.product_name}-${idx}`
                      
                      return (
                        <React.Fragment key={uniqueKey}>
                          <tr 
                            className="border-t hover:bg-muted/50 transition-colors cursor-pointer group"
                            onClick={() => setExpandedProduct(isExpanded ? null : product.product_name)}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4 text-primary" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                                )}
                                <div>
                                  <div className="font-medium text-sm">{product.product_name}</div>
                                  {product.product_code && (
                                    <div className="text-xs text-muted-foreground">{product.product_code}</div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                {product.total_invoices}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-right">
                              {product.total_credit_memos > 0 ? (
                                <Badge variant="destructive">
                                  {product.total_credit_memos}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-sm">0</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right text-sm">
                              {product.total_quantity.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-right text-sm font-medium">
                              <span className={product.net_quantity < 0 ? 'text-red-600' : ''}>
                                {product.net_quantity.toFixed(2)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right text-sm">
                              {formatCurrency(product.avg_price)}
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-muted-foreground">
                              {formatCurrency(product.total_revenue)}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-sm">
                              <span className={product.net_revenue < 0 ? 'text-red-600' : 'text-green-600'}>
                                {formatCurrency(product.net_revenue)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setExpandedProduct(isExpanded ? null : product.product_name)
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                          
                          {/* Expanded Details Row */}
                          {isExpanded && (
                            <tr className="bg-blue-50 border-t">
                              <td colSpan={9} className="px-8 py-4">
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-semibold text-sm">Transaction Details ({transactions.length} transactions)</h4>
                                    <Button variant="outline" size="sm">
                                      <Download className="mr-2 h-3 w-3" />
                                      Export
                                    </Button>
                                  </div>
                                  <div className="rounded-lg border bg-white overflow-hidden">
                                    <table className="w-full text-sm">
                                      <thead className="bg-muted">
                                        <tr>
                                          <th className="px-3 py-2 text-left">Date</th>
                                          <th className="px-3 py-2 text-left">Reference</th>
                                          <th className="px-3 py-2 text-left">Type</th>
                                          <th className="px-3 py-2 text-right">Qty</th>
                                          <th className="px-3 py-2 text-right">Price</th>
                                          <th className="px-3 py-2 text-right">Amount</th>
                                          <th className="px-3 py-2 text-left">Status</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {transactions.map((txn, txnIdx) => (
                                          <tr key={`${txn.id}-${txnIdx}`} className="border-t hover:bg-muted/30">
                                            <td className="px-3 py-2">
                                              {new Date(txn.transaction_date).toLocaleDateString()}
                                            </td>
                                            <td className="px-3 py-2 font-mono">{txn.reference_number}</td>
                                            <td className="px-3 py-2">
                                              {txn.transaction_type === 'invoice' ? (
                                                <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                                                  Invoice
                                                </Badge>
                                              ) : (
                                                <Badge variant="destructive" className="text-xs">
                                                  Credit
                                                </Badge>
                                              )}
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                              <span className={txn.quantity < 0 ? 'text-red-600' : ''}>
                                                {txn.quantity}
                                              </span>
                                            </td>
                                            <td className="px-3 py-2 text-right">{formatCurrency(txn.unit_price)}</td>
                                            <td className="px-3 py-2 text-right font-medium">
                                              <span className={txn.amount < 0 ? 'text-red-600' : ''}>
                                                {formatCurrency(txn.amount)}
                                              </span>
                                            </td>
                                            <td className="px-3 py-2">
                                              <Badge
                                                variant={
                                                  txn.payment_status === 'paid' ? 'default' :
                                                  txn.payment_status === 'overdue' ? 'destructive' :
                                                  'secondary'
                                                }
                                                className="text-xs"
                                              >
                                                {txn.payment_status || 'pending'}
                                              </Badge>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      )
                    })
                  )}
                </tbody>
                <tfoot className="bg-muted/50 border-t-2">
                  <tr className="font-bold">
                    <td className="px-4 py-3 text-sm">TOTAL</td>
                    <td className="px-4 py-3 text-right text-sm">
                      {productSummaries.reduce((sum, p) => sum + p.total_invoices, 0)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      {productSummaries.reduce((sum, p) => sum + p.total_credit_memos, 0)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      {productSummaries.reduce((sum, p) => sum + p.total_quantity, 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      {productSummaries.reduce((sum, p) => sum + p.net_quantity, 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      -
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      {formatCurrency(productSummaries.reduce((sum, p) => sum + p.total_revenue, 0))}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-sm">
                      {formatCurrency(productSummaries.reduce((sum, p) => sum + p.net_revenue, 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
        </>
      )}

      {/* Add Sale Modal */}
      <AddDealerSaleModal
        open={addSaleModalOpen}
        onOpenChange={setAddSaleModalOpen}
        dealerId={dealerId}
        onSuccess={loadData}
      />
    </div>
  )
}
