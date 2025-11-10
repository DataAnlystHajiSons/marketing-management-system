"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Plus, Package, AlertCircle, CheckCircle2, Trash2 } from "lucide-react"
import { farmersAPI } from "@/lib/supabase/farmers"
import { usersAPI } from "@/lib/supabase/users"
import { fieldStaffAPI } from "@/lib/supabase/field-staff"
import { farmerEngagementsAPI, type DataSourceType } from "@/lib/supabase/farmer-engagements"
import { useFarmerEngagements } from "@/hooks/use-farmer-engagements"
import { useProducts } from "@/hooks/use-products"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { LocationSelector } from "@/components/crm/location-selector"
import { AddVillageModal } from "@/components/crm/add-village-modal"

export default function EditFarmerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState('')
  const [tmos, setTmos] = useState<any[]>([])
  const [fieldStaff, setFieldStaff] = useState<any[]>([])
  const { products, loading: productsLoading } = useProducts()
  const { engagements, loading: engagementsLoading, refresh: refreshEngagements } = useFarmerEngagements({ farmer_id: id, is_active: true })
  
  const [formData, setFormData] = useState({
    farmerCode: '',
    fullName: '',
    phone: '',
    alternatePhone: '',
    email: '',
    // Location (new hierarchical)
    zoneId: '',
    areaId: '',
    villageId: '',
    // Location (old - for compatibility)
    village: '',
    city: '',
    district: '',
    address: '',
    landSize: '',
    primaryCrops: '',
    assignedTMO: '',
    leadSourceFieldStaff: '',
    assignedDealer: '',
  })

  // New engagement form
  const [newEngagement, setNewEngagement] = useState({
    productId: '',
    season: '',
    dataSource: 'manual_entry' as DataSourceType,
    assignedTMO: '',
    fieldStaff: '',
  })
  
  const [showAddEngagement, setShowAddEngagement] = useState(false)
  const [addVillageModalOpen, setAddVillageModalOpen] = useState(false)

  useEffect(() => {
    async function fetchData() {
      const [farmerRes, tmosRes, fieldStaffRes] = await Promise.all([
        farmersAPI.getById(id),
        usersAPI.getTMOs(),
        fieldStaffAPI.getAll(),
      ])
      
      if (farmerRes.error) {
        alert('Error loading farmer: ' + farmerRes.error.message)
        router.push('/crm/farmers')
      } else if (farmerRes.data) {
        const farmer = farmerRes.data
        setFormData({
          farmerCode: farmer.farmer_code || '',
          fullName: farmer.full_name,
          phone: farmer.phone,
          alternatePhone: farmer.alternate_phone || '',
          email: farmer.email || '',
          zoneId: farmer.zone_id || '',
          areaId: farmer.area_id || '',
          villageId: farmer.village_id || '',
          village: farmer.village || '',
          city: farmer.city || '',
          district: farmer.district || '',
          address: farmer.address || '',
          landSize: farmer.land_size_acres?.toString() || '',
          primaryCrops: farmer.primary_crops?.join(', ') || '',
          assignedTMO: farmer.assigned_tmo_id || '',
          leadSourceFieldStaff: farmer.assigned_field_staff_id || '',
          assignedDealer: farmer.assigned_dealer_id || '',
        })
      }
      
      if (tmosRes.data) setTmos(tmosRes.data)
      else setTmos([])
      
      if (fieldStaffRes.data) setFieldStaff(fieldStaffRes.data.filter(s => s.is_active))
      else setFieldStaff([])
      
      setLoadingData(false)
    }
    fetchData()
  }, [id, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error: err } = await farmersAPI.update(id, {
        farmer_code: formData.farmerCode,
        full_name: formData.fullName,
        phone: formData.phone,
        alternate_phone: formData.alternatePhone || undefined,
        email: formData.email || undefined,
        zone_id: formData.zoneId || undefined,
        area_id: formData.areaId || undefined,
        village_id: formData.villageId || undefined,
        village: formData.village || undefined,
        city: formData.city || undefined,
        district: formData.district || undefined,
        address: formData.address || undefined,
        land_size_acres: formData.landSize ? parseFloat(formData.landSize) : undefined,
        primary_crops: formData.primaryCrops ? formData.primaryCrops.split(',').map(c => c.trim()) : undefined,
        assigned_tmo_id: formData.assignedTMO || undefined,
        assigned_field_staff_id: formData.leadSourceFieldStaff || undefined,
        assigned_dealer_id: formData.assignedDealer || undefined,
      })

      if (err) {
        setError(err.message || 'Failed to update farmer')
      } else {
        alert('Farmer updated successfully!')
        router.push(`/crm/farmers/${id}`)
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleAddEngagement = async () => {
    if (!newEngagement.productId || !newEngagement.season) {
      alert('Please select product and enter season')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { error: err } = await farmerEngagementsAPI.create({
        farmer_id: id,
        product_id: newEngagement.productId,
        season: newEngagement.season,
        data_source: newEngagement.dataSource,
        assigned_tmo_id: newEngagement.assignedTMO || undefined,
        assigned_field_staff_id: newEngagement.fieldStaff || undefined,
        lead_stage: 'new',
      })

      if (err) {
        setError(err.message || 'Failed to create engagement')
      } else {
        alert('Product engagement created successfully!')
        setNewEngagement({
          productId: '',
          season: '',
          dataSource: 'manual_entry',
          assignedTMO: '',
          fieldStaff: '',
        })
        setShowAddEngagement(false)
        refreshEngagements()
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteEngagement = async (engagementId: string, productName: string) => {
    if (!confirm(`Are you sure you want to delete engagement for "${productName}"?`)) return
    
    setLoading(true)
    try {
      const { error: err } = await farmerEngagementsAPI.close(engagementId, 'deleted_by_user')
      if (err) {
        alert('Error deleting engagement: ' + err.message)
      } else {
        alert('Engagement deleted successfully')
        refreshEngagements()
      }
    } catch (err: any) {
      alert('Error: ' + err.message)
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
        <Link href={`/crm/farmers/${id}`}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Edit Farmer</h1>
          <p className="text-muted-foreground">Update farmer information and manage product engagements</p>
        </div>
      </div>

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList>
          <TabsTrigger value="basic">Basic Information</TabsTrigger>
          <TabsTrigger value="engagements">
            Product Engagements
            {engagements.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {engagements.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Farmer Information</CardTitle>
            <CardDescription>Update the farmer's details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Personal Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="farmerCode">Farmer Code</Label>
                  <Input
                    id="farmerCode"
                    name="farmerCode"
                    value={formData.farmerCode}
                    onChange={handleChange}
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">Farmer code cannot be changed</p>
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
              <h3 className="text-lg font-semibold">Location Information</h3>
              
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

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Link href={`/crm/farmers/${id}`}>
                <Button type="button" variant="outline" disabled={loading}>
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Farmer'}
              </Button>
            </div>
          </CardContent>
        </Card>
          </form>
        </TabsContent>

        <TabsContent value="engagements">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Product Engagements
                  </CardTitle>
                  <CardDescription>
                    Manage this farmer's product-specific engagement tracking
                  </CardDescription>
                </div>
                <Button onClick={() => setShowAddEngagement(!showAddEngagement)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Engagement
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {showAddEngagement && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-4">
                  <h4 className="font-medium">Create New Product Engagement</h4>
                  
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="newProductId">Product *</Label>
                      <Select
                        id="newProductId"
                        value={newEngagement.productId}
                        onChange={(e) => setNewEngagement({ ...newEngagement, productId: e.target.value })}
                        disabled={productsLoading}
                      >
                        <option value="">Select product</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.product_name}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newSeason">Season *</Label>
                      <Input
                        id="newSeason"
                        placeholder="e.g., Winter 2024"
                        value={newEngagement.season}
                        onChange={(e) => setNewEngagement({ ...newEngagement, season: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newDataSource">Data Source</Label>
                      <Select
                        id="newDataSource"
                        value={newEngagement.dataSource}
                        onChange={(e) => setNewEngagement({ ...newEngagement, dataSource: e.target.value as DataSourceType })}
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

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="newAssignedTMO">Assign to TMO</Label>
                      <Select
                        id="newAssignedTMO"
                        value={newEngagement.assignedTMO}
                        onChange={(e) => setNewEngagement({ ...newEngagement, assignedTMO: e.target.value })}
                      >
                        <option value="">Select TMO (Optional)</option>
                        {tmos.map((tmo) => (
                          <option key={tmo.id} value={tmo.id}>
                            {tmo.full_name}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newFieldStaff">Field Staff</Label>
                      <Select
                        id="newFieldStaff"
                        value={newEngagement.fieldStaff}
                        onChange={(e) => setNewEngagement({ ...newEngagement, fieldStaff: e.target.value })}
                      >
                        <option value="">Select Field Staff (Optional)</option>
                        {fieldStaff.map((staff) => (
                          <option key={staff.id} value={staff.id}>
                            {staff.full_name} - {staff.staff_code}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowAddEngagement(false)}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="button" 
                      onClick={handleAddEngagement}
                      disabled={loading}
                    >
                      {loading ? 'Creating...' : 'Create Engagement'}
                    </Button>
                  </div>
                </div>
              )}

              {engagementsLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading engagements...
                </div>
              ) : engagements.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No product engagements yet</p>
                  <p className="text-sm mt-1">Click "Add Engagement" to create one</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {engagements.map((eng) => (
                    <div key={eng.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold flex items-center gap-2">
                            {eng.product?.product_name || 'General'}
                            {eng.is_converted && (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            )}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Season: {eng.season} • Source: {eng.data_source.replace(/_/g, ' ')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-100 text-blue-800">
                            {eng.lead_stage.replace(/_/g, ' ')}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteEngagement(eng.id, eng.product?.product_name || 'this product')}
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Score:</span> 
                          <span className="font-medium ml-1">{eng.lead_score}/100</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Quality:</span> 
                          <Badge variant="secondary" className="ml-1">{eng.lead_quality}</Badge>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Interactions:</span> 
                          <span className="font-medium ml-1">{eng.total_interactions}</span>
                        </div>
                      </div>

                      {eng.assigned_tmo && (
                        <p className="text-xs text-muted-foreground">
                          Managed by: {eng.assigned_tmo.full_name}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
