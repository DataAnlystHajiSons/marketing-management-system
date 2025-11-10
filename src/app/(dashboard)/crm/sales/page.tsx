"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Search, Filter, TrendingUp } from "lucide-react"

interface Transaction {
  id: string
  number: string
  date: string
  dealer: string
  farmer: string
  fieldStaff: string
  totalAmount: number
  paymentStatus: string
  products: number
}

const mockTransactions: Transaction[] = [
  {
    id: '1',
    number: 'TXN-24-000001',
    date: '2024-10-28',
    dealer: 'Green Valley Traders',
    farmer: 'Ali Hassan',
    fieldStaff: 'Ahmed Khan',
    totalAmount: 45000,
    paymentStatus: 'paid',
    products: 3
  },
  {
    id: '2',
    number: 'TXN-24-000002',
    date: '2024-10-27',
    dealer: 'Agri Solutions',
    farmer: 'Muhammad Akram',
    fieldStaff: 'Imran Ali',
    totalAmount: 78500,
    paymentStatus: 'pending',
    products: 5
  },
  {
    id: '3',
    number: 'TXN-24-000003',
    date: '2024-10-26',
    dealer: 'Green Valley Traders',
    farmer: 'Zahid Hussain',
    fieldStaff: 'Ahmed Khan',
    totalAmount: 32000,
    paymentStatus: 'paid',
    products: 2
  },
]

const paymentStatusColors: Record<string, string> = {
  paid: 'bg-green-100 text-green-800',
  pending: 'bg-amber-100 text-amber-800',
  overdue: 'bg-red-100 text-red-800',
}

export default function SalesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [transactions] = useState<Transaction[]>(mockTransactions)

  const filteredTransactions = transactions.filter(txn =>
    txn.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    txn.dealer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    txn.farmer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalSales = transactions.reduce((sum, t) => sum + t.totalAmount, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sales Transactions</h1>
          <p className="text-muted-foreground">Track sales and payment status</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Transaction
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">PKR {(totalSales / 1000).toFixed(0)}K</div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Total count</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              PKR {(transactions.filter(t => t.paymentStatus === 'paid').reduce((sum, t) => sum + t.totalAmount, 0) / 1000).toFixed(0)}K
            </div>
            <p className="text-xs text-muted-foreground mt-1">Collected</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              PKR {(transactions.filter(t => t.paymentStatus === 'pending').reduce((sum, t) => sum + t.totalAmount, 0) / 1000).toFixed(0)}K
            </div>
            <p className="text-xs text-muted-foreground mt-1">Outstanding</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Transactions</CardTitle>
              <CardDescription>{filteredTransactions.length} transactions found</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Dealer</TableHead>
                <TableHead>Farmer</TableHead>
                <TableHead>Field Staff</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((txn) => (
                <TableRow key={txn.id}>
                  <TableCell className="font-medium">{txn.number}</TableCell>
                  <TableCell className="text-sm">{new Date(txn.date).toLocaleDateString()}</TableCell>
                  <TableCell className="text-sm">{txn.dealer}</TableCell>
                  <TableCell className="text-sm">{txn.farmer}</TableCell>
                  <TableCell className="text-sm">{txn.fieldStaff}</TableCell>
                  <TableCell className="text-sm">{txn.products} items</TableCell>
                  <TableCell className="font-medium">PKR {txn.totalAmount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge className={paymentStatusColors[txn.paymentStatus]}>
                      {txn.paymentStatus.toUpperCase()}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
