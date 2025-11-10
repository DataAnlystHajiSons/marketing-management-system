"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { 
  ArrowLeft, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Loader2
} from "lucide-react"
import { FarmersImportContext } from "@/components/import/farmers-import-context"
import { FarmersImportUpload } from "@/components/import/farmers-import-upload"
import { FarmersImportMapping } from "@/components/import/farmers-import-mapping"
import { FarmersImportBulkAssignment } from "@/components/import/farmers-import-bulk-assignment"
import { FarmersImportPreview } from "@/components/import/farmers-import-preview"

type ImportStep = 'context' | 'upload' | 'mapping' | 'assignment' | 'preview' | 'importing' | 'complete'

interface ImportContext {
  purpose: 'new_leads' | 'event_invitees' | 'event_attendees' | 'field_visit' | 'dealer_referral' | 'general'
  productId?: string
  dataSource: 'manual_entry' | 'event_registration' | 'field_visit' | 'dealer_referral' | 'web_inquiry' | 'phone_inquiry'
  initialStage: 'new_lead' | 'contacted' | 'interested' | 'qualified'
  duplicateStrategy: 'skip' | 'update' | 'create_new'
  createEngagement: boolean
}

interface ImportStats {
  total: number
  successful: number
  failed: number
  skipped: number
  updated: number
  errors: Array<{ row: number; error: string }>
}

export default function FarmersImportPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<ImportStep>('context')
  const [importContext, setImportContext] = useState<ImportContext | null>(null)
  const [parsedData, setParsedData] = useState<any[]>([])
  const [mappedData, setMappedData] = useState<any[]>([])
  const [assignedData, setAssignedData] = useState<any[]>([])
  const [importProgress, setImportProgress] = useState(0)
  const [importStats, setImportStats] = useState<ImportStats>({
    total: 0,
    successful: 0,
    failed: 0,
    skipped: 0,
    updated: 0,
    errors: []
  })

  const handleContextComplete = (context: ImportContext) => {
    setImportContext(context)
    setCurrentStep('upload')
  }

  const handleFileUploaded = (data: any[]) => {
    setParsedData(data)
    setCurrentStep('mapping')
  }

  const handleMappingComplete = (data: any[]) => {
    setMappedData(data)
    setCurrentStep('assignment')
  }

  const handleAssignmentComplete = (data: any[]) => {
    setAssignedData(data)
    setCurrentStep('preview')
  }

  const handleStartImport = async (validatedData: any[]) => {
    setCurrentStep('importing')
    setImportStats({
      total: validatedData.length,
      successful: 0,
      failed: 0,
      errors: []
    })

    // Import in batches
    const batchSize = 50
    const batches = []
    for (let i = 0; i < validatedData.length; i += batchSize) {
      batches.push(validatedData.slice(i, i + batchSize))
    }

    let successful = 0
    let failed = 0
    let skipped = 0
    let updated = 0
    const errors: Array<{ row: number; error: string }> = []

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]
      const result = await importFarmersBatch(batch, i * batchSize)
      
      successful += result.successful
      failed += result.failed
      skipped += result.skipped
      updated += result.updated
      errors.push(...result.errors)

      setImportProgress(((i + 1) / batches.length) * 100)
      setImportStats({
        total: validatedData.length,
        successful,
        failed,
        skipped,
        updated,
        errors
      })
    }

    setCurrentStep('complete')
  }

  const importFarmersBatch = async (batch: any[], startIndex: number) => {
    const { farmersAPI } = await import('@/lib/supabase/farmers')
    const { farmerEngagementsAPI } = await import('@/lib/supabase/farmer-engagements')
    const { supabase } = await import('@/lib/supabase/client')
    
    let successful = 0
    let failed = 0
    let skipped = 0
    let updated = 0
    const errors: Array<{ row: number; error: string }> = []

    if (!importContext) {
      errors.push({ row: 0, error: 'Import context not set' })
      return { successful, failed, skipped, updated, errors }
    }

    // Map import stage names to database lead_stage values
    const stageMapping: Record<string, string> = {
      'new_lead': 'new',
      'contacted': 'contacted',
      'interested': 'interested',
      'qualified': 'qualified'
    }
    const mappedStage = stageMapping[importContext.initialStage] || 'new'

    // Map import data sources to database data_source_type enum values
    // Based on database enum: data_bank, fm_invitees, fm_attendees, fd_invitees, fd_attendees, repzo, manual_entry, api_integration, other
    const dataSourceMapping: Record<string, string> = {
      'event_registration': importContext.purpose === 'event_attendees' ? 'fm_attendees' : 'fm_invitees',
      'field_visit': 'manual_entry',
      'dealer_referral': 'manual_entry',
      'web_inquiry': 'manual_entry',
      'phone_inquiry': 'manual_entry',
      'manual_entry': 'manual_entry'
    }
    const mappedDataSource = dataSourceMapping[importContext.dataSource] || 'manual_entry'

    for (let i = 0; i < batch.length; i++) {
      const farmer = batch[i]
      const rowNumber = startIndex + i + 2 // +2 for header row and 0-index
      
      try {
        // Check for duplicate by phone
        const { data: existingFarmers } = await supabase
          .from('farmers')
          .select('id')
          .eq('phone', farmer.phone)
          .limit(1)

        const existingFarmer = existingFarmers?.[0]

        let farmerId: string | undefined

        if (existingFarmer) {
          // Duplicate found
          if (importContext.duplicateStrategy === 'skip') {
            skipped++
            continue
          } else if (importContext.duplicateStrategy === 'update') {
            // Update existing farmer
            const { error: updateError } = await farmersAPI.update(existingFarmer.id, {
              full_name: farmer.full_name,
              alternate_phone: farmer.alternate_phone || undefined,
              email: farmer.email || undefined,
              zone_id: farmer.zone_id || undefined,
              area_id: farmer.area_id || undefined,
              village_id: farmer.village_id || undefined,
              address: farmer.address || undefined,
              land_size_acres: farmer.land_size_acres ? parseFloat(farmer.land_size_acres) : undefined,
              primary_crops: farmer.primary_crops ? farmer.primary_crops.split(',').map((c: string) => c.trim()) : undefined,
              assigned_tmo_id: farmer.assigned_tmo_id || undefined,
              assigned_field_staff_id: farmer.assigned_field_staff_id || undefined,
              assigned_dealer_id: farmer.assigned_dealer_id || undefined,
            })

            if (updateError) {
              failed++
              errors.push({ row: rowNumber, error: updateError.message || 'Update failed' })
              continue
            }

            farmerId = existingFarmer.id
            updated++
          } else {
            // create_new - always create regardless of duplicate
            const { data: newFarmer, error: createError } = await farmersAPI.create({
              full_name: farmer.full_name,
              phone: farmer.phone,
              alternate_phone: farmer.alternate_phone || undefined,
              email: farmer.email || undefined,
              zone_id: farmer.zone_id || undefined,
              area_id: farmer.area_id || undefined,
              village_id: farmer.village_id || undefined,
              address: farmer.address || undefined,
              land_size_acres: farmer.land_size_acres ? parseFloat(farmer.land_size_acres) : undefined,
              primary_crops: farmer.primary_crops ? farmer.primary_crops.split(',').map((c: string) => c.trim()) : undefined,
              assigned_tmo_id: farmer.assigned_tmo_id || undefined,
              assigned_field_staff_id: farmer.assigned_field_staff_id || undefined,
              assigned_dealer_id: farmer.assigned_dealer_id || undefined,
            })

            if (createError) {
              failed++
              errors.push({ row: rowNumber, error: createError.message || 'Create failed' })
              continue
            }

            farmerId = newFarmer?.id
            successful++
          }
        } else {
          // No duplicate, create new
          const { data: newFarmer, error: createError } = await farmersAPI.create({
            full_name: farmer.full_name,
            phone: farmer.phone,
            alternate_phone: farmer.alternate_phone || undefined,
            email: farmer.email || undefined,
            zone_id: farmer.zone_id || undefined,
            area_id: farmer.area_id || undefined,
            village_id: farmer.village_id || undefined,
            address: farmer.address || undefined,
            land_size_acres: farmer.land_size_acres ? parseFloat(farmer.land_size_acres) : undefined,
            primary_crops: farmer.primary_crops ? farmer.primary_crops.split(',').map((c: string) => c.trim()) : undefined,
            assigned_tmo_id: farmer.assigned_tmo_id || undefined,
            assigned_field_staff_id: farmer.assigned_field_staff_id || undefined,
            assigned_dealer_id: farmer.assigned_dealer_id || undefined,
          })

          if (createError) {
            failed++
            errors.push({ row: rowNumber, error: createError.message || 'Create failed' })
            continue
          }

          farmerId = newFarmer?.id
          successful++
        }

        // Create engagement if context requires it
        if (importContext.createEngagement && importContext.productId && farmerId) {
          // Check if engagement already exists
          const { data: existingEngagement } = await supabase
            .from('farmer_product_engagements')
            .select('id')
            .eq('farmer_id', farmerId)
            .eq('product_id', importContext.productId)
            .limit(1)

          if (!existingEngagement || existingEngagement.length === 0) {
            // Create new engagement
            const { data: newEngagement, error: engagementError } = await farmerEngagementsAPI.create({
              farmer_id: farmerId,
              product_id: importContext.productId,
              season: new Date().getFullYear().toString(), // Current year as season
              data_source: mappedDataSource as any, // Mapped data source value
              lead_stage: mappedStage as any, // Mapped stage value
              assigned_tmo_id: farmer.assigned_tmo_id || undefined,
            })

            if (engagementError) {
              // Log detailed error for debugging
              console.error(`Failed to create engagement for farmer ${farmerId}:`, engagementError)
              console.error('Engagement data:', {
                farmer_id: farmerId,
                product_id: importContext.productId,
                season: new Date().getFullYear().toString(),
                data_source: mappedDataSource,
                lead_stage: mappedStage,
              })
            } else {
              console.log(`✅ Created engagement for farmer ${farmerId}:`, newEngagement?.id)
            }
          } else {
            // Update existing engagement when importing attendees or updating stage
            const updateData: any = {}
            
            // Always update data_source to reflect the latest import context
            updateData.data_source = mappedDataSource
            
            // Update stage if from event attendees (they attended, so contacted)
            if (importContext.purpose === 'event_attendees') {
              updateData.lead_stage = 'contacted'
            }
            
            const { error: updateError } = await supabase
              .from('farmer_product_engagements')
              .update(updateData)
              .eq('id', existingEngagement[0].id)
            
            if (updateError) {
              console.error(`Failed to update engagement for farmer ${farmerId}:`, updateError)
            } else {
              console.log(`✅ Updated engagement for farmer ${farmerId}: data_source=${mappedDataSource}`)
            }
          }
        }

      } catch (err: any) {
        failed++
        errors.push({ row: rowNumber, error: err.message || 'Unknown error' })
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 50))
    }

    return { successful, failed, skipped, updated, errors }
  }

  const downloadTemplate = () => {
    const template = `full_name,phone,alternate_phone,email,zone_name,area_name,village_name,zone_id,area_id,village_id,address,land_size_acres,primary_crops,assigned_tmo_name,assigned_field_staff_name,assigned_dealer_name,assigned_tmo_id,assigned_field_staff_id,assigned_dealer_id
John Doe,03001234567,03007654321,john@example.com,Punjab,Multan,Chak 123,,,,,House #123 Street 5,25.5,"Wheat,Cotton",Muhammad Hassan,Ali Raza,Dealer One,,,
Jane Smith,03009876543,,jane@example.com,,,,,zone-uuid,area-uuid,village-uuid,Near Main Market,15.0,Rice,,,,tmo-uuid,staff-uuid,dealer-uuid
Ahmed Ali,03001112233,,,,,,,,,,Village Center,10.0,"Cotton,Rice",,,,,field-staff-uuid,`

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'farmers_import_template.csv'
    link.click()
  }

  const handleReset = () => {
    setCurrentStep('context')
    setImportContext(null)
    setParsedData([])
    setMappedData([])
    setAssignedData([])
    setImportProgress(0)
    setImportStats({
      total: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      updated: 0,
      errors: []
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/crm/import">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Import Hub
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Farmers Bulk Import</h1>
            <p className="text-muted-foreground mt-1">
              Import multiple farmer records from CSV file
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={downloadTemplate}>
          <Download className="h-4 w-4 mr-2" />
          Download Template
        </Button>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between text-xs">
            <div className={`flex items-center gap-1 ${currentStep === 'context' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`rounded-full h-7 w-7 flex items-center justify-center border-2 text-xs ${currentStep === 'context' ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'}`}>
                1
              </div>
              <span className="font-medium">Context</span>
            </div>
            <div className="flex-1 h-px bg-border mx-1" />
            <div className={`flex items-center gap-1 ${currentStep === 'upload' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`rounded-full h-7 w-7 flex items-center justify-center border-2 text-xs ${currentStep === 'upload' ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'}`}>
                2
              </div>
              <span className="font-medium">Upload</span>
            </div>
            <div className="flex-1 h-px bg-border mx-1" />
            <div className={`flex items-center gap-1 ${currentStep === 'mapping' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`rounded-full h-7 w-7 flex items-center justify-center border-2 text-xs ${currentStep === 'mapping' ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'}`}>
                3
              </div>
              <span className="font-medium">Map</span>
            </div>
            <div className="flex-1 h-px bg-border mx-1" />
            <div className={`flex items-center gap-1 ${currentStep === 'assignment' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`rounded-full h-7 w-7 flex items-center justify-center border-2 text-xs ${currentStep === 'assignment' ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'}`}>
                4
              </div>
              <span className="font-medium">Assign</span>
            </div>
            <div className="flex-1 h-px bg-border mx-1" />
            <div className={`flex items-center gap-1 ${currentStep === 'preview' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`rounded-full h-7 w-7 flex items-center justify-center border-2 text-xs ${currentStep === 'preview' ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'}`}>
                5
              </div>
              <span className="font-medium">Preview</span>
            </div>
            <div className="flex-1 h-px bg-border mx-1" />
            <div className={`flex items-center gap-1 ${currentStep === 'importing' || currentStep === 'complete' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`rounded-full h-7 w-7 flex items-center justify-center border-2 text-xs ${currentStep === 'importing' || currentStep === 'complete' ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'}`}>
                6
              </div>
              <span className="font-medium">Import</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      {currentStep === 'context' && (
        <FarmersImportContext onContextComplete={handleContextComplete} />
      )}

      {currentStep === 'upload' && (
        <FarmersImportUpload onFileUploaded={handleFileUploaded} />
      )}

      {currentStep === 'mapping' && (
        <FarmersImportMapping 
          data={parsedData}
          onMappingComplete={handleMappingComplete}
          onBack={() => setCurrentStep('upload')}
        />
      )}

      {currentStep === 'assignment' && (
        <FarmersImportBulkAssignment 
          data={mappedData}
          onAssignmentComplete={handleAssignmentComplete}
          onBack={() => setCurrentStep('mapping')}
        />
      )}

      {currentStep === 'preview' && (
        <FarmersImportPreview 
          data={assignedData}
          onStartImport={handleStartImport}
          onCancel={handleReset}
        />
      )}

      {currentStep === 'importing' && (
        <Card>
          <CardHeader>
            <CardTitle>Importing Farmers...</CardTitle>
            <CardDescription>
              Please wait while we import your data. Do not close this page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span className="font-medium">{Math.round(importProgress)}%</span>
              </div>
              <Progress value={importProgress} />
            </div>

            <div className="grid gap-4 md:grid-cols-5">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-blue-50">
                <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                <div>
                  <div className="text-2xl font-bold text-blue-600">{importStats.total}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-green-600">{importStats.successful}</div>
                  <div className="text-xs text-muted-foreground">New</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-purple-50">
                <CheckCircle2 className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold text-purple-600">{importStats.updated}</div>
                  <div className="text-xs text-muted-foreground">Updated</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-yellow-50">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <div>
                  <div className="text-2xl font-bold text-yellow-600">{importStats.skipped}</div>
                  <div className="text-xs text-muted-foreground">Skipped</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50">
                <XCircle className="h-5 w-5 text-red-600" />
                <div>
                  <div className="text-2xl font-bold text-red-600">{importStats.failed}</div>
                  <div className="text-xs text-muted-foreground">Failed</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 'complete' && (
        <div className="space-y-4">
          <Alert className={importStats.failed === 0 ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}>
            {importStats.failed === 0 ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            )}
            <AlertDescription>
              {importStats.failed === 0 ? (
                <span className="font-medium text-green-600">
                  Import completed successfully! All {importStats.successful} records were imported.
                </span>
              ) : (
                <span className="font-medium text-yellow-600">
                  Import completed with {importStats.failed} error(s). {importStats.successful} records were imported successfully.
                </span>
              )}
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Import Summary</CardTitle>
              <CardDescription>Review the import results below</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-5">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-blue-50">
                  <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{importStats.total}</div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="text-2xl font-bold text-green-600">{importStats.successful}</div>
                    <div className="text-xs text-muted-foreground">New</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-purple-50">
                  <CheckCircle2 className="h-5 w-5 text-purple-600" />
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{importStats.updated}</div>
                    <div className="text-xs text-muted-foreground">Updated</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-yellow-50">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">{importStats.skipped}</div>
                    <div className="text-xs text-muted-foreground">Skipped</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <div>
                    <div className="text-2xl font-bold text-red-600">{importStats.failed}</div>
                    <div className="text-xs text-muted-foreground">Failed</div>
                  </div>
                </div>
              </div>

              {importStats.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Errors ({importStats.errors.length})</h4>
                  <div className="border rounded-lg max-h-64 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-2">Row</th>
                          <th className="text-left p-2">Error Message</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importStats.errors.map((error, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="p-2 font-mono">{error.row}</td>
                            <td className="p-2 text-red-600">{error.error}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleReset}>
                  Import More Farmers
                </Button>
                <Link href="/crm/farmers">
                  <Button variant="outline">
                    View Farmers List
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
