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
import { VillagesImportContext } from "@/components/import/villages-import-context"
import { VillagesImportUpload } from "@/components/import/villages-import-upload"
import { VillagesImportMapping } from "@/components/import/villages-import-mapping"
import { VillagesImportPreview } from "@/components/import/villages-import-preview"

type ImportStep = 'context' | 'upload' | 'mapping' | 'preview' | 'importing' | 'complete'

interface ImportContext {
  purpose: 'new_villages' | 'update_villages' | 'general'
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

export default function VillagesImportPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<ImportStep>('context')
  const [importContext, setImportContext] = useState<ImportContext | null>(null)
  const [parsedData, setParsedData] = useState<any[]>([])
  const [mappedData, setMappedData] = useState<any[]>([])
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
      const batch = batches[i]
      const result = await importVillagesBatch(batch, i * batchSize)
      
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

  const importVillagesBatch = async (batch: any[], startIndex: number) => {
    const { villagesAPI } = await import('@/lib/supabase/villages')
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

      try {
        // Prepare clean data for database (remove name fields, keep only IDs)
        const cleanData: any = {
          name: rowData.name,
          area_id: rowData.area_id,
        }

        // Add optional fields if they exist
        if (rowData.code) cleanData.code = rowData.code
        if (rowData.village_type) cleanData.village_type = rowData.village_type
        if (rowData.population) cleanData.population = parseInt(rowData.population)
        if (rowData.postal_code) cleanData.postal_code = rowData.postal_code
        if (rowData.latitude) cleanData.latitude = parseFloat(rowData.latitude)
        if (rowData.longitude) cleanData.longitude = parseFloat(rowData.longitude)
        if (rowData.notes) cleanData.notes = rowData.notes
        if (rowData.is_active !== undefined) {
          cleanData.is_active = rowData.is_active === true || rowData.is_active === 'true'
        } else {
          cleanData.is_active = true
        }

        // Check for duplicate by name and area_id
        const { data: existingVillage } = await supabase
          .from('villages')
          .select('id, name, area_id')
          .eq('name', cleanData.name)
          .eq('area_id', cleanData.area_id)
          .maybeSingle()

        if (existingVillage) {
          if (importContext.duplicateStrategy === 'skip') {
            skipped++
            continue
          } else if (importContext.duplicateStrategy === 'update') {
            // Update existing village
            const { error: updateError } = await villagesAPI.update(existingVillage.id, cleanData)
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

        // Create new village
        const { error: createError } = await villagesAPI.create(cleanData)
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
        <Link href="/crm/locations/villages">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Import Villages</h1>
          <p className="text-muted-foreground">Bulk import villages from CSV/Excel with zone and area name mapping</p>
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
              { id: 'preview', label: 'Preview', icon: CheckCircle2 },
              { id: 'importing', label: 'Importing', icon: Loader2 },
            ].map((step, index) => {
              const Icon = step.icon
              const isActive = currentStep === step.id
              const isCompleted = ['context', 'upload', 'mapping', 'preview'].indexOf(currentStep) > 
                                  ['context', 'upload', 'mapping', 'preview'].indexOf(step.id)
              
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
                  {index < 4 && <div className="w-8 h-px bg-border ml-2" />}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <div>
        {currentStep === 'context' && (
          <VillagesImportContext onComplete={handleContextComplete} />
        )}

        {currentStep === 'upload' && importContext && (
          <VillagesImportUpload
            onFileUploaded={handleFileUploaded}
            onBack={() => setCurrentStep('context')}
          />
        )}

        {currentStep === 'mapping' && (
          <VillagesImportMapping
            data={parsedData}
            onMappingComplete={handleMappingComplete}
            onBack={() => setCurrentStep('upload')}
          />
        )}

        {currentStep === 'preview' && importContext && (
          <VillagesImportPreview
            data={mappedData}
            context={importContext}
            onStartImport={handleStartImport}
            onBack={() => setCurrentStep('mapping')}
          />
        )}

        {currentStep === 'importing' && (
          <Card>
            <CardHeader>
              <CardTitle>Importing Villages...</CardTitle>
              <CardDescription>Please wait while we import your villages</CardDescription>
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
              <CardDescription>Your villages have been imported</CardDescription>
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
                <Button onClick={() => router.push('/crm/locations/villages')}>
                  View Villages
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
