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
import { DealersImportContext } from "@/components/import/dealers-import-context"
import { DealersImportUpload } from "@/components/import/dealers-import-upload"
import { DealersImportMapping } from "@/components/import/dealers-import-mapping"
import { DealersImportBulkAssignment } from "@/components/import/dealers-import-bulk-assignment"
import { DealersImportPreview } from "@/components/import/dealers-import-preview"

type ImportStep = 'context' | 'upload' | 'mapping' | 'assignment' | 'preview' | 'importing' | 'complete'

interface ImportContext {
  purpose: 'new_dealers' | 'update_dealers' | 'territory_assignment' | 'general'
  dataSource: 'manual_entry' | 'field_survey' | 'referral' | 'market_research' | 'existing_database'
  duplicateStrategy: 'skip' | 'update' | 'create_new'
}

interface ImportStats {
  total: number
  successful: number
  failed: number
  skipped: number
  updated: number
  errors: Array<{ row: number; error: string }>
}

export default function DealersImportPage() {
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
      skipped: 0,
      updated: 0,
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
      try {
        const batch = batches[i]
        const result = await importDealersBatch(batch, i * batchSize)
        
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
      } catch (error) {
        console.error('Batch import error:', error)
      }
    }

    setCurrentStep('complete')
  }

  const importDealersBatch = async (batch: any[], startIndex: number) => {
    const { dealersAPI } = await import('@/lib/supabase/dealers')
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

    for (let i = 0; i < batch.length; i++) {
      const rowData = batch[i]
      const rowNumber = startIndex + i + 2 // +2 for Excel row (header row 1 + 0-indexed)

      console.log("Row Data:", rowData);

      try {
        // Prepare clean data for database (remove name fields, keep only IDs)
        const cleanData: any = {
          dealer_code: rowData.dealer_code,
          business_name: rowData.business_name,
          owner_name: rowData.owner_name,
          phone: rowData.phone,
        }

        // Add optional fields if they exist
        if (rowData.alternate_phone) cleanData.alternate_phone = rowData.alternate_phone
        if (rowData.email) cleanData.email = rowData.email
        if (rowData.zone_id) cleanData.zone_id = rowData.zone_id
        if (rowData.area_id) cleanData.area_id = rowData.area_id
        if (rowData.village_id) cleanData.village_id = rowData.village_id
        if (rowData.address) cleanData.address = rowData.address
        if (rowData.field_staff_id) cleanData.field_staff_id = rowData.field_staff_id
        if (rowData.assigned_field_staff_id) cleanData.field_staff_id = rowData.assigned_field_staff_id
        if (rowData.credit_limit) cleanData.credit_limit = parseFloat(rowData.credit_limit)
        if (rowData.current_balance !== undefined) cleanData.current_balance = parseFloat(rowData.current_balance)
        if (rowData.relationship_status) cleanData.relationship_status = rowData.relationship_status
        if (rowData.relationship_score !== undefined) cleanData.relationship_score = parseInt(rowData.relationship_score)
        if (rowData.performance_rating) cleanData.performance_rating = rowData.performance_rating
        if (rowData.registration_date) cleanData.registration_date = rowData.registration_date
        if (rowData.last_contact_date) cleanData.last_contact_date = rowData.last_contact_date
        if (rowData.last_order_date) cleanData.last_order_date = rowData.last_order_date
        if (rowData.last_payment_date) cleanData.last_payment_date = rowData.last_payment_date
        if (rowData.last_stock_report_date) cleanData.last_stock_report_date = rowData.last_stock_report_date
        if (rowData.last_review_date) cleanData.last_review_date = rowData.last_review_date
        if (rowData.next_scheduled_contact) cleanData.next_scheduled_contact = rowData.next_scheduled_contact
        if (rowData.is_active !== undefined) {
          cleanData.is_active = rowData.is_active === true || rowData.is_active === 'true'
        } else {
          cleanData.is_active = true
        }

        // Check for duplicate by dealer_code or phone
        const { data: existingDealer } = await supabase
          .from('dealers')
          .select('id, dealer_code, business_name')
          .or(`dealer_code.eq.${cleanData.dealer_code},phone.eq.${cleanData.phone}`)
          .maybeSingle()

        if (existingDealer) {
          if (importContext.duplicateStrategy === 'skip') {
            skipped++
            continue
          } else if (importContext.duplicateStrategy === 'update') {
            console.log("Clean Data (Update):", cleanData);
            // Update existing dealer
            const { error: updateError } = await dealersAPI.update(existingDealer.id, cleanData)
            if (updateError) {
              failed++
              errors.push({ row: rowNumber, error: updateError.message })
            } else {
              updated++
            }
            continue
          }
          // If 'create_new', fall through to create
        }

        console.log("Clean Data (Create):", cleanData);
        // Create new dealer
        const { error: createError } = await dealersAPI.create(cleanData)
        if (createError) {
          failed++
          errors.push({ row: rowNumber, error: createError.message })
        } else {
          successful++
        }
      } catch (error: any) {
        failed++
        errors.push({ row: rowNumber, error: error.message || 'Unknown error' })
      }
    }

    return { successful, failed, skipped, updated, errors }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/crm/dealers">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Import Dealers</h1>
          <p className="text-muted-foreground">Bulk import dealers from CSV/Excel with smart name mapping</p>
        </div>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {[
              { id: 'context', label: 'Context', icon: FileSpreadsheet },
              { id: 'upload', label: 'Upload', icon: Upload },
              { id: 'mapping', label: 'Mapping', icon: AlertCircle },
              { id: 'assignment', label: 'Assignment', icon: CheckCircle2 },
              { id: 'preview', label: 'Preview', icon: CheckCircle2 },
              { id: 'importing', label: 'Importing', icon: Loader2 },
            ].map((step, index) => {
              const Icon = step.icon
              const isActive = currentStep === step.id
              const isCompleted = ['context', 'upload', 'mapping', 'assignment', 'preview'].indexOf(currentStep) > 
                                  ['context', 'upload', 'mapping', 'assignment', 'preview'].indexOf(step.id)
              
              return (
                <div key={step.id} className="flex items-center gap-2">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    isActive ? 'bg-primary text-primary-foreground' :
                    isCompleted ? 'bg-green-500 text-white' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span className={`text-sm ${isActive ? 'font-medium' : 'text-muted-foreground'}`}>
                    {step.label}
                  </span>
                  {index < 5 && <div className="w-8 h-px bg-border ml-2" />}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <div>
        {currentStep === 'context' && (
          <DealersImportContext onComplete={handleContextComplete} />
        )}

        {currentStep === 'upload' && importContext && (
          <DealersImportUpload
            onFileUploaded={handleFileUploaded}
            onBack={() => setCurrentStep('context')}
          />
        )}

        {currentStep === 'mapping' && (
          <DealersImportMapping
            data={parsedData}
            onMappingComplete={handleMappingComplete}
            onBack={() => setCurrentStep('upload')}
          />
        )}

        {currentStep === 'assignment' && (
          <DealersImportBulkAssignment
            data={mappedData}
            onAssignmentComplete={handleAssignmentComplete}
            onBack={() => setCurrentStep('mapping')}
          />
        )}

        {currentStep === 'preview' && importContext && (
          <DealersImportPreview
            data={assignedData}
            context={importContext}
            onStartImport={handleStartImport}
            onBack={() => setCurrentStep('assignment')}
          />
        )}

        {currentStep === 'importing' && (
          <Card>
            <CardHeader>
              <CardTitle>Importing Dealers...</CardTitle>
              <CardDescription>Please wait while we import your dealers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={importProgress} />
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{importStats.successful}</div>
                  <div className="text-sm text-muted-foreground">Successful</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-600">{importStats.skipped}</div>
                  <div className="text-sm text-muted-foreground">Skipped</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{importStats.updated}</div>
                  <div className="text-sm text-muted-foreground">Updated</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{importStats.failed}</div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 'complete' && (
          <Card>
            <CardHeader>
              <CardTitle>Import Complete!</CardTitle>
              <CardDescription>Your dealers have been imported</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{importStats.successful}</div>
                  <div className="text-sm text-muted-foreground">Created</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-600">{importStats.skipped}</div>
                  <div className="text-sm text-muted-foreground">Skipped</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{importStats.updated}</div>
                  <div className="text-sm text-muted-foreground">Updated</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">{importStats.failed}</div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </div>
              </div>

              {importStats.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium mb-2">Errors occurred during import:</div>
                    <div className="max-h-40 overflow-y-auto text-sm space-y-1">
                      {importStats.errors.slice(0, 10).map((error, i) => (
                        <div key={i}>Row {error.row}: {error.error}</div>
                      ))}
                      {importStats.errors.length > 10 && (
                        <div>And {importStats.errors.length - 10} more errors...</div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button onClick={() => router.push('/crm/dealers')}>
                  View Dealers
                </Button>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Import More
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
