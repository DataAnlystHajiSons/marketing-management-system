"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { dealersAPI } from "@/lib/supabase/dealers"
import { zonesAPI } from "@/lib/supabase/zones"
import { areasAPI } from "@/lib/supabase/areas"
import { villagesAPI } from "@/lib/supabase/villages"
import { usersAPI } from "@/lib/supabase/users"
import Link from "next/link"
import { useEffect } from "react"

export default function NewDealerPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [zones, setZones] = useState<any[]>([])
  const [areas, setAreas] = useState<any[]>([])
  const [villages, setVillages] = useState<any[]>([])
  const [fieldStaff, setFieldStaff] = useState<any[]>([])
  const [formData, setFormData] = useState({
    dealer_code: '',
    business_name: '',
    owner_name: '',
    phone: '',
    alternate_phone: '',
    email: '',
    zone_id: '',
    area_id: '',
    village_id: '',
    address: '',
    field_staff_id: '',
    credit_limit: '',
    current_balance: '0',
    relationship_status: 'active',
    relationship_score: '50',
    performance_rating: 'average',
    is_active: true,
  })

  // Load zones and field staff on mount
  useEffect(() => {
    async function loadData() {
      const [zonesRes, fsRes] = await Promise.all([
        zonesAPI.getAll(),
        usersAPI.getFieldStaff(),
      ])
      
      if (zonesRes.data) setZones(zonesRes.data)
      if (fsRes.data) setFieldStaff(fsRes.data)
    }
    loadData()
  }, [])

  // Load areas when zone is selected
  useEffect(() => {
    async function loadAreas() {
      if (!formData.zone_id) {
        setAreas([])
        return
      }

      const { data } = await areasAPI.getByZone(formData.zone_id)
      if (data) setAreas(data)
    }
    loadAreas()
  }, [formData.zone_id])

  // Load villages when area is selected
  useEffect(() => {
    async function loadVillages() {
      if (!formData.area_id) {
        setVillages([])
        return
      }

      const { data } = await villagesAPI.getByArea(formData.area_id)
      if (data) setVillages(data)
    }
    loadVillages()
  }, [formData.area_id])

  // Handle cascading dropdown changes
  const handleZoneChange = (zoneId: string) => {
    setFormData({
      ...formData,
      zone_id: zoneId,
      area_id: '', // Clear dependent fields
      village_id: '',
    })
  }

  const handleAreaChange = (areaId: string) => {
    setFormData({
      ...formData,
      area_id: areaId,
      village_id: '', // Clear dependent field
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Prepare data
      const dealerData = {
        dealer_code: formData.dealer_code,
        business_name: formData.business_name,
        owner_name: formData.owner_name,
        phone: formData.phone,
        alternate_phone: formData.alternate_phone || undefined,
        email: formData.email || undefined,
        zone_id: formData.zone_id || undefined,
        area_id: formData.area_id || undefined,
        village_id: formData.village_id || undefined,
        address: formData.address || undefined,
        field_staff_id: formData.field_staff_id || undefined,
        credit_limit: formData.credit_limit ? parseFloat(formData.credit_limit) : undefined,
        current_balance: formData.current_balance ? parseFloat(formData.current_balance) : 0,
        relationship_status: formData.relationship_status,
        relationship_score: parseInt(formData.relationship_score),
        performance_rating: formData.performance_rating || undefined,
        is_active: formData.is_active,
      }

      const { data, error } = await dealersAPI.create(dealerData)

      if (error) {
        alert('Error creating dealer: ' + error.message)
      } else {
        alert('Dealer created successfully!')
        router.push('/crm/dealers')
      }
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const updateFormData = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value })
  }

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/crm/dealers">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Add New Dealer</h1>
          <p className="text-muted-foreground">Register a new dealer in the system</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Primary details about the dealer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dealer_code">
                    Dealer Code <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="dealer_code"
                    placeholder="D-001"
                    value={formData.dealer_code}
                    onChange={(e) => updateFormData('dealer_code', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business_name">
                    Business Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="business_name"
                    placeholder="Green Valley Traders"
                    value={formData.business_name}
                    onChange={(e) => updateFormData('business_name', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="owner_name">
                    Owner Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="owner_name"
                    placeholder="Malik Aslam"
                    value={formData.owner_name}
                    onChange={(e) => updateFormData('owner_name', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="0300-1234567"
                    value={formData.phone}
                    onChange={(e) => updateFormData('phone', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alternate_phone">Alternate Phone</Label>
                  <Input
                    id="alternate_phone"
                    type="tel"
                    placeholder="0321-7654321"
                    value={formData.alternate_phone}
                    onChange={(e) => updateFormData('alternate_phone', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="dealer@example.com"
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location Details */}
          <Card>
            <CardHeader>
              <CardTitle>Location Details</CardTitle>
              <CardDescription>Hierarchical location (Zone → Area → Village)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="zone_id">Zone/Province</Label>
                  <Select value={formData.zone_id} onValueChange={handleZoneChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Zone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Select Zone</SelectItem>
                      {zones.map((zone) => (
                        <SelectItem key={zone.id} value={zone.id}>
                          {zone.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="area_id">Area/District</Label>
                  <Select 
                    value={formData.area_id} 
                    onValueChange={handleAreaChange}
                    disabled={!formData.zone_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={formData.zone_id ? 'Select Area' : 'Select Zone First'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">
                        {formData.zone_id ? 'Select Area' : 'Select Zone First'}
                      </SelectItem>
                      {areas.map((area) => (
                        <SelectItem key={area.id} value={area.id}>
                          {area.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="village_id">Village/Town</Label>
                  <Select
                    value={formData.village_id}
                    onValueChange={(value) => updateFormData('village_id', value)}
                    disabled={!formData.area_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={formData.area_id ? 'Select Village' : 'Select Area First'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">
                        {formData.area_id ? 'Select Village' : 'Select Area First'}
                      </SelectItem>
                      {villages.map((village) => (
                        <SelectItem key={village.id} value={village.id}>
                          {village.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Full Address</Label>
                  <Textarea
                    id="address"
                    placeholder="Street address, landmarks, etc."
                    value={formData.address}
                    onChange={(e) => updateFormData('address', e.target.value)}
                    rows={3}
                    className="md:col-span-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Relationship & Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Relationship & Performance</CardTitle>
              <CardDescription>Track dealer relationship metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="relationship_status">
                    Relationship Status <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.relationship_status}
                    onValueChange={(value) => updateFormData('relationship_status', value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="preferred">Preferred</SelectItem>
                      <SelectItem value="platinum">Platinum</SelectItem>
                      <SelectItem value="at_risk">At Risk</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="relationship_score">
                    Relationship Score (0-100) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="relationship_score"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.relationship_score}
                    onChange={(e) => updateFormData('relationship_score', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="performance_rating">Performance Rating</Label>
                  <Select
                    value={formData.performance_rating}
                    onValueChange={(value) => updateFormData('performance_rating', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Select Rating</SelectItem>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="average">Average</SelectItem>
                      <SelectItem value="below_average">Below Average</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="is_active">Status</Label>
                  <Select
                    value={formData.is_active ? 'true' : 'false'}
                    onValueChange={(value) => updateFormData('is_active', value === 'true')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Details */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Details</CardTitle>
              <CardDescription>Credit limits and balances</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="credit_limit">Credit Limit (PKR)</Label>
                  <Input
                    id="credit_limit"
                    type="number"
                    min="0"
                    placeholder="1000000"
                    value={formData.credit_limit}
                    onChange={(e) => updateFormData('credit_limit', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="current_balance">Current Balance (PKR)</Label>
                  <Input
                    id="current_balance"
                    type="number"
                    placeholder="0"
                    value={formData.current_balance}
                    onChange={(e) => updateFormData('current_balance', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assignment */}
          <Card>
            <CardHeader>
              <CardTitle>Assignment</CardTitle>
              <CardDescription>Assign field staff to manage this dealer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="field_staff_id">Assigned Field Staff</Label>
                <Select
                  value={formData.field_staff_id}
                  onValueChange={(value) => updateFormData('field_staff_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Field Staff" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Select Field Staff</SelectItem>
                    {fieldStaff.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.full_name} ({staff.staff_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/crm/dealers')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Create Dealer
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
