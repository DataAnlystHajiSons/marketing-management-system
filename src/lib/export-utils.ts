// Export utilities for farmers data

interface FarmerExportData {
  id: string
  farmer_code: string
  full_name: string
  phone: string
  email?: string
  zone?: { name: string }
  area?: { name: string }
  village?: { name: string }
  lead_score: number
  lead_quality: string
  is_customer: boolean
  land_size_acres?: number
  primary_crops?: string[]
  assigned_tmo?: { full_name: string }
  assigned_field_staff?: { full_name: string }
  assigned_dealer?: { business_name: string }
  last_activity_date?: string
  created_at: string
  engagements?: any[]
}

// Helper to format data for export
function prepareExportData(farmers: FarmerExportData[]) {
  return farmers.map(farmer => ({
    'Farmer Code': farmer.farmer_code || 'N/A',
    'Full Name': farmer.full_name,
    'Phone': farmer.phone,
    'Email': farmer.email || 'N/A',
    'Zone': farmer.zone?.name || 'N/A',
    'Area': farmer.area?.name || 'N/A',
    'Village': farmer.village?.name || 'N/A',
    'Lead Score': farmer.lead_score,
    'Lead Quality': farmer.lead_quality?.toUpperCase(),
    'Customer Status': farmer.is_customer ? 'Customer' : 'Lead',
    'Land Size (acres)': farmer.land_size_acres || 0,
    'Primary Crops': farmer.primary_crops?.join(', ') || 'N/A',
    'Assigned TMO': farmer.assigned_tmo?.full_name || 'Unassigned',
    'Field Staff': farmer.assigned_field_staff?.full_name || 'Unassigned',
    'Dealer': farmer.assigned_dealer?.business_name || 'Unassigned',
    'Active Products': farmer.engagements?.length || 0,
    'Last Activity': farmer.last_activity_date ? new Date(farmer.last_activity_date).toLocaleDateString() : 'Never',
    'Registered': new Date(farmer.created_at).toLocaleDateString(),
  }))
}

// Export as CSV
export function exportToCSV(farmers: FarmerExportData[], filename = 'farmers-export.csv') {
  const data = prepareExportData(farmers)
  
  if (data.length === 0) {
    alert('No data to export')
    return
  }

  // Get headers
  const headers = Object.keys(data[0])
  
  // Create CSV content
  const csvContent = [
    headers.join(','), // Header row
    ...data.map(row => 
      headers.map(header => {
        const value = row[header as keyof typeof row]
        // Escape quotes and wrap in quotes if contains comma
        const stringValue = String(value ?? '')
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }
        return stringValue
      }).join(',')
    )
  ].join('\n')

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

// Export as Excel (using manual XLSX format)
export function exportToExcel(farmers: FarmerExportData[], filename = 'farmers-export.xlsx') {
  const data = prepareExportData(farmers)
  
  if (data.length === 0) {
    alert('No data to export')
    return
  }

  // For now, export as CSV with .xlsx extension
  // In production, you'd use a library like xlsx
  alert('Excel export coming soon! Using CSV format for now.')
  exportToCSV(farmers, filename.replace('.xlsx', '.csv'))
}

// Export as PDF (basic implementation)
export function exportToPDF(farmers: FarmerExportData[], filename = 'farmers-export.pdf') {
  const data = prepareExportData(farmers)
  
  if (data.length === 0) {
    alert('No data to export')
    return
  }

  // Create HTML table for PDF
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Farmers Export</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
        th { background-color: #4a5568; color: white; padding: 8px; text-align: left; border: 1px solid #ddd; }
        td { padding: 8px; border: 1px solid #ddd; }
        tr:nth-child(even) { background-color: #f8f9fa; }
        .meta { color: #666; font-size: 14px; margin-bottom: 10px; }
      </style>
    </head>
    <body>
      <h1>Farmers Export</h1>
      <div class="meta">
        <p>Exported on: ${new Date().toLocaleString()}</p>
        <p>Total Records: ${data.length}</p>
      </div>
      <table>
        <thead>
          <tr>
            ${Object.keys(data[0]).map(header => `<th>${header}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              ${Object.values(row).map(value => `<td>${value}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `

  // Open in new window for printing to PDF
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
    
    // Wait for content to load then trigger print dialog
    setTimeout(() => {
      printWindow.print()
    }, 250)
  } else {
    alert('Please allow popups to export as PDF')
  }
}

// Export selected farmers
export function exportSelected(
  allFarmers: FarmerExportData[], 
  selectedIds: string[], 
  format: 'csv' | 'excel' | 'pdf' = 'csv'
) {
  const selectedFarmers = allFarmers.filter(farmer => selectedIds.includes(farmer.id))
  
  if (selectedFarmers.length === 0) {
    alert('No farmers selected. Please select farmers to export.')
    return
  }

  const filename = `farmers-selected-${selectedFarmers.length}-${Date.now()}`
  
  switch (format) {
    case 'csv':
      exportToCSV(selectedFarmers, `${filename}.csv`)
      break
    case 'excel':
      exportToExcel(selectedFarmers, `${filename}.xlsx`)
      break
    case 'pdf':
      exportToPDF(selectedFarmers, `${filename}.pdf`)
      break
  }
}
