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
import { Plus, Search, Filter, MapPin, CheckCircle, XCircle } from "lucide-react"

interface Visit {
  id: string
  date: string
  farmerName: string
  farmerPhone: string
  fieldStaff: string
  visitType: string
  purpose: string
  outcome: string
  isSuccessful: boolean
  nextAction: string
  nextVisitDate: string
}

const mockVisits: Visit[] = [
  {
    id: '1',
    date: '2024-10-25',
    farmerName: 'Ali Hassan',
    farmerPhone: '0300-1234567',
    fieldStaff: 'Ahmed Khan',
    visitType: 'Follow-up',
    purpose: 'Product demonstration',
    outcome: 'Farmer interested in BT Cotton seeds',
    isSuccessful: true,
    nextAction: 'Follow up call in 3 days',
    nextVisitDate: '2024-11-01'
  },
  {
    id: '2',
    date: '2024-10-26',
    farmerName: 'Muhammad Akram',
    farmerPhone: '0301-9876543',
    fieldStaff: 'Imran Ali',
    visitType: 'Technical',
    purpose: 'Soil testing consultation',
    outcome: 'Provided soil testing recommendations',
    isSuccessful: true,
    nextAction: 'Revisit after soil test results',
    nextVisitDate: '2024-11-10'
  },
  {
    id: '3',
    date: '2024-10-27',
    farmerName: 'Rashid Mahmood',
    farmerPhone: '0303-4567890',
    fieldStaff: 'Ahmed Khan',
    visitType: 'Sales',
    purpose: 'Product purchase discussion',
    outcome: 'Farmer needs more time to decide',
    isSuccessful: false,
    nextAction: 'Follow up after harvest season',
    nextVisitDate: '2024-12-01'
  },
]

export default function VisitsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [visits] = useState<Visit[]>(mockVisits)

  const filteredVisits = visits.filter(visit =>
    visit.farmerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    visit.farmerPhone.includes(searchQuery) ||
    visit.fieldStaff.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Visits</h1>
          <p className="text-muted-foreground">Track field visits and farmer interactions</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Schedule Visit
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Visits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{visits.length}</div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Successful</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {visits.filter(v => v.isSuccessful).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round((visits.filter(v => v.isSuccessful).length / visits.length) * 100)}% success rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Follow-up</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {visits.filter(v => v.nextVisitDate).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Scheduled</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Field Staff Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(visits.map(v => v.fieldStaff)).size}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Team members</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Visits</CardTitle>
              <CardDescription>{filteredVisits.length} visits found</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search visits..."
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
                <TableHead>Date</TableHead>
                <TableHead>Farmer</TableHead>
                <TableHead>Field Staff</TableHead>
                <TableHead>Visit Type</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Success</TableHead>
                <TableHead>Outcome</TableHead>
                <TableHead>Next Visit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVisits.map((visit) => (
                <TableRow key={visit.id}>
                  <TableCell className="text-sm">{new Date(visit.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{visit.farmerName}</p>
                      <p className="text-xs text-muted-foreground">{visit.farmerPhone}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{visit.fieldStaff}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{visit.visitType}</Badge>
                  </TableCell>
                  <TableCell className="text-sm max-w-xs truncate">{visit.purpose}</TableCell>
                  <TableCell>
                    {visit.isSuccessful ? (
                      <Badge variant="success" className="gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Yes
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <XCircle className="h-3 w-3" />
                        No
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm max-w-xs truncate">{visit.outcome}</TableCell>
                  <TableCell className="text-sm">
                    {visit.nextVisitDate ? new Date(visit.nextVisitDate).toLocaleDateString() : '-'}
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
