"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Edit, Trash2 } from "lucide-react"
import { zonesAPI } from "@/lib/supabase/zones"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function ZonesPage() {
  const [zones, setZones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchZones()
  }, [])

  async function fetchZones() {
    setLoading(true)
    const { data } = await zonesAPI.getAll()
    if (data) setZones(data)
    setLoading(false)
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete zone "${name}"?`)) return
    
    const { error } = await zonesAPI.delete(id)
    if (error) {
      alert('Error deleting zone: ' + error.message)
    } else {
      alert('Zone deleted successfully')
      fetchZones()
    }
  }

  const filteredZones = zones.filter(zone =>
    zone.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    zone.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Zones Management</h1>
          <p className="text-muted-foreground">Manage geographical zones</p>
        </div>
        <Link href="/management/zones/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Zone
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Zones</CardTitle>
          <CardDescription>
            Total zones: {zones.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search zones..."
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
                  <th className="p-3 text-left font-medium">Country</th>
                  <th className="p-3 text-left font-medium">Status</th>
                  <th className="p-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredZones.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      No zones found
                    </td>
                  </tr>
                ) : (
                  filteredZones.map((zone) => (
                    <tr key={zone.id} className="border-b">
                      <td className="p-3 font-medium">{zone.code}</td>
                      <td className="p-3">{zone.name}</td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {zone.country || 'Pakistan'}
                      </td>
                      <td className="p-3">
                        <Badge variant={zone.is_active ? 'success' : 'secondary'}>
                          {zone.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/management/zones/${zone.id}/edit`}>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(zone.id, zone.name)}
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
