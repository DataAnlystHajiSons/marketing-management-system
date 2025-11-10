"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react"

interface FarmersImportUploadProps {
  onFileUploaded: (data: any[]) => void
}

export function FarmersImportUpload({ onFileUploaded }: FarmersImportUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string>('')
  const [parsing, setParsing] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      handleFile(droppedFile)
    }
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      handleFile(selectedFile)
    }
  }

  const handleFile = (selectedFile: File) => {
    setError('')
    
    // Validate file type
    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please upload a CSV file')
      return
    }

    // Validate file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB')
      return
    }

    setFile(selectedFile)
  }

  const parseCSV = async () => {
    if (!file) return

    setParsing(true)
    setError('')

    try {
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length < 2) {
        setError('CSV file must contain at least a header row and one data row')
        setParsing(false)
        return
      }

      // Parse header
      const headers = lines[0].split(',').map(h => h.trim())
      
      // Required fields
      const requiredFields = ['full_name', 'phone']
      const missingFields = requiredFields.filter(field => !headers.includes(field))
      
      if (missingFields.length > 0) {
        setError(`Missing required fields: ${missingFields.join(', ')}`)
        setParsing(false)
        return
      }

      // Parse data rows
      const data = []
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i]
        if (!line.trim()) continue

        const values = parseCSVLine(line)
        const row: any = {}
        
        headers.forEach((header, index) => {
          row[header] = values[index]?.trim() || ''
        })
        
        data.push(row)
      }

      if (data.length === 0) {
        setError('No valid data rows found in CSV')
        setParsing(false)
        return
      }

      if (data.length > 1000) {
        setError('Maximum 1000 rows allowed per import. Please split your file.')
        setParsing(false)
        return
      }

      onFileUploaded(data)
    } catch (err: any) {
      setError(err.message || 'Failed to parse CSV file')
    } finally {
      setParsing(false)
    }
  }

  // Simple CSV line parser (handles basic comma-separated values)
  const parseCSVLine = (line: string): string[] => {
    const result = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current)
        current = ''
      } else {
        current += char
      }
    }

    result.push(current)
    return result
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Upload CSV File</CardTitle>
          <CardDescription>
            Upload a CSV file containing farmer data. Make sure to use our template format.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <div className="flex flex-col items-center gap-4">
              {file ? (
                <>
                  <CheckCircle2 className="h-12 w-12 text-green-600" />
                  <div>
                    <p className="text-lg font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Upload className="h-12 w-12 text-muted-foreground" />
                  <div>
                    <p className="text-lg font-medium">Drop your CSV file here</p>
                    <p className="text-sm text-muted-foreground">or click to browse</p>
                  </div>
                </>
              )}
              
              <input
                type="file"
                accept=".csv"
                onChange={handleFileInput}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload">
                <div className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 cursor-pointer">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  {file ? 'Choose Different File' : 'Browse Files'}
                </div>
              </label>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {file && !error && (
            <Button onClick={parseCSV} disabled={parsing} className="w-full">
              {parsing ? 'Parsing...' : 'Continue to Preview'}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">CSV Format Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs mt-0.5">1</div>
              <div>
                <p className="font-medium">Required Fields</p>
                <p className="text-muted-foreground text-xs">full_name, phone</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs mt-0.5">2</div>
              <div>
                <p className="font-medium">Optional Fields</p>
                <p className="text-muted-foreground text-xs">
                  alternate_phone, email, zone_id, area_id, village_id, address, land_size_acres, 
                  primary_crops, assigned_tmo_id, assigned_field_staff_id, assigned_dealer_id
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs mt-0.5">3</div>
              <div>
                <p className="font-medium">File Limits</p>
                <p className="text-muted-foreground text-xs">Maximum 1000 rows, 5MB file size</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs mt-0.5">4</div>
              <div>
                <p className="font-medium">IDs Format</p>
                <p className="text-muted-foreground text-xs">
                  Use UUID format for zone_id, area_id, village_id, and assignment IDs. 
                  You can find these in the respective management pages.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
