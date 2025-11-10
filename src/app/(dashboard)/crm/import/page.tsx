"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Package, MapPin, Building2, FileSpreadsheet, ArrowRight, Lock, Receipt } from "lucide-react"

const importModules = [
  {
    id: 'farmers',
    title: 'Farmers',
    description: 'Bulk import farmer records with demographics, location, and contact details',
    icon: Users,
    href: '/crm/import/farmers',
    enabled: true,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    id: 'dealers',
    title: 'Dealers',
    description: 'Import dealer network with contact details, location hierarchy, and field staff assignments',
    icon: Building2,
    href: '/crm/import/dealers',
    enabled: true,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  {
    id: 'dealer-sales',
    title: 'Dealer Sales',
    description: 'Import sales transactions (invoices and credit memos) with dealer and product mapping',
    icon: Receipt,
    href: '/crm/import/dealer-sales',
    enabled: true,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    id: 'villages',
    title: 'Villages',
    description: 'Bulk import villages with zone and area name mapping, population data, and geographic info',
    icon: MapPin,
    href: '/crm/import/villages',
    enabled: true,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    id: 'products',
    title: 'Products',
    description: 'Import product catalog with stages, pricing, and specifications',
    icon: Package,
    href: '/crm/import/products',
    enabled: false,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
  },
]

export default function ImportHubPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bulk Data Import</h1>
        <p className="text-muted-foreground mt-2">
          Import large datasets efficiently using CSV files. Download templates, map fields, and validate before importing.
        </p>
      </div>

      {/* Quick Stats / Info */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Supported Format</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">CSV</div>
            <p className="text-xs text-muted-foreground mt-1">
              Comma-separated values with UTF-8 encoding
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Import Process</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs space-y-1 text-muted-foreground">
              <div>1. Download CSV template</div>
              <div>2. Fill in your data</div>
              <div>3. Upload & validate</div>
              <div>4. Review & import</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Best Practices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs space-y-1 text-muted-foreground">
              <div>• Use provided templates</div>
              <div>• Validate data before upload</div>
              <div>• Import in batches (&lt;1000 rows)</div>
              <div>• Check for duplicates</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Import Modules */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Available Import Modules</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {importModules.map((module) => (
            <Card 
              key={module.id} 
              className={`relative ${!module.enabled ? 'opacity-60' : 'hover:shadow-md transition-shadow'}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${module.bgColor}`}>
                      <module.icon className={`h-6 w-6 ${module.color}`} />
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {module.title}
                        {module.enabled ? (
                          <Badge variant="default" className="text-xs">Active</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            <Lock className="h-3 w-3 mr-1" />
                            Coming Soon
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {module.description}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {module.enabled ? (
                      <span className="text-green-600 font-medium">Ready to use</span>
                    ) : (
                      <span>Available in future updates</span>
                    )}
                  </div>
                  {module.enabled ? (
                    <Link href={module.href}>
                      <Button size="sm">
                        Start Import
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  ) : (
                    <Button size="sm" disabled>
                      Not Available
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Help Section */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">Need Help?</CardTitle>
          <CardDescription>
            Having trouble with bulk imports? Check our guidelines or contact support.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              View Documentation
            </Button>
            <Button variant="outline" size="sm">
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
