"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Edit, Trash2, Phone } from "lucide-react"
import { fieldStaffAPI } from "@/lib/supabase/field-staff"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function FieldStaffManagementPage() {
  const [fieldStaff, setFieldStaff] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchFieldStaff()
  }, [])

  async function fetchFieldStaff() {
    setLoading(true)
    const { data, error } = await fieldStaffAPI.getAll()
    
    console.log('Field Staff API Response:', { data, error })
    console.log('Field Staff count:', data?.length || 0)
    
    if (error) {
      console.error('Error fetching field staff:', error)
      alert('Error loading field staff: ' + error.message)
    }
    
    if (data) {
      console.log('Setting field staff:', data)
      setFieldStaff(data)
    } else {
      setFieldStaff([])
    }
    
    setLoading(false)
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete field staff "${name}"?`)) return
    
    const { error } = await fieldStaffAPI.delete(id)
    if (error) {
      alert('Error deleting field staff: ' + error.message)
    } else {
      alert('Field staff deleted successfully')
      fetchFieldStaff()
    }
  }

  const filteredStaff = fieldStaff.filter(staff =>
    staff.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    staff.staff_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    staff.phone.includes(searchQuery)
  )

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Field Staff Management</h1>
          <p className="text-muted-foreground">Manage field staff members</p>
        </div>
        <Link href="/management/field-staff/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Field Staff
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Field Staff</CardTitle>
          <CardDescription>Total: {fieldStaff.length}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search field staff..."
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
                  <th className="p-3 text-left font-medium">Staff Code</th>
                  <th className="p-3 text-left font-medium">Name</th>
                  <th className="p-3 text-left font-medium">Phone</th>
                  <th className="p-3 text-left font-medium">Area</th>
                  <th className="p-3 text-left font-medium">Status</th>
                  <th className="p-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No field staff found
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((staff) => (
                    <tr key={staff.id} className="border-b">
                      <td className="p-3 font-medium">{staff.staff_code}</td>
                      <td className="p-3">{staff.full_name}</td>
                      <td className="p-3 text-sm">
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {staff.phone}
                        </div>
                      </td>
                      <td className="p-3 text-sm">{staff.areas?.name || 'N/A'}</td>
                      <td className="p-3">
                        <Badge variant={staff.is_active ? 'success' : 'secondary'}>
                          {staff.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/management/field-staff/${staff.id}/edit`}>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(staff.id, staff.full_name)}
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
