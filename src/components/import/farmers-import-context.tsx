"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info, ArrowRight, Users, Calendar, MapPin, Building2, Phone, Globe } from "lucide-react"
import { useProducts } from "@/hooks/use-products"

interface ImportContext {
  purpose: 'new_leads' | 'event_invitees' | 'event_attendees' | 'field_visit' | 'dealer_referral' | 'general'
  productId?: string
  dataSource: 'manual_entry' | 'event_registration' | 'field_visit' | 'dealer_referral' | 'web_inquiry' | 'phone_inquiry'
  initialStage: 'new_lead' | 'contacted' | 'interested' | 'qualified'
  duplicateStrategy: 'skip' | 'update' | 'create_new'
  createEngagement: boolean
}

interface FarmersImportContextProps {
  onContextComplete: (context: ImportContext) => void
}

const purposeOptions = [
  {
    value: 'event_invitees',
    label: 'Event Invitees List',
    description: 'Farmers invited to an upcoming event/meeting',
    icon: Calendar,
    dataSource: 'event_registration' as const,
    initialStage: 'new_lead' as const,
    createEngagement: true,
  },
  {
    value: 'event_attendees',
    label: 'Event Attendees List',
    description: 'Farmers who attended the event (for follow-up)',
    icon: Users,
    dataSource: 'event_registration' as const,
    initialStage: 'contacted' as const,
    createEngagement: true,
  },
  {
    value: 'field_visit',
    label: 'Field Visit Leads',
    description: 'Farmers met during field visits',
    icon: MapPin,
    dataSource: 'field_visit' as const,
    initialStage: 'contacted' as const,
    createEngagement: true,
  },
  {
    value: 'dealer_referral',
    label: 'Dealer Referrals',
    description: 'Farmers referred by dealers',
    icon: Building2,
    dataSource: 'dealer_referral' as const,
    initialStage: 'new_lead' as const,
    createEngagement: true,
  },
  {
    value: 'new_leads',
    label: 'New Leads (Phone/Web)',
    description: 'Fresh leads from phone or web inquiries',
    icon: Phone,
    dataSource: 'phone_inquiry' as const,
    initialStage: 'new_lead' as const,
    createEngagement: true,
  },
  {
    value: 'general',
    label: 'General Import',
    description: 'Import without creating engagements',
    icon: Globe,
    dataSource: 'manual_entry' as const,
    initialStage: 'new_lead' as const,
    createEngagement: false,
  },
]

export function FarmersImportContext({ onContextComplete }: FarmersImportContextProps) {
  const { products, loading: productsLoading, error: productsError } = useProducts()
  const [purpose, setPurpose] = useState<string>('')
  const [productId, setProductId] = useState<string>('')
  const [duplicateStrategy, setDuplicateStrategy] = useState<'skip' | 'update' | 'create_new'>('update')

  const selectedPurpose = purposeOptions.find(p => p.value === purpose)

  const handleContinue = () => {
    if (!purpose) {
      alert('Please select import purpose')
      return
    }

    if (selectedPurpose?.createEngagement && !productId) {
      alert('Please select a product for engagement creation')
      return
    }

    const context: ImportContext = {
      purpose: purpose as any,
      productId: selectedPurpose?.createEngagement ? productId : undefined,
      dataSource: selectedPurpose!.dataSource,
      initialStage: selectedPurpose!.initialStage,
      duplicateStrategy,
      createEngagement: selectedPurpose!.createEngagement,
    }

    onContextComplete(context)
  }

  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> Select the context of your import to ensure proper data source tracking and engagement creation.
        </AlertDescription>
      </Alert>

      {/* Import Purpose */}
      <Card>
        <CardHeader>
          <CardTitle>What are you importing?</CardTitle>
          <CardDescription>
            Select the source and purpose of this farmer list
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {purposeOptions.map((option) => (
              <Card
                key={option.value}
                className={`cursor-pointer transition-all ${
                  purpose === option.value
                    ? 'border-primary ring-2 ring-primary'
                    : 'hover:border-primary/50'
                }`}
                onClick={() => setPurpose(option.value)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <option.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{option.label}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {option.description}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <span className="text-xs px-2 py-1 rounded bg-muted">
                          Stage: {option.initialStage.replace('_', ' ')}
                        </span>
                        {option.createEngagement && (
                          <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">
                            Creates Engagement
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Product Selection (if engagement creation enabled) */}
      {selectedPurpose?.createEngagement && (
        <Card>
          <CardHeader>
            <CardTitle>Select Product</CardTitle>
            <CardDescription>
              Which product are these farmers interested in?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="product">Product *</Label>
              <Select
                id="product"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                disabled={productsLoading}
              >
                <option value="">
                  {productsLoading ? 'Loading products...' : products.length === 0 ? 'No products available' : '-- Select Product --'}
                </option>
                {products.map((product) => (
                  <option key={product.id} value={product.id} style={{ color: 'black', backgroundColor: 'white' }}>
                    {product.product_name || 'Unnamed Product'} {product.current_stage ? `(${product.current_stage})` : ''}
                  </option>
                ))}
              </Select>
              {productsError ? (
                <p className="text-xs text-red-600">
                  ⚠️ Error loading products: {productsError}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  A product engagement will be created for each farmer with this product
                  {products.length === 0 && !productsLoading && (
                    <span className="text-red-600 block mt-1">
                      ⚠️ No products found. Please add products first in the Products module.
                    </span>
                  )}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Duplicate Handling Strategy */}
      <Card>
        <CardHeader>
          <CardTitle>Duplicate Handling</CardTitle>
          <CardDescription>
            What should happen if a farmer with the same phone number already exists?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={duplicateStrategy} onValueChange={(v: any) => setDuplicateStrategy(v)}>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                <RadioGroupItem value="update" id="update" className="mt-1" />
                <Label htmlFor="update" className="cursor-pointer flex-1">
                  <span className="font-medium">Update Existing</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    Update farmer details and add/update engagement (Recommended)
                  </p>
                </Label>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                <RadioGroupItem value="skip" id="skip" className="mt-1" />
                <Label htmlFor="skip" className="cursor-pointer flex-1">
                  <span className="font-medium">Skip Duplicates</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    Skip farmers that already exist, only import new ones
                  </p>
                </Label>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                <RadioGroupItem value="create_new" id="create_new" className="mt-1" />
                <Label htmlFor="create_new" className="cursor-pointer flex-1">
                  <span className="font-medium">Always Create New</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create new farmer records even if phone exists (Not Recommended)
                  </p>
                </Label>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Summary */}
      {selectedPurpose && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">Import Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Purpose:</span>
              <span className="font-medium">{selectedPurpose.label}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Data Source:</span>
              <span className="font-medium">{selectedPurpose.dataSource.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Initial Stage:</span>
              <span className="font-medium">{selectedPurpose.initialStage.replace('_', ' ')}</span>
            </div>
            {selectedPurpose.createEngagement && productId && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Product:</span>
                <span className="font-medium">
                  {products.find(p => p.id === productId)?.name || productId}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duplicate Strategy:</span>
              <span className="font-medium">
                {duplicateStrategy === 'update' ? 'Update Existing' : 
                 duplicateStrategy === 'skip' ? 'Skip Duplicates' : 'Always Create New'}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Continue Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleContinue}
          disabled={!purpose || (selectedPurpose?.createEngagement && !productId)}
        >
          Continue to Upload
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
