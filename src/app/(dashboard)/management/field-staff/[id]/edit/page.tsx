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
import { fieldStaffAPI } from "@/lib/supabase/field-staff"
import { zonesAPI } from "@/lib/supabase/zones"
import { areasAPI } from "@/lib/supabase/areas"
import { usersAPI } from "@/lib/supabase/users"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function EditFieldStaffPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState('')
  const [zones, setZones] = useState<any[]>([])
  const [areas, setAreas] = useState<any[]>([])
  const [tmos, setTmos] = useState<any[]>([])
  
  const [formData, setFormData] = useState({
    staffCode: '',
    fullName: '',
    email: '',
    phone: '',
    zoneId: '',
    areaId: '',
    tmoId: '',
    designation: '',
    joiningDate: '',
    address: '',
    city: '',
    isActive: 'true',
  })

  useEffect(() => {
    async function fetchData() {
      const [staffRes, zonesRes, areasRes, tmosRes] = await Promise.all([
        fieldStaffAPI.getById(id),
        zonesAPI.getAll(),
        areasAPI.getAll(),
        usersAPI.getTMOs(),
      ])
      
      if (staffRes.error) {
        alert('Error loading field staff: ' + staffRes.error.message)
        router.push('/management/field-staff')
      } else if (staffRes.data) {
        setFormData({
          staffCode: staffRes.data.staff_code,
          fullName: staffRes.data.full_name,
          email: staffRes.data.email || '',
          phone: staffRes.data.phone,
          zoneId: staffRes.data.zone_id || '',
          areaId: staffRes.data.area_id || '',
          tmoId: staffRes.data.telemarketing_officer_id || '',
          designation: staffRes.data.designation || '',
          joiningDate: staffRes.data.joining_date || '',
          address: staffRes.data.address || '',
          city: staffRes.data.city || '',
          isActive: staffRes.data.is_active ? 'true' : 'false',
        })
      }
      
      if (zonesRes.data) setZones(zonesRes.data.filter(z => z.is_active))
      else setZones([])
      
      if (areasRes.data) setAreas(areasRes.data.filter(a => a.is_active))
      else setAreas([])
      
      if (tmosRes.data) setTmos(tmosRes.data)
      else setTmos([])
      
      setLoadingData(false)
    }
    fetchData()
  }, [id, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error: err } = await fieldStaffAPI.update(id, {
        staff_code: formData.staffCode,
        full_name: formData.fullName,
        email: formData.email || undefined,
        phone: formData.phone,
        zone_id: formData.zoneId || undefined,
        area_id: formData.areaId || undefined,
        telemarketing_officer_id: formData.tmoId || undefined,
        designation: formData.designation || undefined,
        joining_date: formData.joiningDate || undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
        is_active: formData.isActive === 'true',
      })

      if (err) {
        setError(err.message || 'Failed to update field staff')
      } else {
        alert('Field staff updated successfully!')
        router.push('/management/field-staff')
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

  const filteredAreas = formData.zoneId 
    ? areas.filter(a => a.zone_id === formData.zoneId)
    : areas

  if (loadingData) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/management/field-staff">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Edit Field Staff</h1>
          <p className="text-muted-foreground">Update field staff information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Field Staff Information</CardTitle>
            <CardDescription>Update the field staff details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="staffCode">Staff Code *</Label>
                  <Input
                    id="staffCode"
                    name="staffCode"
                    value={formData.staffCode}
                    onChange={handleChange}
                    required
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    placeholder="Enter full name"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="03XX-XXXXXXX"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="email@example.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    placeholder="e.g., Lahore, Faisalabad"
                    value={formData.city}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    name="address"
                    placeholder="Complete address"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Assignment</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="zoneId">Zone</Label>
                  <Select
                    id="zoneId"
                    name="zoneId"
                    value={formData.zoneId}
                    onChange={handleChange}
                  >
                    <option value="">Select Zone (Optional)</option>
                    {zones.map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {zone.name} ({zone.code})
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="areaId">Area</Label>
                  <Select
                    id="areaId"
                    name="areaId"
                    value={formData.areaId}
                    onChange={handleChange}
                  >
                    <option value="">Select Area (Optional)</option>
                    {filteredAreas.map((area) => (
                      <option key={area.id} value={area.id}>
                        {area.name} ({area.code})
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tmoId">Assigned TMO</Label>
                  <Select
                    id="tmoId"
                    name="tmoId"
                    value={formData.tmoId}
                    onChange={handleChange}
                  >
                    <option value="">Select TMO (Optional)</option>
                    {tmos.map((tmo) => (
                      <option key={tmo.id} value={tmo.id}>
                        {tmo.full_name} ({tmo.email})
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Employment Details</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="designation">Designation</Label>
                  <Input
                    id="designation"
                    name="designation"
                    placeholder="e.g., Field Officer, Area Manager"
                    value={formData.designation}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="joiningDate">Joining Date</Label>
                  <Input
                    id="joiningDate"
                    name="joiningDate"
                    type="date"
                    value={formData.joiningDate}
                    onChange={handleChange}
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
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Link href="/management/field-staff">
                <Button type="button" variant="outline" disabled={loading}>
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Field Staff'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
