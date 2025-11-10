"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle2, ArrowLeft, ArrowRight } from "lucide-react"
import * as XLSX from 'xlsx'

interface VillagesImportUploadProps {
  onFileUploaded: (data: any[]) => void
  onBack: () => void
}

export function VillagesImportUpload({ onFileUploaded, onBack }: VillagesImportUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<any[]>([])
  const [error, setError] = useState<string>('')
  const [parsing, setParsing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setError('')
    setParsing(true)

    try {
      const data = await parseFile(selectedFile)
      setParsedData(data)
    } catch (err: any) {
      setError(err.message || 'Failed to parse file')
      setParsedData([])
    } finally {
      setParsing(false)
    }
  }

  const parseFile = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const data = e.target?.result
          const workbook = XLSX.read(data, { type: 'binary' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: null })

          if (jsonData.length === 0) {
            reject(new Error('File is empty'))
            return
          }

          // Normalize column names
          const normalizedData = jsonData.map((row: any) => {
            const normalized: any = {}
            Object.keys(row).forEach(key => {
              const normalizedKey = key.trim().toLowerCase().replace(/\s+/g, '_')
              normalized[normalizedKey] = row[key]
            })
            return normalized
          })

          // Validate required columns
          const requiredColumns = ['name', 'zone_name', 'area_name']
          const firstRow = normalizedData[0]
          const missingColumns = requiredColumns.filter(col => !(col in firstRow))

          if (missingColumns.length > 0) {
            reject(new Error(`Missing required columns: ${missingColumns.join(', ')}`))
            return
          }

          resolve(normalizedData)
        } catch (err: any) {
          reject(new Error('Failed to parse file: ' + err.message))
        }
      }

      reader.onerror = () => {
        reject(new Error('Failed to read file'))
      }

      reader.readAsBinaryString(file)
    })
  }

  const handleContinue = () => {
    if (parsedData.length > 0) {
      onFileUploaded(parsedData)
    }
  }

  const downloadTemplate = () => {
    const template = [
      {
        name: 'Dijkot',
        zone_name: 'Punjab',
        area_name: 'Faisalabad',
        code: 'DJK',
        village_type: 'rural',
        population: 5000,
        postal_code: '38000',
        is_active: true,
        notes: 'Main agricultural village',
      },
      {
        name: 'Samundri',
        zone_name: 'Punjab',
        area_name: 'Faisalabad',
        code: 'SMD',
        village_type: 'urban',
        population: 15000,
        postal_code: '38100',
        is_active: true,
        notes: 'Commercial hub',
      },
      {
        name: 'Chak 204 RB',
        zone_name: 'Punjab',
        area_name: 'Faisalabad',
        code: 'C204',
        village_type: 'rural',
        population: 3000,
        postal_code: '38050',
        is_active: true,
        notes: '',
      },
    ]

    const ws = XLSX.utils.json_to_sheet(template)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Villages')
    XLSX.writeFile(wb, 'villages_import_template.xlsx')
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload File</CardTitle>
          <CardDescription>Upload a CSV or Excel file with village data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Download Template */}
          <Alert>
            <FileSpreadsheet className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span>Need a template? Download our sample file to get started.</span>
                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Template
                </Button>
              </div>
            </AlertDescription>
          </Alert>

          {/* File Upload */}
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {!file ? (
              <div className="space-y-4">
                <div className="mx-auto w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-medium">Upload your villages file</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    CSV, XLS, or XLSX file up to 10MB
                  </p>
                </div>
                <Button onClick={() => fileInputRef.current?.click()}>
                  Select File
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium">{file.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  Change File
                </Button>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Parsing Status */}
          {parsing && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Parsing file...</AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {parsedData.length > 0 && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span>Successfully parsed <strong>{parsedData.length}</strong> villages</span>
                  <Badge variant="secondary">{parsedData.length} rows</Badge>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Data Preview */}
          {parsedData.length > 0 && (
            <div>
              <h4 className="font-medium mb-3">Preview (First 5 rows)</h4>
              <div className="border rounded-lg overflow-auto max-h-80">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Row</th>
                      <th className="px-3 py-2 text-left font-medium">Village Name</th>
                      <th className="px-3 py-2 text-left font-medium">Zone</th>
                      <th className="px-3 py-2 text-left font-medium">Area</th>
                      <th className="px-3 py-2 text-left font-medium">Type</th>
                      <th className="px-3 py-2 text-left font-medium">Population</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.slice(0, 5).map((row, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-3 py-2">{index + 1}</td>
                        <td className="px-3 py-2 font-medium">{row.name}</td>
                        <td className="px-3 py-2">{row.zone_name}</td>
                        <td className="px-3 py-2">{row.area_name}</td>
                        <td className="px-3 py-2 text-xs">{row.village_type || 'N/A'}</td>
                        <td className="px-3 py-2 text-xs">{row.population || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedData.length > 5 && (
                <p className="text-sm text-muted-foreground mt-2">
                  And {parsedData.length - 5} more rows...
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Column Information */}
      <Card>
        <CardHeader>
          <CardTitle>Required Columns</CardTitle>
          <CardDescription>Your file must include these columns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              'name',
              'zone_name',
              'area_name',
            ].map(col => (
              <Badge key={col} variant="secondary" className="justify-center py-2">
                {col}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Optional Columns</CardTitle>
          <CardDescription>Include these for complete data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              'code',
              'village_type',
              'population',
              'postal_code',
              'latitude',
              'longitude',
              'is_active',
              'notes',
            ].map(col => (
              <Badge key={col} variant="outline" className="justify-center py-2">
                {col}
              </Badge>
            ))}
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
          onClick={handleContinue}
          disabled={parsedData.length === 0}
        >
          Continue to Mapping
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
