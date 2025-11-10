"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { areasAPI } from "@/lib/supabase/areas"
import { zonesAPI } from "@/lib/supabase/zones"

export default function NewAreaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [zones, setZones] = useState<any[]>([])
  const [loadingZones, setLoadingZones] = useState(true)
  
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    zoneId: '',
    isActive: 'true',
  })

  useEffect(() => {
    async function fetchZones() {
      const { data } = await zonesAPI.getAll()
      if (data) setZones(data.filter(z => z.is_active))
      else setZones([])
      setLoadingZones(false)
    }
    fetchZones()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error: err } = await areasAPI.create({
        code: formData.code,
        name: formData.name,
        zone_id: formData.zoneId,
        is_active: formData.isActive === 'true',
      })

      if (err) {
        setError(err.message || 'Failed to create area')
      } else {
        alert('Area created successfully!')
        router.push('/management/areas')
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/management/areas">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Add New Area</h1>
          <p className="text-muted-foreground">Create a new geographical area</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Area Information</CardTitle>
            <CardDescription>Enter the area details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="code">Area Code *</Label>
                <Input
                  id="code"
                  name="code"
                  placeholder="e.g., NZ-A01, LHR"
                  value={formData.code}
                  onChange={handleChange}
                  required
                />
                <p className="text-xs text-muted-foreground">Unique code for this area</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Area Name *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., Lahore City, Faisalabad District"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zoneId">Zone *</Label>
                <Select
                  id="zoneId"
                  name="zoneId"
                  value={formData.zoneId}
                  onChange={handleChange}
                  disabled={loadingZones}
                  required
                >
                  <option value="">Select Zone</option>
                  {zones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name} ({zone.code})
                    </option>
                  ))}
                </Select>
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
              <Link href="/management/areas">
                <Button type="button" variant="outline" disabled={loading}>
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Area'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
