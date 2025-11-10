"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, TrendingUp, Target } from "lucide-react"

interface Campaign {
  id: string
  code: string
  name: string
  type: string
  startDate: string
  endDate: string
  status: string
  budget: number
  actualSpend: number
  targetRevenue: number
  actualRevenue: number
  reach: number
  conversions: number
}

const mockCampaigns: Campaign[] = [
  {
    id: '1',
    code: 'CMP-001',
    name: 'Cotton Season Launch 2024',
    type: 'Product Launch',
    startDate: '2024-09-01',
    endDate: '2024-11-30',
    status: 'active',
    budget: 2000000,
    actualSpend: 1200000,
    targetRevenue: 15000000,
    actualRevenue: 9500000,
    reach: 12500,
    conversions: 450
  },
  {
    id: '2',
    code: 'CMP-002',
    name: 'Wheat Seeds Promotion',
    type: 'Seasonal Campaign',
    startDate: '2024-10-15',
    endDate: '2024-12-31',
    status: 'active',
    budget: 1500000,
    actualSpend: 450000,
    targetRevenue: 10000000,
    actualRevenue: 2800000,
    reach: 8200,
    conversions: 180
  },
  {
    id: '3',
    code: 'CMP-003',
    name: 'Dealer Loyalty Program',
    type: 'Retention Campaign',
    startDate: '2024-08-01',
    endDate: '2024-10-31',
    status: 'completed',
    budget: 800000,
    actualSpend: 750000,
    targetRevenue: 8000000,
    actualRevenue: 8500000,
    reach: 500,
    conversions: 85
  },
]

const statusColors: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-800',
  planned: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  paused: 'bg-amber-100 text-amber-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default function CampaignsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [campaigns] = useState<Campaign[]>(mockCampaigns)

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    campaign.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    campaign.type.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Campaigns</h1>
          <p className="text-muted-foreground">Track and manage marketing campaigns</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Campaign
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.length}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {campaigns.filter(c => c.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Currently running</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              PKR {(campaigns.reduce((sum, c) => sum + c.budget, 0) / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-muted-foreground mt-1">Allocated</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              PKR {(campaigns.reduce((sum, c) => sum + c.actualRevenue, 0) / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-muted-foreground mt-1">Generated</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Campaigns</CardTitle>
            </div>
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search campaigns..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredCampaigns.map((campaign) => (
              <Card key={campaign.id}>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold">{campaign.name}</h3>
                          <Badge className={statusColors[campaign.status]}>
                            {campaign.status.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{campaign.type}</span>
                          <span>•</span>
                          <span>{new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Button variant="outline">View Details</Button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Budget Utilization</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-bold">
                            {((campaign.actualSpend / campaign.budget) * 100).toFixed(0)}%
                          </span>
                          <span className="text-xs text-muted-foreground">
                            (PKR {(campaign.actualSpend / 1000).toFixed(0)}K / {(campaign.budget / 1000).toFixed(0)}K)
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Revenue Achievement</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-bold text-green-600">
                            {((campaign.actualRevenue / campaign.targetRevenue) * 100).toFixed(0)}%
                          </span>
                          <span className="text-xs text-muted-foreground">
                            (PKR {(campaign.actualRevenue / 1000000).toFixed(1)}M / {(campaign.targetRevenue / 1000000).toFixed(1)}M)
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <Target className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">Reach</p>
                        </div>
                        <p className="text-xl font-bold">{campaign.reach.toLocaleString()}</p>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">Conversions</p>
                        </div>
                        <p className="text-xl font-bold">{campaign.conversions}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Budget Progress</span>
                        <span>{((campaign.actualSpend / campaign.budget) * 100).toFixed(0)}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${Math.min((campaign.actualSpend / campaign.budget) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
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
