"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Upload, FileText, CheckCircle, AlertCircle, Download } from "lucide-react"
import * as XLSX from "xlsx"
import { supabase } from "@/lib/supabase/client"
import { dealerSalesAPI } from "@/lib/supabase/dealer-sales"

interface ParsedSale {
  dealer_name: string
  dealer_code?: string
  transaction_type: string
  transaction_date: string
  reference_number: string
  product_name: string
  product_code?: string
  quantity: number
  unit_price: number
  discount_amount?: number
  tax_amount?: number
  payment_status?: string
  payment_date?: string
  due_date?: string
  notes?: string
}

interface MappedSale extends ParsedSale {
  dealer_id?: string
  product_id?: string
  matched_dealer_code?: string
  validation_errors?: string[]
}

type Step = 'upload' | 'mapping' | 'dealer-mapping' | 'preview' | 'importing' | 'complete'

interface UnmatchedDealer {
  dealerName: string
  rows: number[]
  selectedDealerId?: string
}

export default function DealerSalesImportPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('upload')
  const [parsedData, setParsedData] = useState<ParsedSale[]>([])
  const [mappedData, setMappedData] = useState<MappedSale[]>([])
  const [unmatchedDealers, setUnmatchedDealers] = useState<UnmatchedDealer[]>([])
  const [allDealers, setAllDealers] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [successCount, setSuccessCount] = useState(0)
  const [errorCount, setErrorCount] = useState(0)
  const [importing, setImporting] = useState(false)

  // Helper function to convert Excel serial date to YYYY-MM-DD
  const excelDateToString = (serial: any): string | undefined => {
    if (!serial) return undefined
    
    // If already a string in proper format, return it
    if (typeof serial === 'string' && /^\d{4}-\d{2}-\d{2}/.test(serial)) {
      return serial.split('T')[0] // Handle datetime strings
    }
    
    // If it's a number (Excel serial date)
    if (typeof serial === 'number') {
      // Excel dates start from 1900-01-01 (serial 1)
      // JavaScript dates start from 1970-01-01
      const excelEpoch = new Date(1899, 11, 30) // Dec 30, 1899 (Excel's epoch)
      const jsDate = new Date(excelEpoch.getTime() + serial * 86400000) // 86400000 = milliseconds in a day
      
      const year = jsDate.getFullYear()
      const month = String(jsDate.getMonth() + 1).padStart(2, '0')
      const day = String(jsDate.getDate()).padStart(2, '0')
      
      return `${year}-${month}-${day}`
    }
    
    // Try to parse as date string
    try {
      const date = new Date(serial)
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }
    } catch {
      return undefined
    }
    
    return undefined
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const data = event.target?.result
        const workbook = XLSX.read(data, { type: 'binary', cellDates: false })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(sheet, { raw: false }) as ParsedSale[]

        if (jsonData.length === 0) {
          setError('CSV file is empty')
          return
        }

        // Validate required columns
        const requiredColumns = ['dealer_name', 'transaction_type', 'transaction_date', 'reference_number', 'product_name', 'quantity', 'unit_price']
        const firstRow = jsonData[0]
        const missingColumns = requiredColumns.filter(col => !(col in firstRow))

        if (missingColumns.length > 0) {
          setError(`Missing required columns: ${missingColumns.join(', ')}`)
          return
        }

        // Convert Excel date serial numbers to YYYY-MM-DD format
        const processedData = jsonData.map(row => ({
          ...row,
          transaction_date: excelDateToString(row.transaction_date) || row.transaction_date,
          payment_date: row.payment_date ? excelDateToString(row.payment_date) : undefined,
          due_date: row.due_date ? excelDateToString(row.due_date) : undefined,
        }))

        setParsedData(processedData)
        setStep('mapping')
      } catch (err) {
        console.error('Parse error:', err)
        setError('Failed to parse file. Please check the format.')
      }
    }

    reader.readAsBinaryString(file)
  }

  const handleMapping = async () => {
    setError(null)
    setImporting(true)

    try {
      // Get all dealers
      const { data: dealers, error: dealersError } = await supabase
        .from('dealers')
        .select('id, dealer_code, business_name, owner_name')
        .order('business_name')

      if (dealersError) throw dealersError

      // Store all dealers for manual mapping
      setAllDealers(dealers || [])

      // Get all products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, product_name, product_code')

      if (productsError) throw productsError

      // Note: We don't check for duplicates because:
      // - Same invoice can have same product multiple times (different batches, prices, etc.)
      // - This is valid business scenario

      // Create lookup maps
      const dealerMapByName = new Map(dealers?.map(d => [d.business_name.toLowerCase(), d]) || [])
      const dealerMapByCode = new Map(dealers?.map(d => [d.dealer_code.toLowerCase(), d]) || [])
      const productMapByName = new Map(products?.map(p => [p.product_name.toLowerCase(), p]) || [])
      const productMapByCode = new Map(products?.filter(p => p.product_code).map(p => [p.product_code.toLowerCase(), p]) || [])

      // Note: We allow duplicate reference+product combinations
      // because a single invoice can have the same product multiple times

      // Map data
      const mapped: MappedSale[] = parsedData.map((sale, idx) => {
        const errors: string[] = []
        const mapped: MappedSale = { ...sale }

        // Note: We don't check for duplicate reference+product combinations
        // because a single invoice can legitimately have the same product multiple times

        // Normalize transaction type (flexible input formats)
        const normalizedType = sale.transaction_type.toLowerCase().trim().replace(/[\s_-]/g, '')
        if (normalizedType === 'creditmemo' || normalizedType === 'credit') {
          mapped.transaction_type = 'credit_memo'
        } else if (normalizedType === 'invoice' || normalizedType === 'inv') {
          mapped.transaction_type = 'invoice'
        } else {
          errors.push(`Invalid transaction type: ${sale.transaction_type}. Use 'invoice' or 'credit_memo' (or 'credit memo', 'Credit Memo', etc.)`)
        }

        // Map dealer (search by name first, then code)
        let dealer = dealerMapByName.get(sale.dealer_name.toLowerCase())
        
        // Fallback to dealer_code if provided and name not found
        if (!dealer && sale.dealer_code) {
          dealer = dealerMapByCode.get(sale.dealer_code.toLowerCase())
        }
        
        if (dealer) {
          mapped.dealer_id = dealer.id
          mapped.matched_dealer_code = dealer.dealer_code
        } else {
          errors.push(`Dealer not found: ${sale.dealer_name}`)
        }

        // Map product (try by name first, then code)
        let product = productMapByName.get(sale.product_name.toLowerCase())
        if (!product && sale.product_code) {
          product = productMapByCode.get(sale.product_code.toLowerCase())
        }
        
        if (product) {
          mapped.product_id = product.id
          if (!mapped.product_code) {
            mapped.product_code = product.product_code
          }
        }
        // Note: Product is optional, can be manually entered

        // Validate dates
        if (!sale.transaction_date || isNaN(Date.parse(sale.transaction_date))) {
          errors.push('Invalid transaction date')
        }

        // Validate and normalize quantity based on transaction type
        const isCreditMemo = mapped.transaction_type === 'credit_memo'
        const quantity = parseFloat(String(sale.quantity))
        
        if (isNaN(quantity) || quantity === 0) {
          errors.push('Invalid quantity: must be a non-zero number')
        } else {
          // For credit memos, quantity should be negative
          // If user entered positive, auto-convert to negative
          if (isCreditMemo && quantity > 0) {
            mapped.quantity = -Math.abs(quantity)
          } else if (isCreditMemo && quantity < 0) {
            mapped.quantity = quantity // Already negative, keep as is
          } else if (!isCreditMemo && quantity < 0) {
            errors.push('Invalid quantity for invoice: must be positive')
          } else {
            mapped.quantity = quantity
          }
        }

        // Validate unit price
        const unitPrice = parseFloat(String(sale.unit_price))
        if (isNaN(unitPrice) || unitPrice < 0) {
          errors.push('Invalid unit price: must be a non-negative number')
        }

        mapped.validation_errors = errors
        return mapped
      })

      setMappedData(mapped)
      
      // Check for unmatched dealers
      const unmatchedDealerMap = new Map<string, number[]>()
      mapped.forEach((sale, idx) => {
        if (!sale.dealer_id && sale.dealer_name) {
          const dealerName = sale.dealer_name
          if (!unmatchedDealerMap.has(dealerName)) {
            unmatchedDealerMap.set(dealerName, [])
          }
          unmatchedDealerMap.get(dealerName)!.push(idx)
        }
      })

      const unmatched: UnmatchedDealer[] = Array.from(unmatchedDealerMap.entries()).map(([dealerName, rows]) => ({
        dealerName,
        rows,
        selectedDealerId: undefined
      }))

      setUnmatchedDealers(unmatched)

      // If there are unmatched dealers, go to dealer mapping step
      // Otherwise, go directly to preview
      if (unmatched.length > 0) {
        setStep('dealer-mapping')
      } else {
        setStep('preview')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to map data')
    } finally {
      setImporting(false)
    }
  }

  const handleDealerMappingChange = (dealerName: string, dealerId: string) => {
    setUnmatchedDealers(prev => 
      prev.map(d => d.dealerName === dealerName ? { ...d, selectedDealerId: dealerId } : d)
    )
  }

  const handleApplyDealerMappings = () => {
    // Apply manual mappings to mapped data
    const updatedData = mappedData.map((sale, idx) => {
      if (!sale.dealer_id) {
        const unmatchedDealer = unmatchedDealers.find(d => d.dealerName === sale.dealer_name)
        if (unmatchedDealer?.selectedDealerId) {
          const dealer = allDealers.find(d => d.id === unmatchedDealer.selectedDealerId)
          if (dealer) {
            return {
              ...sale,
              dealer_id: dealer.id,
              matched_dealer_code: dealer.dealer_code,
              validation_errors: sale.validation_errors?.filter(e => !e.includes('Dealer not found'))
            }
          }
        }
      }
      return sale
    })

    setMappedData(updatedData)
    setStep('preview')
  }

  const canContinueDealerMapping = unmatchedDealers.every(d => d.selectedDealerId)

  const handleImport = async () => {
    setError(null)
    setImporting(true)
    setStep('importing')

    let success = 0
    let failed = 0

    try {
      // Filter out rows with validation errors
      const validSales = mappedData.filter(sale => !sale.validation_errors || sale.validation_errors.length === 0)

      if (validSales.length === 0) {
        setError('No valid sales to import. Please fix validation errors.')
        setStep('preview')
        setImporting(false)
        return
      }

      // Import in batches (smaller batch size for better error tracking)
      const batchSize = 10
      for (let i = 0; i < validSales.length; i += batchSize) {
        const batch = validSales.slice(i, i + batchSize)
        
        const salesToInsert = batch.map(sale => {
          const quantity = parseFloat(String(sale.quantity))
          const unitPrice = parseFloat(String(sale.unit_price))
          
          return {
            dealer_id: sale.dealer_id,
            product_id: sale.product_id || undefined,
            transaction_type: sale.transaction_type.toLowerCase(),
            transaction_date: sale.transaction_date,
            reference_number: sale.reference_number,
            product_name: sale.product_name,
            product_code: sale.product_code || undefined,
            quantity: quantity,
            unit_price: unitPrice,
            amount: quantity * unitPrice, // Will be negative for credit memos
            discount_amount: sale.discount_amount ? parseFloat(String(sale.discount_amount)) : 0,
            tax_amount: sale.tax_amount ? parseFloat(String(sale.tax_amount)) : 0,
            payment_status: sale.payment_status?.toLowerCase() || 'pending',
            payment_date: sale.payment_date || undefined,
            due_date: sale.due_date || undefined,
            notes: sale.notes || undefined,
          }
        })

        const { error: batchError } = await dealerSalesAPI.bulkCreate(salesToInsert as any)

        if (batchError) {
          console.error('Batch import error:', batchError)
          // Try to import individually to identify which ones fail
          for (const sale of salesToInsert) {
            const { error: singleError } = await dealerSalesAPI.create(sale as any)
            if (singleError) {
              console.error(`Failed to import ${sale.reference_number}:`, singleError.message)
              failed++
            } else {
              success++
            }
          }
        } else {
          success += batch.length
        }
        
        // Small delay between batches to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      setSuccessCount(success)
      setErrorCount(failed)
      setStep('complete')
    } catch (err: any) {
      setError(err.message || 'Failed to import sales')
      setStep('preview')
    } finally {
      setImporting(false)
    }
  }

  const downloadTemplate = () => {
    const template = [
      {
        dealer_name: 'Green Valley Traders',
        transaction_type: 'invoice',
        transaction_date: '2025-11-01',
        reference_number: 'INV-001',
        product_name: 'Wheat Seed',
        product_code: 'WS-001',
        quantity: 100,
        unit_price: 500,
        discount_amount: 1000,
        tax_amount: 500,
        payment_status: 'paid',
        payment_date: '2025-11-01',
        due_date: '2025-12-01',
        notes: 'First order'
      },
      {
        dealer_name: 'Green Valley Traders',
        transaction_type: 'invoice',
        transaction_date: '2025-11-01',
        reference_number: 'INV-001',
        product_name: 'Fertilizer NPK',
        product_code: 'FERT-001',
        quantity: 50,
        unit_price: 800,
        discount_amount: 0,
        tax_amount: 400,
        payment_status: 'paid',
        payment_date: '2025-11-01',
        due_date: '2025-12-01',
        notes: 'Same invoice - multiple line items'
      },
      {
        dealer_name: 'Green Valley Traders',
        transaction_type: 'credit_memo',
        transaction_date: '2025-11-03',
        reference_number: 'CM-001',
        product_name: 'Wheat Seed',
        product_code: 'WS-001',
        quantity: -5,
        unit_price: 500,
        discount_amount: 0,
        tax_amount: 0,
        payment_status: 'paid',
        payment_date: '2025-11-03',
        due_date: '',
        notes: 'Damaged items returned (negative quantity)'
      }
    ]

    const ws = XLSX.utils.json_to_sheet(template)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Dealer Sales')
    XLSX.writeFile(wb, 'dealer_sales_import_template.xlsx')
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/crm/import">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Import Dealer Sales</h1>
          <p className="text-muted-foreground">
            Bulk import sales transactions from CSV/Excel
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {['upload', 'mapping', 'dealer-mapping', 'preview', 'complete'].map((s, idx) => {
              const stepOrder = ['upload', 'mapping', 'dealer-mapping', 'preview', 'importing', 'complete']
              const currentIdx = stepOrder.indexOf(step)
              const stepIdx = stepOrder.indexOf(s)
              const isActive = step === s
              const isCompleted = currentIdx > stepIdx
              
              return (
                <div key={s} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    isActive ? 'bg-primary text-white' :
                    isCompleted ? 'bg-green-500 text-white' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <span>{idx + 1}</span>
                    )}
                  </div>
                  <div className="ml-2">
                    <div className="font-medium text-xs capitalize whitespace-nowrap">
                      {s === 'dealer-mapping' ? 'Match Dealers' : s}
                    </div>
                  </div>
                  {idx < 4 && <div className="w-12 h-0.5 bg-muted mx-2" />}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Step: Upload */}
      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle>Upload CSV/Excel File</CardTitle>
            <CardDescription>
              Select a file containing dealer sales data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-muted rounded-lg p-12 text-center">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <div className="space-y-2">
                <p className="text-lg font-medium">Upload your file</p>
                <p className="text-sm text-muted-foreground">
                  CSV or Excel file with dealer sales data
                </p>
              </div>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="inline-block mt-4 cursor-pointer">
                <div className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                  <FileText className="mr-2 h-4 w-4" />
                  Choose File
                </div>
              </label>
            </div>

            <div className="flex items-center justify-between pt-4">
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Required columns:</strong> dealer_name, transaction_type, transaction_date, reference_number, product_name, quantity, unit_price
                <br />
                <strong>Optional columns:</strong> dealer_code (fallback if name not found), product_code, discount_amount, tax_amount, payment_status, payment_date, due_date, notes
                <br />
                <strong>✅ Line Items:</strong> You can have multiple rows with the same reference_number (for different products OR same product with different quantities/prices). Each row represents one line item.
                <br />
                <strong>📝 Transaction Types:</strong> Use "invoice" or "credit_memo" (variations like "credit memo", "Credit Memo", "creditmemo" are also accepted)
                <br />
                <strong>↩️ Credit Memos:</strong> For returns/adjustments, use quantity as negative (e.g., -10) or positive (system will auto-convert to negative)
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Step: Mapping */}
      {step === 'mapping' && (
        <Card>
          <CardHeader>
            <CardTitle>Mapping Data</CardTitle>
            <CardDescription>
              Found {parsedData.length} sales records. Mapping dealers and products...
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-8">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-lg font-medium mb-2">Processing your data</p>
              <p className="text-sm text-muted-foreground">
                Matching dealer names and product names with database records
              </p>
            </div>
            <div className="flex justify-center">
              <Button onClick={handleMapping} disabled={importing}>
                {importing ? 'Processing...' : 'Continue'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Dealer Mapping */}
      {step === 'dealer-mapping' && (
        <Card>
          <CardHeader>
            <CardTitle>Match Dealers Manually</CardTitle>
            <CardDescription>
              {unmatchedDealers.length} dealer name(s) couldn't be matched automatically. Please select the correct dealer from the dropdown.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                The dealer names in your CSV don't exactly match the names in the database. Select the correct dealer for each unmatched name below.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              {unmatchedDealers.map((unmatched, idx) => (
                <Card key={idx} className="border-2 border-orange-200 bg-orange-50/50">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Dealer name in your CSV:</p>
                          <p className="text-lg font-semibold text-orange-700">{unmatched.dealerName}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Affects {unmatched.rows.length} row(s)
                          </p>
                        </div>
                        {unmatched.selectedDealerId && (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Select correct dealer:</label>
                        <select
                          className="w-full px-3 py-2 border rounded-md bg-white"
                          value={unmatched.selectedDealerId || ''}
                          onChange={(e) => handleDealerMappingChange(unmatched.dealerName, e.target.value)}
                        >
                          <option value="">-- Select Dealer --</option>
                          {allDealers.map(dealer => (
                            <option key={dealer.id} value={dealer.id}>
                              {dealer.business_name} ({dealer.dealer_code}) - {dealer.owner_name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setStep('upload')}>
                Back to Upload
              </Button>
              <Button 
                onClick={handleApplyDealerMappings}
                disabled={!canContinueDealerMapping}
              >
                {canContinueDealerMapping ? 'Continue to Preview' : 'Please map all dealers'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Preview */}
      {step === 'preview' && (
        <Card>
          <CardHeader>
            <CardTitle>Preview & Validate</CardTitle>
            <CardDescription>
              Review mapped data before importing. {mappedData.filter(s => !s.validation_errors || s.validation_errors.length === 0).length} valid, {mappedData.filter(s => s.validation_errors && s.validation_errors.length > 0).length} errors
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Error Summary */}
            {mappedData.filter(s => s.validation_errors && s.validation_errors.length > 0).length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>{mappedData.filter(s => s.validation_errors && s.validation_errors.length > 0).length} records have errors and will be skipped:</strong>
                  <ul className="mt-2 ml-4 list-disc text-sm">
                    <li>Dealer not found: {mappedData.filter(s => s.validation_errors?.some(e => e.includes('Dealer not found'))).length}</li>
                    <li>Invalid dates: {mappedData.filter(s => s.validation_errors?.some(e => e.includes('Invalid') && e.includes('date'))).length}</li>
                    <li>Invalid quantity: {mappedData.filter(s => s.validation_errors?.some(e => e.includes('Invalid quantity'))).length}</li>
                    <li>Invalid unit price: {mappedData.filter(s => s.validation_errors?.some(e => e.includes('Invalid unit price'))).length}</li>
                    <li>Invalid transaction type: {mappedData.filter(s => s.validation_errors?.some(e => e.includes('Invalid transaction type'))).length}</li>
                    <li>Other errors: {mappedData.filter(s => s.validation_errors?.some(e => !e.includes('Dealer not found') && !e.includes('Invalid'))).length}</li>
                  </ul>
                  <p className="mt-2 text-sm font-semibold">⬇️ Scroll down to see detailed error messages for each row in the table below.</p>
                  <p className="mt-1 text-sm">Only valid records will be imported.</p>
                </AlertDescription>
              </Alert>
            )}

            {/* Detailed Error List */}
            {mappedData.filter(s => s.validation_errors && s.validation_errors.length > 0).length > 0 && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-red-700">Detailed Error List</CardTitle>
                  <CardDescription>Review these errors before importing</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-auto">
                    {mappedData
                      .map((sale, idx) => ({ sale, idx }))
                      .filter(({ sale }) => sale.validation_errors && sale.validation_errors.length > 0)
                      .map(({ sale, idx }) => (
                        <div key={idx} className="bg-white p-3 rounded border border-red-200">
                          <div className="flex items-start justify-between mb-2">
                            <div className="font-semibold text-red-700">Row {idx + 1}</div>
                            <div className="text-xs text-muted-foreground">
                              {sale.reference_number} - {sale.product_name}
                            </div>
                          </div>
                          <div className="space-y-1">
                            {sale.validation_errors!.map((error, errIdx) => (
                              <div key={errIdx} className="flex items-start gap-2 text-sm">
                                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                                <span className="text-red-600">{error}</span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground">
                            Dealer: {sale.dealer_name} | Date: {sale.transaction_date}
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
            <div className="rounded-lg border max-h-96 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Dealer</th>
                    <th className="px-3 py-2 text-left">Type</th>
                    <th className="px-3 py-2 text-left">Reference</th>
                    <th className="px-3 py-2 text-left">Product</th>
                    <th className="px-3 py-2 text-right">Quantity</th>
                    <th className="px-3 py-2 text-right">Price</th>
                    <th className="px-3 py-2 text-left">Errors</th>
                  </tr>
                </thead>
                <tbody>
                  {mappedData.slice(0, 100).map((sale, idx) => {
                    const hasErrors = sale.validation_errors && sale.validation_errors.length > 0
                    
                    return (
                      <tr key={idx} className={`border-t ${hasErrors ? 'bg-red-50' : ''}`}>
                        <td className="px-3 py-2">
                          {!hasErrors ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <div className="font-medium">{sale.dealer_name}</div>
                          {sale.matched_dealer_code && (
                            <div className="text-xs text-muted-foreground">{sale.matched_dealer_code}</div>
                          )}
                        </td>
                        <td className="px-3 py-2 capitalize">{sale.transaction_type}</td>
                        <td className="px-3 py-2">
                          <div className="font-mono text-xs">{sale.reference_number}</div>
                        </td>
                        <td className="px-3 py-2">
                          <div>{sale.product_name}</div>
                          {sale.product_code && (
                            <div className="text-xs text-muted-foreground">{sale.product_code}</div>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">{sale.quantity}</td>
                        <td className="px-3 py-2 text-right">{sale.unit_price}</td>
                        <td className="px-3 py-2 max-w-xs">
                          {sale.validation_errors && sale.validation_errors.length > 0 && (
                            <div className="text-xs text-red-600">
                              {sale.validation_errors.map((err, i) => (
                                <div key={i} className="mb-1">{err}</div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {mappedData.length > 100 && (
              <p className="text-sm text-muted-foreground text-center">
                Showing first 100 of {mappedData.length} records
              </p>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setStep('upload')}>
                Back
              </Button>
              <Button 
                onClick={handleImport}
                disabled={importing || mappedData.filter(s => !s.validation_errors || s.validation_errors.length === 0).length === 0}
              >
                Import {mappedData.filter(s => !s.validation_errors || s.validation_errors.length === 0).length} Sales
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Importing */}
      {step === 'importing' && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="text-6xl mb-4">⏳</div>
              <p className="text-lg font-medium mb-2">Importing sales...</p>
              <p className="text-sm text-muted-foreground">
                Please wait while we process your data
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Complete */}
      {step === 'complete' && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-2xl font-bold">Import Complete!</h2>
              <div className="space-y-2">
                <p className="text-lg">
                  <span className="font-semibold text-green-600">{successCount}</span> sales imported successfully
                </p>
                {errorCount > 0 && (
                  <p className="text-lg">
                    <span className="font-semibold text-red-600">{errorCount}</span> failed
                  </p>
                )}
              </div>
              <div className="flex gap-2 justify-center pt-4">
                <Button variant="outline" onClick={() => {
                  setStep('upload')
                  setParsedData([])
                  setMappedData([])
                  setUnmatchedDealers([])
                  setAllDealers([])
                  setSuccessCount(0)
                  setErrorCount(0)
                  setError(null)
                }}>
                  Import More
                </Button>
                <Button onClick={() => router.push('/crm/dealers')}>
                  View Dealers
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
