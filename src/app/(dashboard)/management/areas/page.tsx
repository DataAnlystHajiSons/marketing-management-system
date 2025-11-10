"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Edit, Trash2 } from "lucide-react"
import { areasAPI } from "@/lib/supabase/areas"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function AreasPage() {
  const [areas, setAreas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchAreas()
  }, [])

  async function fetchAreas() {
    setLoading(true)
    const { data, error } = await areasAPI.getAll()
    
    console.log('Areas API Response:', { data, error })
    console.log('Areas count:', data?.length || 0)
    
    if (error) {
      console.error('Error fetching areas:', error)
      alert('Error loading areas: ' + error.message)
    }
    
    if (data) {
      console.log('Setting areas:', data)
      setAreas(data)
    } else {
      setAreas([])
    }
    
    setLoading(false)
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete area "${name}"?`)) return
    
    const { error } = await areasAPI.delete(id)
    if (error) {
      alert('Error deleting area: ' + error.message)
    } else {
      alert('Area deleted successfully')
      fetchAreas()
    }
  }

  const filteredAreas = areas.filter(area =>
    area.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    area.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Areas Management</h1>
          <p className="text-muted-foreground">Manage geographical areas</p>
        </div>
        <Link href="/management/areas/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Area
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Areas</CardTitle>
          <CardDescription>Total areas: {areas.length}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search areas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 text-left font-medium">Code</th>
                  <th className="p-3 text-left font-medium">Name</th>
                  <th className="p-3 text-left font-medium">Zone</th>
                  <th className="p-3 text-left font-medium">Status</th>
                  <th className="p-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAreas.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      No areas found
                    </td>
                  </tr>
                ) : (
                  filteredAreas.map((area) => (
                    <tr key={area.id} className="border-b">
                      <td className="p-3 font-medium">{area.code}</td>
                      <td className="p-3">{area.name}</td>
                      <td className="p-3 text-sm">{area.zones?.name || 'N/A'}</td>
                      <td className="p-3">
                        <Badge variant={area.is_active ? 'success' : 'secondary'}>
                          {area.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/management/areas/${area.id}/edit`}>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(area.id, area.name)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
