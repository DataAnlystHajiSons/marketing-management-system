"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Calendar as CalendarIcon, MapPin, Users } from "lucide-react"

interface Event {
  id: string
  code: string
  name: string
  type: string
  startDate: string
  endDate: string
  venue: string
  city: string
  status: string
  expectedAttendees: number
  actualAttendees: number
  budget: number
  organizer: string
}

const mockEvents: Event[] = [
  {
    id: '1',
    code: 'EVT-001',
    name: 'Farmer Meeting - Faisalabad Zone',
    type: 'Farmer Meeting',
    startDate: '2024-11-05',
    endDate: '2024-11-05',
    venue: 'Grand Hall, Faisalabad',
    city: 'Faisalabad',
    status: 'planning',
    expectedAttendees: 500,
    actualAttendees: 0,
    budget: 250000,
    organizer: 'Event Team'
  },
  {
    id: '2',
    code: 'EVT-002',
    name: 'Dealer Conference 2024',
    type: 'Dealer Conference',
    startDate: '2024-11-15',
    endDate: '2024-11-16',
    venue: 'Pearl Continental Hotel',
    city: 'Lahore',
    status: 'approved',
    expectedAttendees: 200,
    actualAttendees: 0,
    budget: 800000,
    organizer: 'Marketing Team'
  },
  {
    id: '3',
    code: 'EVT-003',
    name: 'Product Launch - Cotton Seeds',
    type: 'Product Launch',
    startDate: '2024-10-20',
    endDate: '2024-10-20',
    venue: 'Serena Hotel',
    city: 'Islamabad',
    status: 'completed',
    expectedAttendees: 150,
    actualAttendees: 142,
    budget: 500000,
    organizer: 'Product Team'
  },
]

const statusColors: Record<string, string> = {
  planning: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  in_progress: 'bg-amber-100 text-amber-800',
  completed: 'bg-slate-100 text-slate-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default function EventsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [events] = useState<Event[]>(mockEvents)

  const filteredEvents = events.filter(event =>
    event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.city.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Events</h1>
          <p className="text-muted-foreground">360° event management and coordination</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Event
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {events.filter(e => ['planning', 'approved'].includes(e.status)).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">In pipeline</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {events.filter(e => e.status === 'completed').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Successfully done</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              PKR {(events.reduce((sum, e) => sum + e.budget, 0) / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-muted-foreground mt-1">Allocated</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Events</CardTitle>
            </div>
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredEvents.map((event) => (
              <Card key={event.id}>
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{event.name}</h3>
                      <Badge className={statusColors[event.status]}>
                        {event.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4" />
                        <span>{new Date(event.startDate).toLocaleDateString()}</span>
                        {event.startDate !== event.endDate && (
                          <span>- {new Date(event.endDate).toLocaleDateString()}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{event.venue}, {event.city}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>
                          {event.actualAttendees > 0 
                            ? `${event.actualAttendees}/${event.expectedAttendees} attendees`
                            : `${event.expectedAttendees} expected`
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-sm font-medium">PKR {(event.budget / 1000).toFixed(0)}K</p>
                      <p className="text-xs text-muted-foreground">Budget</p>
                    </div>
                    <Button variant="outline">View Details</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
