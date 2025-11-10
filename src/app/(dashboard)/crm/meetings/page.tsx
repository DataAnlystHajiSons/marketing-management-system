"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Calendar, MapPin, Users } from "lucide-react"

interface Meeting {
  id: string
  code: string
  title: string
  type: string
  date: string
  venue: string
  city: string
  invitees: number
  attendees: number
  status: string
  organizer: string
}

const mockMeetings: Meeting[] = [
  {
    id: '1',
    code: 'MTG-001',
    title: 'Farmer Meeting - Faisalabad Region',
    type: 'Farmer Meeting',
    date: '2024-11-05',
    venue: 'Community Center',
    city: 'Faisalabad',
    invitees: 500,
    attendees: 0,
    status: 'planned',
    organizer: 'Marketing Team'
  },
  {
    id: '2',
    code: 'MTG-002',
    title: 'Product Demonstration - Cotton Seeds',
    type: 'Product Launch',
    date: '2024-10-30',
    venue: 'Agricultural Hall',
    city: 'Multan',
    invitees: 200,
    attendees: 0,
    status: 'planned',
    organizer: 'Event Team'
  },
  {
    id: '3',
    code: 'MTG-003',
    title: 'Seasonal Planning Meeting',
    type: 'Planning Meeting',
    date: '2024-10-20',
    venue: 'Serena Hotel',
    city: 'Lahore',
    invitees: 150,
    attendees: 142,
    status: 'completed',
    organizer: 'Sarah Ali'
  },
]

const statusColors: Record<string, string> = {
  planned: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-amber-100 text-amber-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default function MeetingsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [meetings] = useState<Meeting[]>(mockMeetings)

  const filteredMeetings = meetings.filter(meeting =>
    meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    meeting.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    meeting.city.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Meetings</h1>
          <p className="text-muted-foreground">Manage farmer meetings and track attendance</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Meeting
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Meetings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{meetings.length}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {meetings.filter(m => m.status === 'planned').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Scheduled</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Invitees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {meetings.reduce((sum, m) => sum + m.invitees, 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">All meetings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {meetings.filter(m => m.attendees > 0).length > 0
                ? Math.round((meetings.filter(m => m.attendees > 0).reduce((sum, m) => sum + (m.attendees / m.invitees * 100), 0) /
                  meetings.filter(m => m.attendees > 0).length))
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Attendance rate</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Meetings</CardTitle>
              <CardDescription>{filteredMeetings.length} meetings found</CardDescription>
            </div>
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search meetings..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredMeetings.map((meeting) => (
              <Card key={meeting.id}>
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{meeting.title}</h3>
                      <Badge className={statusColors[meeting.status]}>
                        {meeting.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(meeting.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{meeting.venue}, {meeting.city}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>
                          {meeting.attendees > 0
                            ? `${meeting.attendees}/${meeting.invitees} attended`
                            : `${meeting.invitees} invited`
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline">View Details</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
