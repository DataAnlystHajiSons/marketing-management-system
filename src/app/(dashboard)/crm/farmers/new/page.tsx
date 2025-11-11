"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, AlertCircle, Package } from "lucide-react"
import { farmersAPI } from "@/lib/supabase/farmers"
import { usersAPI } from "@/lib/supabase/users"
import { farmerEngagementsAPI, type DataSourceType } from "@/lib/supabase/farmer-engagements"
import { useProducts } from "@/hooks/use-products"
import { LocationSelector } from "@/components/crm/location-selector"
import { AddVillageModal } from "@/components/crm/add-village-modal"

export default function NewFarmerPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tmos, setTmos] = useState<any[]>([])
  const [fieldStaff, setFieldStaff] = useState<any[]>([])
  const [dealers, setDealers] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [addVillageModalOpen, setAddVillageModalOpen] = useState(false)
  const { products, loading: productsLoading } = useProducts({ stage: 'commercial' })
  
  const [formData, setFormData] = useState({
    // Farmer demographic fields
    fullName: '',
    phone: '',
    alternatePhone: '',
    email: '',
    // Location (new hierarchical)
    zoneId: '',
    areaId: '',
    villageId: '',
    // Location (old - kept for backward compatibility)
    village: '',
    city: '',
    district: '',
    address: '',
    landSize: '',
    primaryCrops: '',
    assignedTMO: '',
    leadSourceFieldStaff: '',
    assignedDealer: '',
    // Engagement fields
    productId: '',
    season: '',
    dataSource: 'manual_entry' as DataSourceType,
  })

  // Ensure all values are strings, not undefined
  useEffect(() => {
    // Form data initialized with empty strings
  }, [])

  // Fetch TMOs, Field Staff, and Dealers on component mount
  useEffect(() => {
    async function fetchUsers() {
      setLoadingUsers(true)
      
      const { data: tmosData } = await usersAPI.getTMOs()
      const { data: fieldStaffData } = await usersAPI.getFieldStaff()
      const { data: dealersData } = await usersAPI.getDealers()
      
      if (tmosData) setTmos(tmosData)
      if (fieldStaffData) setFieldStaff(fieldStaffData)
      if (dealersData) setDealers(dealersData)
      else {
        setTmos([])
        setFieldStaff([])
        setDealers([])
      }
      
      setLoadingUsers(false)
    }
    
    fetchUsers()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Step 1: Create farmer (demographics + assignments)
      const { data: farmer, error: farmerError } = await farmersAPI.create({
        full_name: formData.fullName,
        phone: formData.phone,
        alternate_phone: formData.alternatePhone || undefined,
        email: formData.email || undefined,
        // New hierarchical location
        zone_id: formData.zoneId || undefined,
        area_id: formData.areaId || undefined,
        village_id: formData.villageId || undefined,
        // Old location fields (keep for backward compatibility during migration)
        city: formData.city || undefined,
        district: formData.district || undefined,
        address: formData.address || undefined,
        land_size_acres: formData.landSize ? parseFloat(formData.landSize) : undefined,
        primary_crops: formData.primaryCrops ? formData.primaryCrops.split(',').map(c => c.trim()) : undefined,
        assigned_tmo_id: formData.assignedTMO || undefined,
        assigned_field_staff_id: formData.leadSourceFieldStaff || undefined,
        assigned_dealer_id: formData.assignedDealer || undefined,
      })

      if (farmerError || !farmer) {
        setError(farmerError?.message || 'Failed to create farmer')
        return
      }

      // Step 2: Create product engagement if product selected
      if (formData.productId && formData.season) {
        const { error: engagementError } = await farmerEngagementsAPI.create({
          farmer_id: farmer.id,
          product_id: formData.productId,
          season: formData.season,
          data_source: formData.dataSource,
          assigned_tmo_id: formData.assignedTMO || undefined,
          assigned_field_staff_id: formData.leadSourceFieldStaff || undefined,
          lead_stage: 'new',
        })

        if (engagementError) {
          console.error('Error creating engagement:', engagementError)
          // Don't fail the whole operation, just log the error
        }
      }

      alert('Farmer created successfully!' + (formData.productId ? ' Product engagement created.' : ''))
      router.push('/crm/farmers')
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
        <Link href="/crm/farmers">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Add New Farmer</h1>
          <p className="text-muted-foreground">Create a new farmer record</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Farmer Information</CardTitle>
            <CardDescription>Enter the farmer's personal and farming details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Personal Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
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
                  <Label htmlFor="phone">Phone Number *</Label>
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
                  <Label htmlFor="alternatePhone">Alternate Phone</Label>
                  <Input
                    id="alternatePhone"
                    name="alternatePhone"
                    placeholder="03XX-XXXXXXX"
                    value={formData.alternatePhone}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="farmer@example.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Location</h3>
              
              {/* Hierarchical Location Selector */}
              <LocationSelector
                selectedZone={formData.zoneId}
                selectedArea={formData.areaId}
                selectedVillage={formData.villageId}
                onLocationChange={(location) => {
                  setFormData({
                    ...formData,
                    zoneId: location.zoneId || '',
                    areaId: location.areaId || '',
                    villageId: location.villageId || '',
                  })
                }}
                required={true}
                showAddVillage={true}
                onAddVillage={() => setAddVillageModalOpen(true)}
              />
              
              {/* Specific Address */}
              <div className="space-y-2">
                <Label htmlFor="address">Specific Address</Label>
                <Input
                  id="address"
                  name="address"
                  placeholder="House #, Street, Landmarks (e.g., House #45, Main Street)"
                  value={formData.address}
                  onChange={handleChange}
                />
                <p className="text-xs text-muted-foreground">
                  Enter house number, street name, or nearby landmarks
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Farming Details</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="landSize">Land Size (Acres)</Label>
                  <Input
                    id="landSize"
                    name="landSize"
                    type="number"
                    step="0.01"
                    placeholder="Enter land size"
                    value={formData.landSize}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primaryCrops">Primary Crops</Label>
                  <Input
                    id="primaryCrops"
                    name="primaryCrops"
                    placeholder="e.g., Cotton, Wheat, Rice (comma separated)"
                    value={formData.primaryCrops}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Product Engagement</h3>
                <Badge variant="secondary">Optional</Badge>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-4">
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <p>
                    Link this farmer to a product and season to track their journey. 
                    You can add more product engagements later from the farmer detail page.
                  </p>
                </div>
                
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="productId">Product/Crop</Label>
                    <Select
                      id="productId"
                      name="productId"
                      value={formData.productId}
                      onChange={handleChange}
                      disabled={productsLoading}
                    >
                      <option value="">Select product (optional)</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.product_name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="season">Season</Label>
                    <Input
                      id="season"
                      name="season"
                      placeholder="e.g., Winter 2024, Kharif 2024"
                      value={formData.season}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dataSource">Data Source</Label>
                    <Select
                      id="dataSource"
                      name="dataSource"
                      value={formData.dataSource}
                      onChange={handleChange}
                    >
                      <option value="manual_entry">Manual Entry</option>
                      <option value="data_bank">Data Bank</option>
                      <option value="fm_invitees">FM Invitees</option>
                      <option value="fm_attendees">FM Attendees</option>
                      <option value="fd_invitees">FD Invitees</option>
                      <option value="fd_attendees">FD Attendees</option>
                      <option value="repzo">Repzo</option>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Assignment</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="assignedTMO">Assign to TMO *</Label>
                  <Select
                    id="assignedTMO"
                    name="assignedTMO"
                    value={formData.assignedTMO}
                    onChange={handleChange}
                    disabled={loadingUsers}
                    required
                  >
                    <option value="">Select Telemarketing Officer</option>
                    {tmos.map((tmo) => (
                      <option key={tmo.id} value={tmo.id}>
                        {tmo.full_name} {tmo.email ? `(${tmo.email})` : ''}
                      </option>
                    ))}
                  </Select>
                  {loadingUsers && (
                    <p className="text-xs text-muted-foreground">Loading TMOs...</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    TMO will manage and follow up with this farmer
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="leadSourceFieldStaff">Field Staff</Label>
                  <Select
                    id="leadSourceFieldStaff"
                    name="leadSourceFieldStaff"
                    value={formData.leadSourceFieldStaff}
                    onChange={handleChange}
                    disabled={loadingUsers}
                  >
                    <option value="">Select Field Staff (Optional)</option>
                    {fieldStaff.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.full_name} - {staff.staff_code}
                      </option>
                    ))}
                  </Select>
                  {loadingUsers && (
                    <p className="text-xs text-muted-foreground">Loading Field Staff...</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Field staff who referred this farmer
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignedDealer">Assigned Dealer</Label>
                  <Select
                    id="assignedDealer"
                    name="assignedDealer"
                    value={formData.assignedDealer}
                    onChange={handleChange}
                    disabled={loadingUsers}
                  >
                    <option value="">Select Dealer (Optional)</option>
                    {dealers.map((dealer) => (
                      <option key={dealer.id} value={dealer.id}>
                        {dealer.business_name} - {dealer.dealer_code}
                      </option>
                    ))}
                  </Select>
                  {loadingUsers && (
                    <p className="text-xs text-muted-foreground">Loading Dealers...</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Dealer serving this farmer's area
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Link href="/crm/farmers">
                <Button type="button" variant="outline" disabled={loading}>
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Farmer'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Add Village Modal */}
      <AddVillageModal
        open={addVillageModalOpen}
        onClose={() => setAddVillageModalOpen(false)}
        onVillageAdded={(villageId) => {
          setFormData({ ...formData, villageId })
          setAddVillageModalOpen(false)
        }}
        preSelectedAreaId={formData.areaId}
      />
    </div>
  )
}
