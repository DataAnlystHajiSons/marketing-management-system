"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { CheckCircle2, AlertCircle, XCircle, ArrowLeft, ArrowRight, AlertTriangle } from "lucide-react"

interface DealersImportPreviewProps {
  data: any[]
  context: any
  onStartImport: (validatedData: any[]) => void
  onBack: () => void
}

interface ValidationResult {
  row: number
  errors: string[]
  warnings: string[]
}

export function DealersImportPreview({
  data,
  context,
  onStartImport,
  onBack
}: DealersImportPreviewProps) {
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([])
  const [showOnlyIssues, setShowOnlyIssues] = useState(false)
  const [confirmImport, setConfirmImport] = useState(false)

  useEffect(() => {
    validateData()
  }, [data])

  const validateData = () => {
    const results: ValidationResult[] = []

    data.forEach((row, index) => {
      const errors: string[] = []
      const warnings: string[] = []

      // Required field validation
      if (!row.dealer_code) errors.push('Missing dealer code')
      if (!row.business_name) errors.push('Missing business name')
      if (!row.owner_name) errors.push('Missing owner name')
      if (!row.phone) errors.push('Missing phone number')
      if (!row.relationship_status) errors.push('Missing relationship status')
      if (row.relationship_score === undefined || row.relationship_score === null) {
        errors.push('Missing relationship score')
      }

      // Format validation
      if (row.phone && !/^[0-9-+\s()]+$/.test(row.phone)) {
        warnings.push('Phone number format may be invalid')
      }

      if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
        warnings.push('Email format may be invalid')
      }

      // Range validation
      if (row.relationship_score !== undefined && (row.relationship_score < 0 || row.relationship_score > 100)) {
        errors.push('Relationship score must be between 0 and 100')
      }

      // Optional field warnings
      if (!row.zone_id && !row.area_id) {
        warnings.push('No location information provided')
      }

      if (!row.assigned_field_staff_id) {
        warnings.push('No field staff assigned')
      }

      if (errors.length > 0 || warnings.length > 0) {
        results.push({
          row: index + 2, // +2 for header row + 0-index
          errors,
          warnings
        })
      }
    })

    setValidationResults(results)
  }

  const getValidRows = () => {
    const errorRows = new Set(validationResults.filter(r => r.errors.length > 0).map(r => r.row))
    return data.filter((_, index) => !errorRows.has(index + 2))
  }

  const handleStartImport = () => {
    const validRows = getValidRows()
    onStartImport(validRows)
  }

  const totalErrors = validationResults.filter(r => r.errors.length > 0).length
  const totalWarnings = validationResults.filter(r => r.warnings.length > 0 && r.errors.length === 0).length
  const totalValid = data.length - totalErrors

  const displayRows = showOnlyIssues
    ? data.filter((_, i) => validationResults.some(r => r.row === i + 2))
    : data

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Import Preview</CardTitle>
          <CardDescription>
            Review your data before importing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-3xl font-bold text-green-600">{totalValid}</div>
              <div className="text-sm text-muted-foreground">Valid Rows</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-3xl font-bold text-amber-600">{totalWarnings}</div>
              <div className="text-sm text-muted-foreground">Warnings</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-3xl font-bold text-red-600">{totalErrors}</div>
              <div className="text-sm text-muted-foreground">Errors</div>
            </div>
          </div>

          {totalErrors > 0 && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>{totalErrors}</strong> rows have errors and will be skipped during import.
                Only <strong>{totalValid}</strong> valid rows will be imported.
              </AlertDescription>
            </Alert>
          )}

          {totalWarnings > 0 && totalErrors === 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>{totalWarnings}</strong> rows have warnings but can still be imported.
                Review them before proceeding.
              </AlertDescription>
            </Alert>
          )}

          {totalErrors === 0 && totalWarnings === 0 && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                All <strong>{data.length}</strong> rows are valid and ready for import!
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Validation Results */}
      {validationResults.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Validation Issues</CardTitle>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show_issues"
                  checked={showOnlyIssues}
                  onCheckedChange={(checked) => setShowOnlyIssues(checked as boolean)}
                />
                <Label htmlFor="show_issues" className="cursor-pointer">
                  Show only rows with issues
                </Label>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {validationResults.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-medium">Row {result.row}</div>
                    <div className="flex gap-2">
                      {result.errors.length > 0 && (
                        <Badge variant="destructive">
                          {result.errors.length} error{result.errors.length > 1 ? 's' : ''}
                        </Badge>
                      )}
                      {result.warnings.length > 0 && (
                        <Badge variant="secondary">
                          {result.warnings.length} warning{result.warnings.length > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {result.errors.length > 0 && (
                    <div className="space-y-1 mb-2">
                      {result.errors.map((error, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-red-600">
                          <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>{error}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {result.warnings.length > 0 && (
                    <div className="space-y-1">
                      {result.warnings.map((warning, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-amber-600">
                          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>{warning}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Data Preview</CardTitle>
          <CardDescription>
            Preview of {showOnlyIssues ? 'rows with issues' : 'all rows'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-auto max-h-96">
            <table className="w-full text-sm">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Row</th>
                  <th className="px-3 py-2 text-left font-medium">Status</th>
                  <th className="px-3 py-2 text-left font-medium">Code</th>
                  <th className="px-3 py-2 text-left font-medium">Business Name</th>
                  <th className="px-3 py-2 text-left font-medium">Owner</th>
                  <th className="px-3 py-2 text-left font-medium">Phone</th>
                  <th className="px-3 py-2 text-left font-medium">Location</th>
                  <th className="px-3 py-2 text-left font-medium">Staff</th>
                </tr>
              </thead>
              <tbody>
                {displayRows.slice(0, 50).map((row, index) => {
                  const rowNumber = data.indexOf(row) + 2
                  const validation = validationResults.find(r => r.row === rowNumber)
                  const hasErrors = validation?.errors.length ?? 0 > 0

                  return (
                    <tr key={index} className={`border-t ${hasErrors ? 'bg-red-50' : ''}`}>
                      <td className="px-3 py-2">{rowNumber}</td>
                      <td className="px-3 py-2">
                        {hasErrors ? (
                          <XCircle className="h-4 w-4 text-red-600" />
                        ) : validation?.warnings.length ? (
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        )}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">{row.dealer_code}</td>
                      <td className="px-3 py-2">{row.business_name}</td>
                      <td className="px-3 py-2">{row.owner_name}</td>
                      <td className="px-3 py-2">{row.phone}</td>
                      <td className="px-3 py-2 text-xs">
                        {row.zone_id || row.area_id || row.village_id ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <span className="text-muted-foreground">No location</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs">
                        {row.assigned_field_staff_id ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <span className="text-muted-foreground">Unassigned</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {displayRows.length > 50 && (
            <p className="text-sm text-muted-foreground mt-2">
              Showing first 50 of {displayRows.length} rows
            </p>
          )}
        </CardContent>
      </Card>

      {/* Import Confirmation */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start space-x-2">
            <Checkbox
              id="confirm_import"
              checked={confirmImport}
              onCheckedChange={(checked) => setConfirmImport(checked as boolean)}
            />
            <div className="flex-1">
              <Label htmlFor="confirm_import" className="cursor-pointer font-medium">
                I confirm that I've reviewed the data and want to proceed with the import
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                {totalValid} dealers will be imported. 
                {totalErrors > 0 && ` ${totalErrors} rows with errors will be skipped.`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={handleStartImport}
          disabled={!confirmImport || totalValid === 0}
          size="lg"
        >
          Start Import ({totalValid} dealers)
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
