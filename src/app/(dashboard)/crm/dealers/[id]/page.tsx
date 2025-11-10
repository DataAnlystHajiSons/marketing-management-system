"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  User, 
  Calendar,
  TrendingUp,
  Edit,
  BarChart3,
  Receipt,
  Clock
} from "lucide-react"
import { dealersAPI } from "@/lib/supabase/dealers"
import { LoadingPage } from "@/components/ui/loading-spinner"
import { ErrorMessage } from "@/components/ui/error-message"
import { formatCurrency } from "@/lib/utils"
import { TouchpointSchedule } from "@/components/dealers/TouchpointSchedule"
import { CallHistory } from "@/components/dealers/CallHistory"

export default function DealerDetailsPage() {
  const params = useParams()
  const dealerId = params.id as string

  const [dealer, setDealer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDealer()
  }, [dealerId])

  const loadDealer = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await dealersAPI.getById(dealerId)
      if (fetchError) throw new Error(fetchError.message)
      setDealer(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load dealer')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingPage />
  if (error) return <ErrorMessage message={error} retry={loadDealer} />
  if (!dealer) return <ErrorMessage message="Dealer not found" />

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/crm/dealers">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{dealer.business_name}</h1>
            <Badge variant={dealer.is_active ? "default" : "secondary"}>
              {dealer.is_active ? "Active" : "Inactive"}
            </Badge>
            <Badge className="bg-purple-100 text-purple-800">
              {dealer.relationship_status?.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {dealer.dealer_code} • {dealer.owner_name}
          </p>
        </div>
        <Button>
          <Edit className="mr-2 h-4 w-4" />
          Edit Dealer
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Relationship Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dealer.relationship_score || 0}</div>
            <div className="w-full h-2 bg-muted rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full ${
                  (dealer.relationship_score || 0) >= 70 ? 'bg-green-500' :
                  (dealer.relationship_score || 0) >= 40 ? 'bg-amber-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${dealer.relationship_score || 0}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {dealer.performance_rating?.replace('_', ' ') || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">Rating</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credit Limit</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dealer.credit_limit ? formatCurrency(dealer.credit_limit) : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Balance: {dealer.current_balance ? formatCurrency(dealer.current_balance) : '0'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registration</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dealer.created_at ? new Date(dealer.created_at).getFullYear() : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {dealer.created_at ? new Date(dealer.created_at).toLocaleDateString() : 'Unknown'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="touchpoints">
            <Clock className="mr-2 h-4 w-4" />
            Touchpoints
          </TabsTrigger>
          <TabsTrigger value="sales">
            <Receipt className="mr-2 h-4 w-4" />
            Sales
          </TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{dealer.owner_name}</div>
                    <div className="text-sm text-muted-foreground">Owner</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{dealer.phone}</div>
                    {dealer.alternate_phone && (
                      <div className="text-sm text-muted-foreground">{dealer.alternate_phone}</div>
                    )}
                  </div>
                </div>

                {dealer.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{dealer.email}</div>
                    </div>
                  </div>
                )}

                {dealer.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <div className="font-medium">Address</div>
                      <div className="text-sm text-muted-foreground">{dealer.address}</div>
                      {dealer.city && (
                        <div className="text-sm text-muted-foreground">{dealer.city}</div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Business Details */}
            <Card>
              <CardHeader>
                <CardTitle>Business Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{dealer.business_name}</div>
                    <div className="text-sm text-muted-foreground">Business Name</div>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground mb-1">Dealer Code</div>
                  <div className="font-medium font-mono">{dealer.dealer_code}</div>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground mb-1">Relationship Status</div>
                  <Badge className="bg-purple-100 text-purple-800">
                    {dealer.relationship_status?.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>

                {dealer.performance_rating && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Performance Rating</div>
                    <Badge variant="outline" className="capitalize">
                      {dealer.performance_rating.replace('_', ' ')}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Additional Info */}
          {dealer.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{dealer.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Touchpoints Tab */}
        <TabsContent value="touchpoints">
          <TouchpointSchedule dealerId={dealerId} />
        </TabsContent>

        {/* Sales Tab - Redirect to sales page */}
        <TabsContent value="sales">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Sales Dashboard</h3>
                <p className="text-muted-foreground mb-4">
                  View detailed sales transactions, statistics, and analytics
                </p>
                <Link href={`/crm/dealers/${dealerId}/sales`}>
                  <Button>
                    <Receipt className="mr-2 h-4 w-4" />
                    Open Sales Dashboard
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activities Tab */}
        <TabsContent value="activities">
          <CallHistory dealerId={dealerId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
