"use client"

import { use, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Phone, Edit, MapPin, User, TrendingUp, Calendar, ShoppingCart, Package, CheckCircle2, XCircle } from "lucide-react"
import { useFarmer } from "@/hooks/use-farmers"
import { useFarmerActivities } from "@/hooks/use-farmer-activities"
import { useFarmerEngagements } from "@/hooks/use-farmer-engagements"
import { LoadingPage } from "@/components/ui/loading-spinner"
import { ErrorMessage } from "@/components/ui/error-message"
import { StageChangeSelect } from "@/components/crm/stage-change-select"
import { EngagementTimeline } from "@/components/crm/engagement-timeline"

type LeadStage = 'new' | 'contacted' | 'qualified' | 'meeting_invited' | 'meeting_attended' | 'visit_scheduled' | 'visit_completed' | 'interested' | 'negotiation' | 'converted' | 'active_customer' | 'inactive' | 'lost' | 'rejected'

const stageColors: Record<string, string> = {
  new: 'bg-slate-100 text-slate-800',
  contacted: 'bg-blue-100 text-blue-800',
  qualified: 'bg-cyan-100 text-cyan-800',
  meeting_invited: 'bg-indigo-100 text-indigo-800',
  meeting_attended: 'bg-purple-100 text-purple-800',
  visit_scheduled: 'bg-violet-100 text-violet-800',
  visit_completed: 'bg-fuchsia-100 text-fuchsia-800',
  interested: 'bg-pink-100 text-pink-800',
  negotiation: 'bg-amber-100 text-amber-800',
  converted: 'bg-green-100 text-green-800',
  active_customer: 'bg-emerald-100 text-emerald-800',
  inactive: 'bg-gray-100 text-gray-800',
  lost: 'bg-red-100 text-red-800',
  rejected: 'bg-orange-100 text-orange-800',
}

const stageLabels: Record<LeadStage, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  meeting_invited: 'Meeting Invited',
  meeting_attended: 'Meeting Attended',
  visit_scheduled: 'Visit Scheduled',
  visit_completed: 'Visit Completed',
  interested: 'Interested',
  negotiation: 'Negotiation',
  converted: 'Converted',
  active_customer: 'Active Customer',
  inactive: 'Inactive',
  lost: 'Lost',
  rejected: 'Rejected',
}

export default function FarmerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { farmer, loading, error } = useFarmer(id)
  const { activities, activitiesLoading } = useFarmerActivities(id)
  const { engagements, loading: engagementsLoading, refresh: refreshEngagements } = useFarmerEngagements({ farmer_id: id })
  
  if (loading) return <LoadingPage />
  if (error) return <ErrorMessage message={error} />
  if (!farmer) return <ErrorMessage message="Farmer not found" />

  // Calculate derived values from engagements
  const activeEngagements = engagements.filter(e => e.is_active)
  const convertedEngagements = engagements.filter(e => e.is_converted)
  
  // Get highest lead score across all active engagements
  const highestScore = activeEngagements.length > 0 
    ? Math.max(...activeEngagements.map(e => e.lead_score))
    : farmer.lead_score
  
  // Get best quality across active engagements (hot > warm > cold)
  const qualityPriority: { [key: string]: number } = { hot: 3, warm: 2, cold: 1 }
  const bestQuality = activeEngagements.length > 0
    ? activeEngagements.reduce((best, eng) => 
        (qualityPriority[eng.lead_quality] || 0) > (qualityPriority[best] || 0) ? eng.lead_quality : best
      , 'cold' as string)
    : farmer.lead_quality
  
  // Total interactions from all activities
  const totalInteractions = activities.length
  
  // Calculate days since last contact from activities
  const daysSinceLastContact = activities.length > 0
    ? Math.floor((Date.now() - new Date((activities[0] as any).activity_date || (activities[0] as any).date || activities[0].created_at).getTime()) / (1000 * 60 * 60 * 24))
    : null
  
  // Total purchases from engagements
  const totalPurchases = engagements.reduce((sum, eng) => sum + (eng.total_purchases || 0), 0)
  
  const stageColors: Record<string, string> = {
    new: 'bg-slate-100 text-slate-800',
    contacted: 'bg-blue-100 text-blue-800',
    meeting_attended: 'bg-purple-100 text-purple-800',
    visit_scheduled: 'bg-violet-100 text-violet-800',
    converted: 'bg-green-100 text-green-800',
    active_customer: 'bg-emerald-100 text-emerald-800',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/crm/farmers">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{farmer.full_name}</h1>
            <p className="text-muted-foreground">{farmer.farmer_code || 'N/A'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Phone className="mr-2 h-4 w-4" />
            Call
          </Button>
          <Link href={`/crm/farmers/${id}/edit`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Interactions
            </CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInteractions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Last contact: {daysSinceLastContact !== null ? `${daysSinceLastContact} days ago` : 'Never'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Highest Lead Score
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highestScore}/100</div>
            <div className="text-xs text-muted-foreground mt-1">
              Quality: <Badge 
                variant={bestQuality === 'hot' ? 'destructive' : bestQuality === 'warm' ? 'default' : 'secondary'} 
                className="ml-1"
              >
                {bestQuality.toUpperCase()}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Land Size
            </CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{farmer.land_size_acres || 0} Acres</div>
            <p className="text-xs text-muted-foreground mt-1">
              {farmer.primary_crops?.join(', ') || 'No crops specified'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Products
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeEngagements.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {convertedEngagements.length} converted
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Farmer Profile</CardTitle>
            <CardDescription>Personal and farming details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Phone</p>
                <p className="text-sm font-medium">{farmer.phone}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Alternate Phone</p>
                <p className="text-sm">{farmer.alternate_phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-sm">{farmer.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Land Size</p>
                <p className="text-sm font-medium">{farmer.land_size_acres || 0} Acres</p>
              </div>
            </div>

            {/* Hierarchical Location */}
            <div className="border-t pt-4">
              <p className="text-sm font-semibold text-muted-foreground mb-3">Location</p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Zone/Province</p>
                  <p className="text-sm font-medium">{farmer.zone?.name || 'N/A'}</p>
                  {farmer.zone?.code && (
                    <p className="text-xs text-muted-foreground">Code: {farmer.zone.code}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Area/District</p>
                  <p className="text-sm font-medium">{farmer.area?.name || 'N/A'}</p>
                  {farmer.area?.code && (
                    <p className="text-xs text-muted-foreground">Code: {farmer.area.code}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Village/Town</p>
                  <p className="text-sm font-medium">{farmer.village?.name || 'N/A'}</p>
                  {farmer.village?.code && (
                    <p className="text-xs text-muted-foreground">Code: {farmer.village.code}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Farming Details */}
            <div className="border-t pt-4">
              <p className="text-sm font-semibold text-muted-foreground mb-3">Farming Details</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Primary Crops</p>
                  <p className="text-sm">{farmer.primary_crops?.join(', ') || 'No crops specified'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Customer Status</p>
                  <Badge variant={farmer.is_customer ? 'default' : 'secondary'}>
                    {farmer.is_customer ? 'Customer' : 'Lead'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Full Address */}
            {farmer.address && (
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-muted-foreground mb-1">Full Address</p>
                <p className="text-sm">{farmer.address}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assignment & Product Stages</CardTitle>
            <CardDescription>Team assignments and engagement stages</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Assigned TMO</p>
                <p className="text-sm">
                  {farmer.assigned_tmo?.full_name || 'Unassigned'}
                  {farmer.assigned_tmo?.email && (
                    <span className="text-muted-foreground text-xs ml-1">
                      ({farmer.assigned_tmo.email})
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Lead Source (Field Staff)</p>
                <p className="text-sm">
                  {farmer.assigned_field_staff?.full_name || 'Not Assigned'}
                  {farmer.assigned_field_staff?.staff_code && (
                    <span className="text-muted-foreground text-xs ml-1">
                      ({farmer.assigned_field_staff.staff_code})
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Assigned Dealer</p>
                <p className="text-sm">
                  {farmer.assigned_dealer?.business_name || 'Not Assigned'}
                  {farmer.assigned_dealer?.dealer_code && (
                    <span className="text-muted-foreground text-xs ml-1">
                      ({farmer.assigned_dealer.dealer_code})
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Registration Date</p>
                <p className="text-sm">{new Date(farmer.registration_date || farmer.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <p className="text-sm font-medium text-muted-foreground mb-3">Product Engagement Stages</p>
              {activeEngagements.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active product engagements</p>
              ) : (
                <div className="space-y-2">
                  {activeEngagements.map((eng) => (
                    <div key={eng.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{eng.product?.product_name || 'General'}</span>
                        <span className="text-xs text-muted-foreground">({eng.season})</span>
                      </div>
                      <Badge className={`${stageColors[eng.lead_stage]} text-xs`}>
                        {stageLabels[eng.lead_stage as LeadStage]}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Customer Status</p>
                  <p className="text-sm mt-1">
                    {farmer.is_customer ? 'Active Customer' : 'Lead'}
                    {farmer.conversion_date && (
                      <span className="text-muted-foreground text-xs ml-2">
                        since {new Date(farmer.conversion_date).toLocaleDateString()}
                      </span>
                    )}
                  </p>
                </div>
                <Badge variant={farmer.is_customer ? 'default' : 'secondary'}>
                  {farmer.is_customer ? 'Converted' : 'Not Converted'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="engagements">
            Product Engagements
            {engagements.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {engagements.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="activities">Activity Timeline</TabsTrigger>
          <TabsTrigger value="engagement-history">
            Engagement History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Summary</CardTitle>
              <CardDescription>Key metrics and statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Active Products</p>
                  <p className="text-2xl font-bold">{engagements.filter(e => e.is_active).length}</p>
                  <p className="text-xs text-muted-foreground">
                    {engagements.filter(e => e.is_converted).length} converted
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Total Activities</p>
                  <p className="text-2xl font-bold">{activities.length}</p>
                  <p className="text-xs text-muted-foreground">
                    All time interactions
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Days in Current Stage</p>
                  <p className="text-2xl font-bold">{farmer.days_in_current_stage || 0}</p>
                  <p className="text-xs text-muted-foreground">
                    Since {farmer.stage_changed_at ? new Date(farmer.stage_changed_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
                <CardDescription>Latest 5 interactions</CardDescription>
              </CardHeader>
              <CardContent>
                {activities.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No activities recorded yet
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activities.slice(0, 5).map((activity) => (
                      <div key={activity.id} className="flex gap-3 border-b pb-3 last:border-0 last:pb-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
                          {activity.type === 'call' && <Phone className="h-4 w-4 text-primary" />}
                          {activity.type === 'meeting' && <Calendar className="h-4 w-4 text-primary" />}
                          {activity.type === 'visit' && <MapPin className="h-4 w-4 text-primary" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium truncate">{activity.title}</p>
                            <p className="text-xs text-muted-foreground whitespace-nowrap">{activity.date}</p>
                          </div>
                          <p className="text-xs text-muted-foreground">{activity.outcome}</p>
                        </div>
                      </div>
                    ))}
                    {activities.length > 5 && (
                      <div className="text-center pt-2">
                        <Link href="#" onClick={(e) => { e.preventDefault(); const tab = document.querySelector('[value="activities"]') as HTMLElement; tab?.click(); }}>
                          <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                            View all {activities.length} activities →
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Product Engagements</CardTitle>
                <CardDescription>Current product journeys</CardDescription>
              </CardHeader>
              <CardContent>
                {engagements.filter(e => e.is_active).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No active product engagements
                  </div>
                ) : (
                  <div className="space-y-3">
                    {engagements.filter(e => e.is_active).map((eng) => (
                      <div key={eng.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium text-sm">{eng.product?.product_name || 'General'}</p>
                            <p className="text-xs text-muted-foreground">{eng.season}</p>
                          </div>
                          {eng.is_converted && (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground mb-1">Score</p>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${
                                    eng.lead_score >= 70 ? 'bg-green-500' :
                                    eng.lead_score >= 40 ? 'bg-amber-500' :
                                    'bg-red-500'
                                  }`}
                                  style={{ width: `${eng.lead_score}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium">{eng.lead_score}</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Stage</p>
                            <Badge className={`${stageColors[eng.lead_stage]} text-xs py-0`}>
                              {stageLabels[eng.lead_stage as LeadStage]?.substring(0, 10)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Pending Follow-ups</CardTitle>
                <CardDescription>Scheduled next actions</CardDescription>
              </CardHeader>
              <CardContent>
                {engagements.filter(e => e.follow_up_required && e.next_follow_up_date).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No pending follow-ups
                  </div>
                ) : (
                  <div className="space-y-3">
                    {engagements
                      .filter(e => e.follow_up_required && e.next_follow_up_date)
                      .sort((a, b) => new Date(a.next_follow_up_date!).getTime() - new Date(b.next_follow_up_date!).getTime())
                      .map((eng) => {
                        const followUpDate = new Date(eng.next_follow_up_date!)
                        const today = new Date()
                        today.setHours(0, 0, 0, 0)
                        const isOverdue = followUpDate < today
                        const isToday = followUpDate.toDateString() === today.toDateString()

                        return (
                          <div key={eng.id} className={`border rounded-lg p-3 ${isOverdue ? 'border-red-200 bg-red-50' : isToday ? 'border-amber-200 bg-amber-50' : ''}`}>
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-sm">{eng.product?.product_name || 'General'}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {followUpDate.toLocaleDateString()} 
                                  {isOverdue && <span className="text-red-600 font-medium ml-2">OVERDUE</span>}
                                  {isToday && <span className="text-amber-600 font-medium ml-2">TODAY</span>}
                                </p>
                                {eng.follow_up_notes && (
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {eng.follow_up_notes}
                                  </p>
                                )}
                              </div>
                              <Calendar className={`h-4 w-4 ${isOverdue ? 'text-red-600' : isToday ? 'text-amber-600' : 'text-muted-foreground'}`} />
                            </div>
                          </div>
                        )
                      })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conversion Status</CardTitle>
                <CardDescription>Purchase history and conversion</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Customer Status</p>
                      <p className="text-lg font-bold mt-1">
                        {farmer.is_customer ? 'Active Customer' : 'Lead'}
                      </p>
                    </div>
                    <Badge variant={farmer.is_customer ? 'default' : 'secondary'} className="text-sm">
                      {farmer.is_customer ? <CheckCircle2 className="h-4 w-4 mr-1" /> : null}
                      {farmer.is_customer ? 'Converted' : 'Not Converted'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Purchases</p>
                      <p className="text-lg font-bold mt-1">
                        PKR {(farmer.total_purchases || 0).toLocaleString()}
                      </p>
                    </div>
                    <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                  </div>

                  {farmer.conversion_date && (
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Conversion Date</p>
                        <p className="text-lg font-bold mt-1">
                          {new Date(farmer.conversion_date).toLocaleDateString()}
                        </p>
                      </div>
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Converted Products</p>
                    {engagements.filter(e => e.is_converted).length === 0 ? (
                      <p className="text-sm text-muted-foreground">No products converted yet</p>
                    ) : (
                      <div className="space-y-2">
                        {engagements.filter(e => e.is_converted).map((eng) => (
                          <div key={eng.id} className="flex items-center justify-between text-sm p-2 bg-green-50 border border-green-200 rounded">
                            <span className="font-medium">{eng.product?.product_name || 'General'}</span>
                            <span className="text-xs text-muted-foreground">
                              {eng.conversion_date && new Date(eng.conversion_date).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="engagements">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Product Engagements
              </CardTitle>
              <CardDescription>
                Track this farmer's journey across different products and seasons
              </CardDescription>
            </CardHeader>
            <CardContent>
              {engagementsLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading engagements...
                </div>
              ) : engagements.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No product engagements found
                </div>
              ) : (
                <div className="space-y-6">
                  {engagements.map((eng) => (
                    <div key={eng.id} className="border rounded-lg p-4 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                            {eng.product?.product_name || 'General Engagement'}
                            {eng.is_converted && (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            )}
                          </h3>
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-muted-foreground">
                              Season: <span className="font-medium">{eng.season}</span>
                            </p>
                            {eng.data_source === 'fm_attendees' && (
                              <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                                🎯 Event Attendee
                              </Badge>
                            )}
                            {eng.data_source === 'fm_invitees' && (
                              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                                ✉️ Event Invitee
                              </Badge>
                            )}
                            {eng.data_source === 'fd_attendees' && (
                              <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-800">
                                🌾 Field Day Attendee
                              </Badge>
                            )}
                            {eng.data_source === 'fd_invitees' && (
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                                🌾 Field Day Invitee
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Badge className={stageColors[eng.lead_stage]}>
                          {stageLabels[eng.lead_stage as any]}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Data Source</p>
                          <p className="text-sm font-medium capitalize">
                            {eng.data_source.replace(/_/g, ' ')}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Lead Score</p>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  eng.lead_score >= 70 ? 'bg-green-500' :
                                  eng.lead_score >= 40 ? 'bg-amber-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${eng.lead_score}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{eng.lead_score}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Quality</p>
                          <Badge
                            variant={
                              eng.lead_quality === 'hot' ? 'destructive' :
                              eng.lead_quality === 'warm' ? 'default' :
                              'secondary'
                            }
                          >
                            {eng.lead_quality.toUpperCase()}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Interactions</p>
                          <p className="text-sm font-medium">{eng.total_interactions}</p>
                        </div>
                      </div>

                      {/* Stage Management */}
                      <div className="border-t pt-4">
                        <StageChangeSelect
                          engagementId={eng.id}
                          currentStage={eng.lead_stage as any}
                          onStageChanged={refreshEngagements}
                          userId={farmer.assigned_tmo?.id}
                        />
                      </div>

                      {eng.is_converted && (
                        <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <div>
                              <p className="text-sm font-medium text-green-900">
                                Converted on {new Date(eng.conversion_date!).toLocaleDateString()}
                              </p>
                              {eng.total_purchases > 0 && (
                                <p className="text-xs text-green-700">
                                  Total purchases: PKR {eng.total_purchases.toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {!eng.is_active && (
                        <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-gray-600" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                Closed: {eng.closure_reason || 'No reason provided'}
                              </p>
                              {eng.closure_date && (
                                <p className="text-xs text-gray-700">
                                  {new Date(eng.closure_date).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {eng.follow_up_required && eng.next_follow_up_date && (
                        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-amber-600" />
                            <div>
                              <p className="text-sm font-medium text-amber-900">
                                Follow-up scheduled for {new Date(eng.next_follow_up_date).toLocaleDateString()}
                              </p>
                              {eng.follow_up_notes && (
                                <p className="text-xs text-amber-700 mt-1">
                                  {eng.follow_up_notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {eng.assigned_tmo && (
                        <div className="text-xs text-muted-foreground">
                          Managed by: <span className="font-medium">{eng.assigned_tmo.full_name}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
              <CardDescription>All interactions with this farmer</CardDescription>
            </CardHeader>
            <CardContent>
              {activitiesLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading activities...
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No activities recorded yet
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex gap-4 border-b pb-4 last:border-0 last:pb-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        {activity.type === 'call' && <Phone className="h-5 w-5 text-primary" />}
                        {activity.type === 'meeting' && <Calendar className="h-5 w-5 text-primary" />}
                        {activity.type === 'visit' && <MapPin className="h-5 w-5 text-primary" />}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{activity.title}</p>
                          <p className="text-xs text-muted-foreground">{activity.date} • {activity.time}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">{activity.performedBy}</p>
                        <p className="text-sm">
                          <span className="font-medium">Outcome:</span> {activity.outcome}
                        </p>
                        <p className="text-sm text-muted-foreground">{activity.notes}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement-history" className="space-y-6">
          <EngagementTimeline 
            farmerId={id}
            title="Engagement History Timeline"
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
