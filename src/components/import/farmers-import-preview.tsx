"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, XCircle, Eye, Upload } from "lucide-react"

interface FarmersImportPreviewProps {
  data: any[]
  onStartImport: (validatedData: any[]) => void
  onCancel: () => void
}

interface ValidationResult {
  valid: boolean
  errors: Array<{ row: number; field: string; message: string }>
  warnings: Array<{ row: number; field: string; message: string }>
}

export function FarmersImportPreview({ data, onStartImport, onCancel }: FarmersImportPreviewProps) {
  const [validationResult, setValidationResult] = useState<ValidationResult>({
    valid: true,
    errors: [],
    warnings: []
  })
  const [validating, setValidating] = useState(true)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    validateData()
  }, [data])

  const validateData = async () => {
    setValidating(true)
    
    const errors: Array<{ row: number; field: string; message: string }> = []
    const warnings: Array<{ row: number; field: string; message: string }> = []

    data.forEach((row, index) => {
      const rowNumber = index + 2 // +2 for header and 0-index

      // Required field validation
      if (!row.full_name || row.full_name.trim() === '') {
        errors.push({ row: rowNumber, field: 'full_name', message: 'Full name is required' })
      }

      if (!row.phone || row.phone.trim() === '') {
        errors.push({ row: rowNumber, field: 'phone', message: 'Phone is required' })
      } else {
        // Phone format validation (basic)
        const phoneClean = row.phone.replace(/\D/g, '')
        if (phoneClean.length < 10 || phoneClean.length > 13) {
          errors.push({ row: rowNumber, field: 'phone', message: 'Invalid phone format' })
        }
      }

      // Email validation
      if (row.email && row.email.trim() !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(row.email)) {
          warnings.push({ row: rowNumber, field: 'email', message: 'Invalid email format' })
        }
      }

      // Land size validation
      if (row.land_size_acres && row.land_size_acres.trim() !== '') {
        const landSize = parseFloat(row.land_size_acres)
        if (isNaN(landSize) || landSize <= 0) {
          errors.push({ row: rowNumber, field: 'land_size_acres', message: 'Invalid land size' })
        }
      }

      // UUID validation for IDs (basic format check)
      const uuidFields = ['zone_id', 'area_id', 'village_id', 'assigned_tmo_id', 'assigned_field_staff_id', 'assigned_dealer_id']
      uuidFields.forEach(field => {
        if (row[field] && row[field].trim() !== '') {
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
          if (!uuidRegex.test(row[field])) {
            warnings.push({ row: rowNumber, field, message: 'Invalid UUID format' })
          }
        }
      })

      // Location hierarchy validation
      if (row.village_id && !row.area_id) {
        warnings.push({ row: rowNumber, field: 'area_id', message: 'Area ID required when village is specified' })
      }
      if (row.area_id && !row.zone_id) {
        warnings.push({ row: rowNumber, field: 'zone_id', message: 'Zone ID required when area is specified' })
      }
    })

    setValidationResult({
      valid: errors.length === 0,
      errors,
      warnings
    })
    setValidating(false)
  }

  const validRowsCount = data.length - validationResult.errors.filter((e, i, arr) => 
    arr.findIndex(x => x.row === e.row) === i
  ).length

  return (
    <div className="space-y-4">
      {/* Validation Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Validation Results</CardTitle>
          <CardDescription>
            Review validation results before importing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {validating ? (
            <div className="text-center py-8 text-muted-foreground">
              Validating data...
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-blue-50">
                  <Eye className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{data.length}</div>
                    <div className="text-xs text-muted-foreground">Total Rows</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="text-2xl font-bold text-green-600">{validRowsCount}</div>
                    <div className="text-xs text-muted-foreground">Valid Rows</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <div>
                    <div className="text-2xl font-bold text-red-600">{validationResult.errors.length}</div>
                    <div className="text-xs text-muted-foreground">Errors</div>
                  </div>
                </div>
              </div>

              {validationResult.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Found {validationResult.errors.length} error(s) in your data. Please fix these errors before importing.
                  </AlertDescription>
                </Alert>
              )}

              {validationResult.warnings.length > 0 && validationResult.errors.length === 0 && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-600">
                    Found {validationResult.warnings.length} warning(s). You can proceed with import, but please review warnings.
                  </AlertDescription>
                </Alert>
              )}

              {validationResult.valid && validationResult.warnings.length === 0 && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-600">
                    All data is valid! Ready to import {data.length} farmer(s).
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Errors List */}
      {validationResult.errors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Errors ({validationResult.errors.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="text-left p-2">Row</th>
                    <th className="text-left p-2">Field</th>
                    <th className="text-left p-2">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {validationResult.errors.map((error, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="p-2 font-mono">{error.row}</td>
                      <td className="p-2">
                        <Badge variant="secondary">{error.field}</Badge>
                      </td>
                      <td className="p-2 text-red-600">{error.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warnings List */}
      {validationResult.warnings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              Warnings ({validationResult.warnings.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="text-left p-2">Row</th>
                    <th className="text-left p-2">Field</th>
                    <th className="text-left p-2">Warning</th>
                  </tr>
                </thead>
                <tbody>
                  {validationResult.warnings.map((warning, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="p-2 font-mono">{warning.row}</td>
                      <td className="p-2">
                        <Badge variant="secondary">{warning.field}</Badge>
                      </td>
                      <td className="p-2 text-yellow-600">{warning.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data Preview</CardTitle>
          <CardDescription>First 5 rows of your data</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="mb-4"
          >
            <Eye className="h-4 w-4 mr-2" />
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>

          {showPreview && (
            <div className="border rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-2">Row</th>
                    <th className="text-left p-2">Full Name</th>
                    <th className="text-left p-2">Phone</th>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Land Size</th>
                  </tr>
                </thead>
                <tbody>
                  {data.slice(0, 5).map((row, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="p-2 font-mono">{idx + 2}</td>
                      <td className="p-2">{row.full_name || '-'}</td>
                      <td className="p-2">{row.phone || '-'}</td>
                      <td className="p-2">{row.email || '-'}</td>
                      <td className="p-2">{row.land_size_acres || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          onClick={() => onStartImport(data)}
          disabled={!validationResult.valid || validating}
        >
          <Upload className="h-4 w-4 mr-2" />
          Start Import ({validRowsCount} rows)
        </Button>
      </div>
    </div>
  )
}
