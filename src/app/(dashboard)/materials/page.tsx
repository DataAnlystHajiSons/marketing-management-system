"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Filter, FileText, Download, Image as ImageIcon } from "lucide-react"

interface Material {
  id: string
  title: string
  type: string
  category: string
  language: string
  version: string
  size: string
  uploadDate: string
  uploadedBy: string
  isActive: boolean
}

const mockMaterials: Material[] = [
  {
    id: '1',
    title: 'Cotton Seeds Product Brochure 2024',
    type: 'brochure',
    category: 'Product Materials',
    language: 'English',
    version: '2.1',
    size: '2.4 MB',
    uploadDate: '2024-10-20',
    uploadedBy: 'Design Team',
    isActive: true
  },
  {
    id: '2',
    title: 'Farmer Meeting Presentation - Q4',
    type: 'presentation',
    category: 'Event Materials',
    language: 'Urdu',
    version: '1.0',
    size: '5.8 MB',
    uploadDate: '2024-10-15',
    uploadedBy: 'Marketing Team',
    isActive: true
  },
  {
    id: '3',
    title: 'Social Media Campaign - Wheat Season',
    type: 'post_design',
    category: 'Campaign Materials',
    language: 'Both',
    version: '1.5',
    size: '1.2 MB',
    uploadDate: '2024-10-10',
    uploadedBy: 'Design Team',
    isActive: true
  },
]

const typeIcons: Record<string, any> = {
  brochure: FileText,
  presentation: FileText,
  post_design: ImageIcon,
  poster: ImageIcon,
  flex: ImageIcon,
  leaflet: FileText,
  video: ImageIcon,
}

export default function MaterialsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [materials] = useState<Material[]>(mockMaterials)

  const filteredMaterials = materials.filter(material =>
    material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    material.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    material.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Marketing Materials</h1>
          <p className="text-muted-foreground">Digital asset library and resources</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Upload Material
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Materials</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{materials.length}</div>
            <p className="text-xs text-muted-foreground mt-1">All assets</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Brochures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {materials.filter(m => m.type === 'brochure').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Product materials</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Presentations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {materials.filter(m => m.type === 'presentation').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">PPT files</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Designs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {materials.filter(m => ['post_design', 'poster', 'flex'].includes(m.type)).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Visual content</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Materials</CardTitle>
            </div>
            <div className="flex gap-2">
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search materials..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredMaterials.map((material) => {
              const Icon = typeIcons[material.type] || FileText
              return (
                <Card key={material.id} className="overflow-hidden">
                  <div className="flex h-32 items-center justify-center bg-muted">
                    <Icon className="h-16 w-16 text-muted-foreground" />
                  </div>
                  <CardContent className="p-4 space-y-2">
                    <h3 className="font-semibold line-clamp-2">{material.title}</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {material.type.replace('_', ' ')}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{material.size}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{material.language}</span>
                      <span>v{material.version}</span>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Download className="mr-1 h-3 w-3" />
                        Download
                      </Button>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
