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
import { Plus, Search, Filter, Phone, User, Building2 } from "lucide-react"

interface Call {
  id: string
  date: string
  time: string
  stakeholderType: 'farmer' | 'dealer' | 'field_staff'
  stakeholderName: string
  phone: string
  purpose: string
  status: string
  duration: number
  caller: string
  notes: string
}

const mockCalls: Call[] = [
  {
    id: '1',
    date: '2024-10-28',
    time: '10:30 AM',
    stakeholderType: 'farmer',
    stakeholderName: 'Ali Hassan',
    phone: '0300-1234567',
    purpose: 'Meeting Follow-up',
    status: 'completed',
    duration: 15,
    caller: 'Sarah Ali',
    notes: 'Confirmed interest in cotton seeds'
  },
  {
    id: '2',
    date: '2024-10-28',
    time: '11:15 AM',
    stakeholderType: 'dealer',
    stakeholderName: 'Green Valley Traders',
    phone: '0300-1111222',
    purpose: 'Weekly Review',
    status: 'completed',
    duration: 25,
    caller: 'Ahmed Khan',
    notes: 'Discussed monthly targets'
  },
  {
    id: '3',
    date: '2024-10-28',
    time: '02:00 PM',
    stakeholderType: 'farmer',
    stakeholderName: 'Muhammad Akram',
    phone: '0301-9876543',
    purpose: 'Visit Schedule',
    status: 'completed',
    duration: 10,
    caller: 'Sarah Ali',
    notes: 'Scheduled visit for next week'
  },
]

const statusColors: Record<string, string> = {
  completed: 'bg-green-100 text-green-800',
  no_answer: 'bg-amber-100 text-amber-800',
  busy: 'bg-blue-100 text-blue-800',
  callback_requested: 'bg-purple-100 text-purple-800',
}

export default function CallsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [calls] = useState<Call[]>(mockCalls)

  const filteredCalls = calls.filter(call =>
    call.stakeholderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    call.phone.includes(searchQuery) ||
    call.purpose.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Calls Log</h1>
          <p className="text-muted-foreground">Track all communication with farmers, dealers, and field staff</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Log Call
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Calls Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calls.length}</div>
            <p className="text-xs text-muted-foreground mt-1">All stakeholders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {calls.filter(c => c.status === 'completed').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Successful calls</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(calls.reduce((sum, c) => sum + c.duration, 0) / calls.length)} min
            </div>
            <p className="text-xs text-muted-foreground mt-1">Per call</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Follow-ups Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">0</div>
            <p className="text-xs text-muted-foreground mt-1">Requires action</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Calls</CardTitle>
              <CardDescription>{filteredCalls.length} calls found</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search calls..."
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
                <TableHead>Date & Time</TableHead>
                <TableHead>Stakeholder</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Caller</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCalls.map((call) => (
                <TableRow key={call.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{new Date(call.date).toLocaleDateString()}</p>
                      <p className="text-xs text-muted-foreground">{call.time}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {call.stakeholderType === 'farmer' && <User className="h-4 w-4 text-blue-500" />}
                      {call.stakeholderType === 'dealer' && <Building2 className="h-4 w-4 text-green-500" />}
                      {call.stakeholderType === 'field_staff' && <User className="h-4 w-4 text-purple-500" />}
                      <div>
                        <p className="text-sm font-medium">{call.stakeholderName}</p>
                        <p className="text-xs text-muted-foreground capitalize">{call.stakeholderType.replace('_', ' ')}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{call.phone}</TableCell>
                  <TableCell className="text-sm">{call.purpose}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[call.status]}>
                      {call.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{call.duration} min</TableCell>
                  <TableCell className="text-sm">{call.caller}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{call.notes}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
