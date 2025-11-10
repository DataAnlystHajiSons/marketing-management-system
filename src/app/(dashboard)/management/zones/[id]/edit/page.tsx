"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { zonesAPI } from "@/lib/supabase/zones"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function EditZonePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    country: '',
    isActive: 'true',
  })

  useEffect(() => {
    async function fetchZone() {
      const { data, error } = await zonesAPI.getById(id)
      if (error) {
        alert('Error loading zone: ' + error.message)
        router.push('/management/zones')
      } else if (data) {
        setFormData({
          code: data.code,
          name: data.name,
          country: data.country || 'Pakistan',
          isActive: data.is_active ? 'true' : 'false',
        })
      }
      setLoadingData(false)
    }
    fetchZone()
  }, [id, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error: err } = await zonesAPI.update(id, {
        code: formData.code,
        name: formData.name,
        country: formData.country || 'Pakistan',
        is_active: formData.isActive === 'true',
      })

      if (err) {
        setError(err.message || 'Failed to update zone')
      } else {
        alert('Zone updated successfully!')
        router.push('/management/zones')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  if (loadingData) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/management/zones">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Edit Zone</h1>
          <p className="text-muted-foreground">Update zone information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Zone Information</CardTitle>
            <CardDescription>Update the zone details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="code">Zone Code *</Label>
                <Input
                  id="code"
                  name="code"
                  placeholder="e.g., NZ, SZ, CZ"
                  value={formData.code}
                  onChange={handleChange}
                  required
                />
                <p className="text-xs text-muted-foreground">Short code (2-3 characters recommended)</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Zone Name *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., North Zone, Punjab Region"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  name="country"
                  placeholder="Pakistan"
                  value={formData.country}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="isActive">Status *</Label>
                <Select
                  id="isActive"
                  name="isActive"
                  value={formData.isActive}
                  onChange={handleChange}
                  required
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </Select>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Link href="/management/zones">
                <Button type="button" variant="outline" disabled={loading}>
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Zone'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
