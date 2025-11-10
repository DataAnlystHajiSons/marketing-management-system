"use client"

import { useState } from "react"
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
import { Plus, Search, Filter, Phone } from "lucide-react"

interface FieldStaff {
  id: string
  code: string
  name: string
  phone: string
  email: string
  zone: string
  area: string
  designation: string
  assignedDealers: number
  activeFarmers: number
  isActive: boolean
  joiningDate: string
}

const mockFieldStaff: FieldStaff[] = [
  {
    id: '1',
    code: 'FS-001',
    name: 'Ahmed Khan',
    phone: '0300-1111111',
    email: 'ahmed.khan@company.com',
    zone: 'Central',
    area: 'Faisalabad',
    designation: 'Senior Field Officer',
    assignedDealers: 15,
    activeFarmers: 250,
    isActive: true,
    joiningDate: '2022-01-15'
  },
  {
    id: '2',
    code: 'FS-002',
    name: 'Imran Ali',
    phone: '0301-2222222',
    email: 'imran.ali@company.com',
    zone: 'South',
    area: 'Multan',
    designation: 'Field Officer',
    assignedDealers: 12,
    activeFarmers: 180,
    isActive: true,
    joiningDate: '2022-06-10'
  },
  {
    id: '3',
    code: 'FS-003',
    name: 'Hassan Raza',
    phone: '0303-3333333',
    email: 'hassan.raza@company.com',
    zone: 'North',
    area: 'Lahore',
    designation: 'Field Officer',
    assignedDealers: 18,
    activeFarmers: 320,
    isActive: true,
    joiningDate: '2021-09-20'
  },
]

export default function FieldStaffPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [staff] = useState<FieldStaff[]>(mockFieldStaff)

  const filteredStaff = staff.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.phone.includes(searchQuery) ||
    s.area.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Field Staff</h1>
          <p className="text-muted-foreground">Manage field team and assignments</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Field Staff
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Staff</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staff.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Active members</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Dealers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {staff.reduce((sum, s) => sum + s.assignedDealers, 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Assigned</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Farmers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {staff.reduce((sum, s) => sum + s.activeFarmers, 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Active connections</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg per Staff</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(staff.reduce((sum, s) => sum + s.activeFarmers, 0) / staff.length)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Farmers each</p>
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
                <TableHead>Dealers</TableHead>
                <TableHead>Farmers</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.code}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{member.phone}</TableCell>
                  <TableCell className="text-sm">{member.designation}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{member.zone}</p>
                      <p className="text-xs text-muted-foreground">{member.area}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-medium">{member.assignedDealers}</TableCell>
                  <TableCell className="text-sm font-medium">{member.activeFarmers}</TableCell>
                  <TableCell>
                    <Badge variant={member.isActive ? 'success' : 'secondary'}>
                      {member.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon">
                      <Phone className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
