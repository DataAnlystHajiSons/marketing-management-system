"use client"

import { useState } from "react"
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
import { Plus, Search, Filter } from "lucide-react"

interface Complaint {
  id: string
  number: string
  subject: string
  complainant: string
  type: string
  category: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: string
  assignedTo: string
  registeredDate: string
}

const mockComplaints: Complaint[] = [
  {
    id: '1',
    number: 'CMP-24-000001',
    subject: 'Product Quality Issue - Cotton Seeds',
    complainant: 'Ali Hassan (Farmer)',
    type: 'farmer',
    category: 'Product Quality',
    priority: 'high',
    status: 'in_progress',
    assignedTo: 'Sarah Ali',
    registeredDate: '2024-10-26'
  },
  {
    id: '2',
    number: 'CMP-24-000002',
    subject: 'Delayed Delivery',
    complainant: 'Green Valley Traders (Dealer)',
    type: 'dealer',
    category: 'Delivery Problem',
    priority: 'medium',
    status: 'assigned',
    assignedTo: 'Ahmed Khan',
    registeredDate: '2024-10-25'
  },
  {
    id: '3',
    number: 'CMP-24-000003',
    subject: 'Pricing Dispute',
    complainant: 'Tariq Mahmood (Dealer)',
    type: 'dealer',
    category: 'Pricing Dispute',
    priority: 'low',
    status: 'resolved',
    assignedTo: 'Imran Ali',
    registeredDate: '2024-10-20'
  },
]

const priorityColors: Record<string, string> = {
  low: 'secondary',
  medium: 'warning',
  high: 'destructive',
  critical: 'destructive',
}

const statusColors: Record<string, string> = {
  registered: 'bg-slate-100 text-slate-800',
  assigned: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-amber-100 text-amber-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
  rejected: 'bg-red-100 text-red-800',
}

export default function ComplaintsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [complaints] = useState<Complaint[]>(mockComplaints)

  const filteredComplaints = complaints.filter(complaint =>
    complaint.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    complaint.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    complaint.complainant.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Complaints</h1>
          <p className="text-muted-foreground">Track and resolve customer complaints</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Register Complaint
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Complaints</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{complaints.length}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {complaints.filter(c => c.status === 'in_progress').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Being handled</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {complaints.filter(c => c.status === 'resolved').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Successfully resolved</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Critical</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {complaints.filter(c => c.priority === 'critical').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Urgent attention</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Complaints</CardTitle>
              <CardDescription>{filteredComplaints.length} complaints found</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search complaints..."
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
                <TableHead>Complaint #</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Complainant</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredComplaints.map((complaint) => (
                <TableRow key={complaint.id}>
                  <TableCell className="font-medium">{complaint.number}</TableCell>
                  <TableCell className="max-w-xs truncate">{complaint.subject}</TableCell>
                  <TableCell>{complaint.complainant}</TableCell>
                  <TableCell>{complaint.category}</TableCell>
                  <TableCell>
                    <Badge variant={priorityColors[complaint.priority] as any}>
                      {complaint.priority.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[complaint.status]}>
                      {complaint.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>{complaint.assignedTo}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(complaint.registeredDate).toLocaleDateString()}
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
