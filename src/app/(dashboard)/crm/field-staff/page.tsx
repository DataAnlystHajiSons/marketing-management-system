"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Search, Filter, Phone, Edit, Eye, Loader2 } from "lucide-react"
import { fieldStaffAPI, type FieldStaff } from "@/lib/supabase/field-staff"
import { LoadingPage } from "@/components/ui/loading-spinner"
import { ErrorMessage } from "@/components/ui/error-message"

export default function FieldStaffPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [staff, setStaff] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadFieldStaff()
  }, [])

  const loadFieldStaff = async () => {
    setLoading(true)
    setError(null)
    
    const { data, error: fetchError } = await fieldStaffAPI.getAll()
    
    if (fetchError) {
      setError(fetchError.message)
      setLoading(false)
      return
    }
    
    setStaff(data || [])
    setLoading(false)
  }

  const filteredStaff = staff.filter(s =>
    s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.staff_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.phone?.includes(searchQuery) ||
    s.zones?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.areas?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return <LoadingPage />
  }

  if (error) {
    return <ErrorMessage message={error} />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Field Staff</h1>
          <p className="text-muted-foreground">Manage field team and assignments</p>
        </div>
        <Link href="/management/field-staff/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Field Staff
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Staff</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staff.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Field staff members</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Staff</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {staff.filter(s => s.is_active).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Currently active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inactive Staff</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {staff.filter(s => !s.is_active).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Not currently active</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Field Staff</CardTitle>
              <CardDescription>{filteredStaff.length} staff members found</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search staff..."
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Zone/Area</TableHead>
                <TableHead>Joining Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No field staff found. Add your first staff member to get started.
                  </TableCell>
                </TableRow>
              ) : (
                filteredStaff.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.staff_code}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{member.full_name}</p>
                        {member.email && (
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{member.phone}</TableCell>
                    <TableCell className="text-sm">{member.designation || '-'}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {member.zones && (
                          <p className="text-sm font-medium">{member.zones.name}</p>
                        )}
                        {member.areas && (
                          <p className="text-xs text-muted-foreground">{member.areas.name}</p>
                        )}
                        {!member.zones && !member.areas && (
                          <p className="text-sm text-muted-foreground">-</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {member.joining_date ? new Date(member.joining_date).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={member.is_active ? 'default' : 'secondary'}>
                        {member.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Link href={`/management/field-staff/${member.id}/edit`}>
                          <Button variant="ghost" size="icon" title="Edit">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <a href={`tel:${member.phone}`}>
                          <Button variant="ghost" size="icon" title="Call">
                            <Phone className="h-4 w-4" />
                          </Button>
                        </a>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
