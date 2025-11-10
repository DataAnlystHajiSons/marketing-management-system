"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Users, Building2, TrendingUp, Package } from "lucide-react"

interface ProfileData {
  id: string
  type: 'farmer' | 'dealer' | 'field_staff'
  code: string
  name: string
  phone: string
  location: string
  status: string
  keyMetrics: {
    totalValue?: number
    interactions?: number
    purchases?: number
    performance?: string
  }
}

const mockProfiles: ProfileData[] = [
  {
    id: '1',
    type: 'dealer',
    code: 'D-001',
    name: 'Green Valley Traders',
    phone: '0300-1111222',
    location: 'Faisalabad',
    status: 'active',
    keyMetrics: {
      totalValue: 2450000,
      interactions: 45,
      purchases: 12,
      performance: 'excellent'
    }
  },
  {
    id: '2',
    type: 'farmer',
    code: 'F-001',
    name: 'Ali Hassan',
    phone: '0300-1234567',
    location: 'Chak 123, Faisalabad',
    status: 'hot_lead',
    keyMetrics: {
      totalValue: 0,
      interactions: 12,
      purchases: 0,
      performance: 'potential'
    }
  },
  {
    id: '3',
    type: 'dealer',
    code: 'D-002',
    name: 'Agri Solutions',
    phone: '0301-3334444',
    location: 'Multan',
    status: 'preferred',
    keyMetrics: {
      totalValue: 3200000,
      interactions: 52,
      purchases: 18,
      performance: 'excellent'
    }
  },
]

export default function DataBankPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<'all' | 'farmer' | 'dealer' | 'field_staff'>('all')
  const [profiles] = useState<ProfileData[]>(mockProfiles)

  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch = profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.phone.includes(searchQuery)
    const matchesType = selectedType === 'all' || profile.type === selectedType
    return matchesSearch && matchesType
  })

  const stats = {
    totalFarmers: profiles.filter(p => p.type === 'farmer').length,
    totalDealers: profiles.filter(p => p.type === 'dealer').length,
    totalFieldStaff: profiles.filter(p => p.type === 'field_staff').length,
    totalValue: profiles.reduce((sum, p) => sum + (p.keyMetrics.totalValue || 0), 0),
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Data Bank</h1>
        <p className="text-muted-foreground">Central profiling and analytics hub</p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Farmers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFarmers}</div>
            <p className="text-xs text-muted-foreground mt-1">Registered profiles</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Dealers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDealers}</div>
            <p className="text-xs text-muted-foreground mt-1">Active partnerships</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Field Staff</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFieldStaff}</div>
            <p className="text-xs text-muted-foreground mt-1">Team members</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Business Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">PKR {(stats.totalValue / 1000000).toFixed(1)}M</div>
            <p className="text-xs text-muted-foreground mt-1">Cumulative</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Stakeholder Profiles</CardTitle>
            <div className="flex gap-2">
              <div className="flex gap-1 rounded-lg bg-muted p-1">
                <Button
                  variant={selectedType === 'all' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedType('all')}
                >
                  All
                </Button>
                <Button
                  variant={selectedType === 'farmer' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedType('farmer')}
                >
                  Farmers
                </Button>
                <Button
                  variant={selectedType === 'dealer' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedType('dealer')}
                >
                  Dealers
                </Button>
                <Button
                  variant={selectedType === 'field_staff' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedType('field_staff')}
                >
                  Field Staff
                </Button>
              </div>
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search profiles..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredProfiles.map((profile) => (
              <Card key={profile.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      {profile.type === 'dealer' ? (
                        <Building2 className="h-6 w-6 text-primary" />
                      ) : (
                        <Users className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/crm/${profile.type}s/${profile.id}`}
                          className="font-semibold hover:underline"
                        >
                          {profile.name}
                        </Link>
                        <Badge variant="secondary" className="text-xs">
                          {profile.code}
                        </Badge>
                        <Badge variant={profile.status.includes('active') || profile.status.includes('preferred') ? 'success' : 'warning'}>
                          {profile.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{profile.phone}</span>
                        <span>•</span>
                        <span>{profile.location}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Package className="h-3 w-3" />
                        <span>Value</span>
                      </div>
                      <p className="text-sm font-semibold">
                        {profile.keyMetrics.totalValue
                          ? `PKR ${(profile.keyMetrics.totalValue / 1000).toFixed(0)}K`
                          : 'PKR 0'
                        }
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>Interactions</span>
                      </div>
                      <p className="text-sm font-semibold">{profile.keyMetrics.interactions}</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <TrendingUp className="h-3 w-3" />
                        <span>Performance</span>
                      </div>
                      <p className="text-sm font-semibold capitalize">{profile.keyMetrics.performance}</p>
                    </div>
                    <Link href={`/crm/${profile.type}s/${profile.id}`}>
                      <Button variant="outline">View Profile</Button>
                    </Link>
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
