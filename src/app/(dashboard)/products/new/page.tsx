"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { productsAPI, type ProductStage } from "@/lib/supabase/products"

export default function NewProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    product_code: '',
    product_name: '',
    category: '',
    sub_category: '',
    current_stage: 'research' as ProductStage,
    description: '',
    unit_price: '',
    unit_of_measure: '',
    launch_date: '',
    is_active: true,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error: err } = await productsAPI.create({
        product_code: formData.product_code,
        product_name: formData.product_name,
        category: formData.category || undefined,
        sub_category: formData.sub_category || undefined,
        current_stage: formData.current_stage,
        description: formData.description || undefined,
        unit_price: formData.unit_price ? parseFloat(formData.unit_price) : undefined,
        unit_of_measure: formData.unit_of_measure || undefined,
        launch_date: formData.launch_date || undefined,
        is_active: formData.is_active,
      })

      if (err) {
        setError(err.message || 'Failed to create product')
      } else {
        alert('Product created successfully!')
        router.push('/products')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/products">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Add New Product</h1>
          <p className="text-muted-foreground">Create a new product in your catalog</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
            <CardDescription>Enter the basic details of the new product</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="product_code">Product Code *</Label>
                <Input
                  id="product_code"
                  name="product_code"
                  placeholder="e.g., PRD-001"
                  value={formData.product_code}
                  onChange={handleChange}
                  required
                />
                <p className="text-xs text-muted-foreground">Unique identifier for the product</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="product_name">Product Name *</Label>
                <Input
                  id="product_name"
                  name="product_name"
                  placeholder="e.g., BT Cotton Seeds - Premium"
                  value={formData.product_name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  name="category"
                  placeholder="e.g., Cotton Seeds"
                  value={formData.category}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sub_category">Sub-Category</Label>
                <Input
                  id="sub_category"
                  name="sub_category"
                  placeholder="e.g., Hybrid Variety"
                  value={formData.sub_category}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Detailed description of the product..."
                value={formData.description}
                onChange={handleChange}
                rows={4}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="current_stage">Current Stage *</Label>
                <Select
                  id="current_stage"
                  name="current_stage"
                  value={formData.current_stage}
                  onChange={handleChange}
                  required
                >
                  <option value="research">Research</option>
                  <option value="development">Development</option>
                  <option value="trial">Trial</option>
                  <option value="pre_commercial">Pre-Commercial</option>
                  <option value="commercial">Commercial</option>
                  <option value="discontinued">Discontinued</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit_price">Unit Price (PKR)</Label>
                <Input
                  id="unit_price"
                  name="unit_price"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.unit_price}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit_of_measure">Unit of Measure</Label>
                <Input
                  id="unit_of_measure"
                  name="unit_of_measure"
                  placeholder="e.g., bag, kg, liter"
                  value={formData.unit_of_measure}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="launch_date">Launch Date</Label>
                <Input
                  id="launch_date"
                  name="launch_date"
                  type="date"
                  value={formData.launch_date}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2 flex items-center">
                <div className="flex items-center space-x-2 pt-8">
                  <input
                    type="checkbox"
                    id="is_active"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="is_active" className="font-normal cursor-pointer">
                    Active (available for use)
                  </Label>
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Link href="/products">
                <Button type="button" variant="outline" disabled={loading}>
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Product'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
