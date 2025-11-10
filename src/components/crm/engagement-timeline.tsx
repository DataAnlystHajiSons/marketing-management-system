"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { engagementHistoryAPI, type EngagementHistoryWithContext } from "@/lib/supabase/engagement-history"
import { formatDistanceToNow } from "date-fns"
import { Calendar, User } from "lucide-react"

interface EngagementTimelineProps {
  engagementId?: string
  farmerId?: string
  title?: string
  maxEntries?: number
}

const colorClasses: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-800 border-blue-200',
  purple: 'bg-purple-100 text-purple-800 border-purple-200',
  green: 'bg-green-100 text-green-800 border-green-200',
  emerald: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  slate: 'bg-slate-100 text-slate-800 border-slate-200',
  indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  gray: 'bg-gray-100 text-gray-800 border-gray-200',
  cyan: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  violet: 'bg-violet-100 text-violet-800 border-violet-200',
  fuchsia: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
  pink: 'bg-pink-100 text-pink-800 border-pink-200',
  amber: 'bg-amber-100 text-amber-800 border-amber-200',
  red: 'bg-red-100 text-red-800 border-red-200',
  orange: 'bg-orange-100 text-orange-800 border-orange-200',
}

export function EngagementTimeline({ 
  engagementId, 
  farmerId, 
  title = "Engagement Timeline",
  maxEntries 
}: EngagementTimelineProps) {
  const [history, setHistory] = useState<EngagementHistoryWithContext[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true)
      setError(null)

      let result
      if (engagementId) {
        result = await engagementHistoryAPI.getByEngagementId(engagementId)
      } else if (farmerId) {
        result = await engagementHistoryAPI.getByFarmerId(farmerId)
      } else {
        setError('Either engagementId or farmerId must be provided')
        setLoading(false)
        return
      }

      if (result.error) {
        setError(result.error.message)
      } else {
        const data = maxEntries 
          ? result.data?.slice(0, maxEntries) || []
          : result.data || []
        setHistory(data)
      }

      setLoading(false)
    }

    fetchHistory()
  }, [engagementId, farmerId, maxEntries])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">Error loading timeline: {error}</p>
        </CardContent>
      </Card>
    )
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Track all changes and updates to this engagement</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No history available yet
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          Complete history of all changes and updates ({history.length} {history.length === 1 ? 'entry' : 'entries'})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[15px] top-2 bottom-2 w-[2px] bg-border" />

          {/* Timeline entries */}
          <div className="space-y-6">
            {history.map((entry, index) => (
              <div key={entry.id} className="relative pl-10">
                {/* Timeline dot */}
                <div 
                  className={`absolute left-0 top-1 w-8 h-8 rounded-full border-4 border-background flex items-center justify-center text-lg ${
                    colorClasses[entry.display_color] || colorClasses.gray
                  }`}
                >
                  {entry.display_icon}
                </div>

                {/* Entry content */}
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {entry.display_text}
                      </p>
                      
                      {entry.change_reason && entry.field_changed !== 'created' && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {entry.change_reason}
                        </p>
                      )}

                      {/* Show old -> new values for debugging/transparency */}
                      {entry.old_value && entry.new_value && entry.field_changed !== 'created' && (
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs font-mono">
                            {entry.old_value}
                          </Badge>
                          <span className="text-xs text-muted-foreground">→</span>
                          <Badge variant="outline" className="text-xs font-mono">
                            {entry.new_value}
                          </Badge>
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <Badge variant="secondary" className="text-xs">
                        {formatDistanceToNow(new Date(entry.changed_at), { addSuffix: true })}
                      </Badge>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(entry.changed_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    
                    {entry.changed_by_user && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {entry.changed_by_user.full_name || entry.changed_by_user.email}
                      </div>
                    )}
                  </div>

                  {/* Additional metadata if present */}
                  {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                    <details className="text-xs text-muted-foreground mt-2">
                      <summary className="cursor-pointer hover:text-foreground">
                        Additional details
                      </summary>
                      <pre className="mt-1 p-2 bg-muted rounded text-[10px] overflow-auto">
                        {JSON.stringify(entry.metadata, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
