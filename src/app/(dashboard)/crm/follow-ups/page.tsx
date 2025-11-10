"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Phone, 
  MapPin,
  Package,
  User,
  Filter,
  RefreshCw,
  MessageSquare,
} from "lucide-react"
import { farmerEngagementsAPI } from "@/lib/supabase/farmer-engagements"
import { useProducts } from "@/hooks/use-products"
import { usersAPI } from "@/lib/supabase/users"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { LogActivityModal } from "@/components/crm/log-activity-modal"

interface FollowUpEngagement {
  id: string
  farmer_id: string
  product_id: string
  season: string
  lead_stage: string
  lead_score: number
  lead_quality: string
  next_follow_up_date: string
  follow_up_notes?: string
  last_contact_date?: string
  farmer: {
    id: string
    farmer_code: string
    full_name: string
    phone: string
    village?: string
    city?: string
  }
  product: {
    id: string
    product_code: string
    product_name: string
  }
  assigned_tmo?: {
    id: string
    full_name: string
    email: string
  }
}

export default function FollowUpsPage() {
  const [activeTab, setActiveTab] = useState('today')
  const [followUps, setFollowUps] = useState<FollowUpEngagement[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    overdue: 0,
    today: 0,
    thisWeek: 0,
    upcoming: 0,
  })
  
  // Filters
  const [selectedTMO, setSelectedTMO] = useState('')
  const [selectedProduct, setSelectedProduct] = useState('')
  const [selectedSeason, setSelectedSeason] = useState('')
  const [tmos, setTmos] = useState<any[]>([])
  const [seasons, setSeasons] = useState<string[]>([])
  const { products } = useProducts({ activeOnly: true })

  // Log activity modal
  const [logActivityModal, setLogActivityModal] = useState<{
    open: boolean
    farmerId?: string
    farmerName?: string
    engagementId?: string
  }>({ open: false })

  useEffect(() => {
    loadTMOs()
    loadSeasons()
    loadStats()
  }, [])

  useEffect(() => {
    loadFollowUps()
  }, [activeTab, selectedTMO, selectedProduct, selectedSeason])

  const loadTMOs = async () => {
    const { data } = await usersAPI.getByRole('telemarketing_officer')
    if (data) setTmos(data)
  }

  const loadSeasons = async () => {
    const { data } = await farmerEngagementsAPI.getSeasons()
    if (data) setSeasons(data)
  }

  const loadStats = async () => {
    const { data } = await farmerEngagementsAPI.getFollowUpStats(selectedTMO || undefined)
    if (data) setStats(data)
  }

  const loadFollowUps = async () => {
    setLoading(true)
    const { data } = await farmerEngagementsAPI.getFollowUpsDue({
      dueDate: activeTab,
      tmoId: selectedTMO || undefined,
      productId: selectedProduct || undefined,
      season: selectedSeason || undefined,
    })
    
    if (data) {
      setFollowUps(data as FollowUpEngagement[])
    }
    setLoading(false)
  }

  const handleLogActivity = (engagement: FollowUpEngagement) => {
    setLogActivityModal({
      open: true,
      farmerId: engagement.farmer_id,
      farmerName: engagement.farmer.full_name,
      engagementId: engagement.id,
    })
  }

  const handleActivityLogged = async () => {
    // Note: We don't need to do anything here for follow-ups
    // If outcome was "follow_up_scheduled", the modal already set the new follow-up date via setFollowUp()
    // If outcome was anything else, no follow-up fields are set, so we mark it complete
    
    // The activity modal handles follow-up scheduling automatically
    // We just need to refresh the list
    loadFollowUps()
    loadStats()
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const followUpDate = new Date(date)
    followUpDate.setHours(0, 0, 0, 0)
    
    const diffDays = Math.floor((followUpDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays === -1) return 'Yesterday'
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`
    if (diffDays <= 7) return `In ${diffDays} days`
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const getDateBadgeColor = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (date < today) return 'bg-red-100 text-red-800'
    if (date.toDateString() === today.toDateString()) return 'bg-blue-100 text-blue-800'
    return 'bg-amber-100 text-amber-800'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Product Follow-ups</h1>
          <p className="text-muted-foreground">Manage product engagement follow-ups</p>
        </div>
        <Button onClick={() => { loadFollowUps(); loadStats(); }}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">All follow-ups</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-700">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{stats.overdue}</div>
            <p className="text-xs text-red-600 mt-1">Needs immediate attention</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-700">Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{stats.today}</div>
            <p className="text-xs text-blue-600 mt-1">Due today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisWeek}</div>
            <p className="text-xs text-muted-foreground mt-1">Next 7 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcoming}</div>
            <p className="text-xs text-muted-foreground mt-1">Beyond this week</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <CardTitle>Filters</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="tmo">TMO</Label>
              <Select
                id="tmo"
                value={selectedTMO}
                onChange={(e) => setSelectedTMO(e.target.value)}
              >
                <option value="">All TMOs</option>
                {tmos.map((tmo) => (
                  <option key={tmo.id} value={tmo.id}>
                    {tmo.full_name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="product">Product</Label>
              <Select
                id="product"
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
              >
                <option value="">All Products</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.product_name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="season">Season</Label>
              <Select
                id="season"
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(e.target.value)}
              >
                <option value="">All Seasons</option>
                {seasons.map((season) => (
                  <option key={season} value={season}>
                    {season}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2 flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedTMO('')
                  setSelectedProduct('')
                  setSelectedSeason('')
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Follow-ups Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overdue">
            Overdue
            {stats.overdue > 0 && (
              <Badge variant="destructive" className="ml-2">
                {stats.overdue}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="today">
            Today
            {stats.today > 0 && (
              <Badge variant="default" className="ml-2">
                {stats.today}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="this_week">
            This Week
            {stats.thisWeek > 0 && (
              <Badge variant="secondary" className="ml-2">
                {stats.thisWeek}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="">All</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : followUps.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No follow-ups found</p>
                  <p className="text-sm mt-1">
                    {activeTab === 'today' && "Great! You don't have any follow-ups due today."}
                    {activeTab === 'overdue' && "Excellent! No overdue follow-ups."}
                    {activeTab === 'this_week' && "No follow-ups scheduled for this week."}
                    {activeTab === 'upcoming' && "No upcoming follow-ups scheduled."}
                    {activeTab === '' && "No active follow-ups at the moment."}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {followUps.map((engagement) => (
                <Card key={engagement.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      {/* Left: Farmer & Product Info */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Link 
                                href={`/crm/farmers/${engagement.farmer.id}`}
                                className="text-lg font-semibold hover:text-primary"
                              >
                                {engagement.farmer.full_name}
                              </Link>
                              <Badge variant="outline" className="text-xs">
                                {engagement.farmer.farmer_code}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {engagement.farmer.phone}
                              </div>
                              {engagement.farmer.village && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {engagement.farmer.village}, {engagement.farmer.city}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 pl-13">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{engagement.product.product_name}</span>
                          </div>
                          <Badge variant="secondary">{engagement.season}</Badge>
                          <Badge className="bg-blue-100 text-blue-800">
                            {engagement.lead_stage.replace(/_/g, ' ')}
                          </Badge>
                          <Badge 
                            variant="outline"
                            className={
                              engagement.lead_quality === 'hot' ? 'border-red-500 text-red-700' :
                              engagement.lead_quality === 'warm' ? 'border-orange-500 text-orange-700' :
                              'border-gray-500 text-gray-700'
                            }
                          >
                            {engagement.lead_quality} • {engagement.lead_score}/100
                          </Badge>
                        </div>

                        {engagement.follow_up_notes && (
                          <div className="pl-13 text-sm text-muted-foreground bg-muted/50 p-3 rounded">
                            <p className="font-medium text-foreground mb-1">Follow-up Notes:</p>
                            {engagement.follow_up_notes}
                          </div>
                        )}

                        {engagement.assigned_tmo && (
                          <div className="pl-13 text-xs text-muted-foreground">
                            Assigned to: {engagement.assigned_tmo.full_name}
                          </div>
                        )}
                      </div>

                      {/* Right: Date & Actions */}
                      <div className="flex flex-col items-end gap-3 min-w-[200px]">
                        <div className="text-right">
                          <Badge className={getDateBadgeColor(engagement.next_follow_up_date)}>
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(engagement.next_follow_up_date)}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(engagement.next_follow_up_date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                          {engagement.last_contact_date && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Last contact: {new Date(engagement.last_contact_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>

                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleLogActivity(engagement)}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Log Activity
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Log Activity Modal */}
      {logActivityModal.farmerId && logActivityModal.farmerName && (
        <LogActivityModal
          open={logActivityModal.open}
          onOpenChange={(open) => setLogActivityModal({ open })}
          farmerId={logActivityModal.farmerId}
          farmerName={logActivityModal.farmerName}
          onSuccess={handleActivityLogged}
        />
      )}
    </div>
  )
}
