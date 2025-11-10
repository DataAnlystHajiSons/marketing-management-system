"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
import { Plus, Search, Filter, Package, Edit, Trash2 } from "lucide-react"
import { productsAPI, type Product } from "@/lib/supabase/products"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

const stageColors: Record<string, string> = {
  research: 'bg-slate-100 text-slate-800',
  development: 'bg-blue-100 text-blue-800',
  trial: 'bg-cyan-100 text-cyan-800',
  pre_commercial: 'bg-amber-100 text-amber-800',
  commercial: 'bg-green-100 text-green-800',
  discontinued: 'bg-red-100 text-red-800',
}

export default function ProductsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    commercial: 0,
    inDevelopment: 0,
    categories: 0,
  })

  useEffect(() => {
    loadProducts()
    loadStats()
  }, [])

  const loadProducts = async () => {
    setLoading(true)
    const { data, error } = await productsAPI.getAll(false) // Get all products including inactive
    if (!error && data) {
      setProducts(data)
    }
    setLoading(false)
  }

  const loadStats = async () => {
    const { data, error } = await productsAPI.getStats()
    if (!error && data) {
      setStats(data)
    }
  }

  const handleDelete = async (id: string, productName: string) => {
    if (!confirm(`Are you sure you want to deactivate "${productName}"?`)) return
    
    const { error } = await productsAPI.delete(id)
    if (error) {
      alert('Error deactivating product: ' + error.message)
    } else {
      alert('Product deactivated successfully')
      loadProducts()
      loadStats()
    }
  }

  const filteredProducts = products.filter(product =>
    product.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.product_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.category && product.category.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog and sowing calendar</p>
        </div>
        <Link href="/products/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground mt-1">Active catalog</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Commercial</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.commercial}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Ready for sale</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Development</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.inDevelopment}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Pipeline products</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.categories}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Product types</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Product Catalog</CardTitle>
              <CardDescription>{filteredProducts.length} products found</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
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
                <TableHead>Code</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    No products found. Click "Add Product" to create your first product.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.product_code}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10">
                          <Package className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{product.product_name}</div>
                          {product.sub_category && (
                            <div className="text-xs text-muted-foreground">{product.sub_category}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{product.category || '-'}</TableCell>
                    <TableCell>
                      <Badge className={stageColors[product.current_stage]}>
                        {product.current_stage.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {product.unit_price ? (
                        <>PKR {product.unit_price.toLocaleString()} {product.unit_of_measure && `/ ${product.unit_of_measure}`}</>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.is_active ? 'default' : 'secondary'}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/products/${product.id}/edit`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {product.is_active && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(product.id, product.product_name)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
