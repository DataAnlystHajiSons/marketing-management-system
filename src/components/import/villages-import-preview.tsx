"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { CheckCircle2, AlertCircle, XCircle, ArrowLeft, ArrowRight, AlertTriangle } from "lucide-react"

interface VillagesImportPreviewProps {
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

export function VillagesImportPreview({
  data,
  context,
  onStartImport,
  onBack
}: VillagesImportPreviewProps) {
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
      if (!row.name) errors.push('Missing village name')
      if (!row.area_id) errors.push('Missing area assignment (area_name not mapped)')

      // Optional field warnings
      if (!row.zone_id) warnings.push('No zone assigned (will use area\'s zone)')
      if (!row.village_type) warnings.push('No village type specified')
      if (!row.population) warnings.push('No population data')
      if (!row.postal_code) warnings.push('No postal code')

      // Type validation
      if (row.village_type && !['rural', 'urban', 'semi-urban'].includes(row.village_type)) {
        errors.push('Invalid village_type (must be: rural, urban, or semi-urban)')
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
            Review your village data before importing
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
                  <th className="px-3 py-2 text-left font-medium">Village Name</th>
                  <th className="px-3 py-2 text-left font-medium">Area Mapped</th>
                  <th className="px-3 py-2 text-left font-medium">Zone Mapped</th>
                  <th className="px-3 py-2 text-left font-medium">Type</th>
                  <th className="px-3 py-2 text-left font-medium">Population</th>
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
                      <td className="px-3 py-2 font-medium">{row.name}</td>
                      <td className="px-3 py-2">
                        {row.area_id ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {row.zone_id ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs">{row.village_type || 'N/A'}</td>
                      <td className="px-3 py-2 text-xs">{row.population || 'N/A'}</td>
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
                {totalValid} villages will be imported. 
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
          Start Import ({totalValid} villages)
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
