import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Building2, Phone, TrendingUp, AlertCircle, CheckCircle } from "lucide-react"
import { OverdueTouchpointsCard } from "@/components/dashboard/OverdueTouchpointsCard"
import { TodaysTouchpointsCard } from "@/components/dashboard/TodaysTouchpointsCard"
import { UpcomingTouchpointsCard } from "@/components/dashboard/UpcomingTouchpointsCard"

export default function DashboardPage() {
  const stats = [
    {
      title: "Total Farmers",
      value: "2,543",
      change: "+12.5%",
      icon: Users,
      color: "text-blue-500",
    },
    {
      title: "Active Dealers",
      value: "487",
      change: "+5.2%",
      icon: Building2,
      color: "text-green-500",
    },
    {
      title: "Calls Today",
      value: "156",
      change: "+8.1%",
      icon: Phone,
      color: "text-purple-500",
    },
    {
      title: "Conversions",
      value: "89",
      change: "+15.3%",
      icon: TrendingUp,
      color: "text-orange-500",
    },
  ]

  const recentActivity = [
    {
      type: "call",
      title: "Call with Farmer - Ali Hassan",
      time: "10 minutes ago",
      status: "completed",
    },
    {
      type: "meeting",
      title: "Farmer Meeting at Lahore",
      time: "1 hour ago",
      status: "in-progress",
    },
    {
      type: "complaint",
      title: "Complaint from Dealer - Green Valley",
      time: "2 hours ago",
      status: "pending",
    },
    {
      type: "sale",
      title: "Sale Transaction - PKR 45,000",
      time: "3 hours ago",
      status: "completed",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your marketing overview.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-green-500 font-medium">{stat.change}</span> from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Touchpoint Widgets */}
      <div className="grid gap-6 lg:grid-cols-3">
        <OverdueTouchpointsCard />
        <TodaysTouchpointsCard />
        <UpcomingTouchpointsCard />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates from your team</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                  <Badge
                    variant={
                      activity.status === "completed"
                        ? "success"
                        : activity.status === "in-progress"
                        ? "info"
                        : "warning"
                    }
                  >
                    {activity.status === "completed" && <CheckCircle className="mr-1 h-3 w-3" />}
                    {activity.status === "pending" && <AlertCircle className="mr-1 h-3 w-3" />}
                    {activity.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lead Pipeline</CardTitle>
            <CardDescription>Farmer conversion funnel</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { stage: "New", count: 450, percentage: 100 },
                { stage: "Contacted", count: 320, percentage: 71 },
                { stage: "Meeting Invited", count: 180, percentage: 40 },
                { stage: "Visit Scheduled", count: 95, percentage: 21 },
                { stage: "Converted", count: 45, percentage: 10 },
              ].map((item) => (
                <div key={item.stage} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.stage}</span>
                    <span className="text-muted-foreground">{item.count}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
