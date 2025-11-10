"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Phone, 
  Clock, 
  User, 
  Calendar,
  MessageSquare,
  Filter,
  Download,
  Search,
  CheckCircle2,
  XCircle,
  PhoneOff,
  PhoneMissed,
  AlertCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { format, formatDistanceToNow } from 'date-fns'

interface CallLog {
  id: string
  call_date: string
  call_duration_seconds: number
  call_purpose: string
  call_status: string
  notes: string
  follow_up_required: boolean
  follow_up_date: string | null
  created_at: string
  caller: {
    id: string
    full_name: string
    email: string
  }
}

interface CallHistoryProps {
  dealerId: string
}

export function CallHistory({ dealerId }: CallHistoryProps) {
  const [calls, setCalls] = useState<CallLog[]>([])
  const [filteredCalls, setFilteredCalls] = useState<CallLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    loadCallHistory()
  }, [dealerId])

  useEffect(() => {
    filterCalls()
  }, [calls, searchTerm, statusFilter])

  const loadCallHistory = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('calls_log')
        .select(`
          *,
          caller:user_profiles!caller_id(id, full_name, email)
        `)
        .eq('stakeholder_type', 'dealer')
        .eq('stakeholder_id', dealerId)
        .order('call_date', { ascending: false })

      if (error) throw error
      setCalls(data || [])
    } catch (error) {
      console.error('Error loading call history:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterCalls = () => {
    let filtered = [...calls]

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(call => call.call_status === statusFilter)
    }

    // Filter by search term (notes or purpose)
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(call => 
        call.notes?.toLowerCase().includes(term) ||
        call.call_purpose?.toLowerCase().includes(term)
      )
    }

    setFilteredCalls(filtered)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'no_answer':
        return <PhoneMissed className="h-4 w-4 text-yellow-600" />
      case 'busy':
        return <PhoneOff className="h-4 w-4 text-orange-600" />
      case 'callback_requested':
        return <AlertCircle className="h-4 w-4 text-blue-600" />
      default:
        return <XCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      completed: 'default',
      no_answer: 'secondary',
      busy: 'secondary',
      callback_requested: 'outline',
      wrong_number: 'destructive'
    }
    
    return (
      <Badge variant={variants[status] || 'secondary'} className="capitalize">
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  const formatDuration = (seconds: number) => {
    if (!seconds) return 'N/A'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
  }

  const formatPurpose = (purpose: string) => {
    return purpose.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const exportToCSV = () => {
    const headers = ['Date', 'Time', 'Caller', 'Purpose', 'Status', 'Duration', 'Notes', 'Follow-up Required', 'Follow-up Date']
    const rows = filteredCalls.map(call => [
      format(new Date(call.call_date), 'yyyy-MM-dd'),
      format(new Date(call.call_date), 'HH:mm'),
      call.caller.full_name,
      formatPurpose(call.call_purpose),
      call.call_status,
      formatDuration(call.call_duration_seconds),
      call.notes || '',
      call.follow_up_required ? 'Yes' : 'No',
      call.follow_up_date || ''
    ])

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `call-history-${dealerId}-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Call History</CardTitle>
          <CardDescription>Loading call history...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Loading...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Call History</CardTitle>
            <CardDescription>
              {calls.length} total call{calls.length !== 1 ? 's' : ''} recorded
            </CardDescription>
          </div>
          {calls.length > 0 && (
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          )}
        </div>

        {/* Filters */}
        {calls.length > 0 && (
          <div className="flex gap-4 mt-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notes or purpose..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="no_answer">No Answer</option>
              <option value="busy">Busy</option>
              <option value="callback_requested">Callback Requested</option>
              <option value="wrong_number">Wrong Number</option>
            </select>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {filteredCalls.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">
              {calls.length === 0 ? 'No calls recorded yet' : 'No calls match your filters'}
            </p>
            <p className="text-sm mt-2">
              {calls.length === 0 
                ? 'Call logs will appear here after you log your first call'
                : 'Try adjusting your search or filters'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredCalls.map((call, index) => (
              <div key={call.id} className="relative">
                {/* Timeline connector */}
                {index < filteredCalls.length - 1 && (
                  <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-border" />
                )}

                <div className="flex gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-muted flex items-center justify-center relative z-10">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-8">
                    <div className="bg-muted/50 rounded-lg p-4 border">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">
                              {formatPurpose(call.call_purpose)}
                            </h4>
                            {getStatusBadge(call.call_status)}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{format(new Date(call.call_date), 'MMM d, yyyy')}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{format(new Date(call.call_date), 'h:mm a')}</span>
                            </div>
                            {call.call_duration_seconds > 0 && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                <span>{formatDuration(call.call_duration_seconds)}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(call.call_date), { addSuffix: true })}
                        </div>
                      </div>

                      {/* Notes */}
                      {call.notes && (
                        <div className="mb-3 p-3 bg-background rounded border">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <p className="text-sm whitespace-pre-wrap">{call.notes}</p>
                          </div>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>{call.caller.full_name}</span>
                        </div>

                        {call.follow_up_required && call.follow_up_date && (
                          <Badge variant="outline" className="text-xs">
                            📅 Follow-up: {format(new Date(call.follow_up_date), 'MMM d, yyyy')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
