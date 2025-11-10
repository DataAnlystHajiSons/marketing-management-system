"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, TrendingUp } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { dealerSalesAPI } from "@/lib/supabase/dealer-sales"
import { formatCurrency } from "@/lib/utils"

interface SalesTrendChartProps {
  dealerId: string
  startDate?: string
  endDate?: string
}

type Period = 'daily' | 'weekly' | 'monthly'

export function SalesTrendChart({ dealerId, startDate, endDate }: SalesTrendChartProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [trendData, setTrendData] = useState<any[]>([])
  const [period, setPeriod] = useState<Period>('monthly')

  useEffect(() => {
    loadTrendData()
  }, [dealerId, period, startDate, endDate])

  const loadTrendData = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await dealerSalesAPI.getSalesTrend(
        dealerId,
        period,
        startDate,
        endDate
      )

      if (fetchError) throw new Error(fetchError.message)
      
      // Format data for chart
      const formattedData = (data || []).map((item: any) => ({
        date: formatDateLabel(item.date, period),
        sales: item.sales || 0,
        count: item.count || 0,
        fullDate: item.date
      }))

      setTrendData(formattedData)
    } catch (err: any) {
      setError(err.message || 'Failed to load trend data')
    } finally {
      setLoading(false)
    }
  }

  const formatDateLabel = (dateStr: string, period: Period): string => {
    const date = new Date(dateStr)
    
    if (period === 'monthly') {
      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    } else if (period === 'weekly') {
      return `Week ${Math.ceil(date.getDate() / 7)}`
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-sm mb-1">{data.date}</p>
          <p className="text-sm text-green-600">
            Sales: {formatCurrency(data.sales)}
          </p>
          <p className="text-xs text-muted-foreground">
            {data.count} transaction{data.count !== 1 ? 's' : ''}
          </p>
        </div>
      )
    }
    return null
  }

  const totalSales = trendData.reduce((sum, item) => sum + item.sales, 0)
  const avgSales = trendData.length > 0 ? totalSales / trendData.length : 0
  const highestSales = Math.max(...trendData.map(item => item.sales), 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Sales Trend
            </CardTitle>
            <CardDescription>
              Track sales performance over time
            </CardDescription>
          </div>
          
          {/* Period Toggle */}
          <div className="flex gap-2">
            <Button
              variant={period === 'daily' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod('daily')}
            >
              Daily
            </Button>
            <Button
              variant={period === 'weekly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod('weekly')}
            >
              Weekly
            </Button>
            <Button
              variant={period === 'monthly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod('monthly')}
            >
              Monthly
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            <p>{error}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={loadTrendData}>
              Retry
            </Button>
          </div>
        ) : trendData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No sales data available for this period
          </div>
        ) : (
          <>
            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Total Sales</div>
                <div className="text-lg font-bold">{formatCurrency(totalSales)}</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Average</div>
                <div className="text-lg font-bold">{formatCurrency(avgSales)}</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Highest</div>
                <div className="text-lg font-bold">{formatCurrency(highestSales)}</div>
              </div>
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                  tickFormatter={(value) => {
                    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
                    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
                    return value.toString()
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Sales Amount"
                />
              </LineChart>
            </ResponsiveContainer>

            {/* Data Summary */}
            <div className="mt-4 text-center text-xs text-muted-foreground">
              Showing {trendData.length} data point{trendData.length !== 1 ? 's' : ''}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
