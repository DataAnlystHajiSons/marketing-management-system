"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import {
  LayoutDashboard,
  Users,
  Phone,
  MessageSquare,
  Package,
  Image,
  Calendar,
  Megaphone,
  Database,
  Settings,
  Building2,
  UserCircle,
  Clock,
  Upload,
} from "lucide-react"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  submenu?: NavItem[]
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Telemarketing/CRM",
    href: "/crm",
    icon: Phone,
    submenu: [
      { title: "Farmers", href: "/crm/farmers", icon: UserCircle },
      { title: "Product Follow-ups", href: "/crm/follow-ups", icon: Clock },
      { title: "Bulk Import", href: "/crm/import", icon: Upload },
      { title: "Dealers", href: "/crm/dealers", icon: Building2 },
      { title: "Field Staff", href: "/crm/field-staff", icon: Users },
      { title: "Calls Log", href: "/crm/calls", icon: Phone },
      { title: "Meetings", href: "/crm/meetings", icon: Calendar },
      { title: "Visits", href: "/crm/visits", icon: UserCircle },
      { title: "Sales", href: "/crm/sales", icon: Package },
    ],
  },
  {
    title: "Complaints",
    href: "/complaints",
    icon: MessageSquare,
  },
  {
    title: "Products",
    href: "/products",
    icon: Package,
  },
  {
    title: "Materials",
    href: "/materials",
    icon: Image,
  },
  {
    title: "Events",
    href: "/events",
    icon: Calendar,
  },
  {
    title: "Campaigns",
    href: "/campaigns",
    icon: Megaphone,
  },
  {
    title: "Data Bank",
    href: "/data-bank",
    icon: Database,
  },
  {
    title: "Management",
    href: "/management",
    icon: Settings,
    submenu: [
      { title: "Zones", href: "/management/zones", icon: Database },
      { title: "Areas", href: "/management/areas", icon: Database },
      { title: "Field Staff", href: "/management/field-staff", icon: Users },
      { title: "Users", href: "/management/users", icon: UserCircle },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-6 bg-white">
        <Link href="/dashboard" className="flex items-center gap-2 transition-all duration-200 hover:scale-105 active:scale-95 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-md transition-all duration-200 group-hover:bg-blue-700 group-hover:shadow-xl group-hover:rotate-6">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold leading-none text-gray-900 group-hover:text-blue-700">Marketing</span>
            <span className="text-xs text-gray-500 group-hover:text-blue-600">Management</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navItems.map((item) => (
          <div key={item.href}>
            <Link
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 relative overflow-hidden group",
                pathname === item.href || pathname?.startsWith(item.href + "/")
                  ? "bg-blue-600 text-white shadow-lg scale-[1.02]"
                  : "text-gray-700 bg-white hover:bg-blue-50 hover:text-blue-700 hover:shadow-md hover:scale-[1.03] hover:translate-x-1 active:scale-[0.98] active:translate-x-0"
              )}
            >
              <item.icon className={cn(
                "h-4 w-4 transition-all duration-200",
                pathname === item.href || pathname?.startsWith(item.href + "/")
                  ? "scale-110"
                  : "group-hover:scale-125 group-hover:rotate-12"
              )} />
              <span className="relative z-10 font-semibold">{item.title}</span>
              {item.badge && (
                <span className="ml-auto rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white shadow-md animate-pulse">
                  {item.badge}
                </span>
              )}
            </Link>
            
            {item.submenu && (pathname === item.href || pathname?.startsWith(item.href + "/")) && (
              <div className="ml-4 mt-1 space-y-1 border-l border-primary/20 pl-4 animate-in slide-in-from-left-2 duration-200">
                {item.submenu.map((subitem) => (
                  <Link
                    key={subitem.href}
                    href={subitem.href}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-1.5 text-xs transition-all duration-200 group relative overflow-hidden",
                      pathname === subitem.href
                        ? "bg-blue-600 font-semibold text-white shadow-md scale-105"
                        : "text-gray-600 bg-white hover:bg-blue-100 hover:text-blue-700 hover:pl-5 hover:shadow-md hover:font-medium active:scale-95"
                    )}
                  >
                    <subitem.icon className={cn(
                      "h-3 w-3 transition-all duration-200 relative z-10",
                      pathname === subitem.href ? "scale-110" : "group-hover:scale-150 group-hover:rotate-12"
                    )} />
                    <span className="relative z-10">{subitem.title}</span>
                    {/* Slide-in effect */}
                    {pathname !== subitem.href && (
                      <div className="absolute left-0 top-0 h-full w-1 bg-blue-600 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-200" />
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="border-t p-4">
        <div className="flex items-center gap-3 rounded-lg p-2 transition-all duration-200 hover:bg-blue-50 cursor-pointer group hover:shadow-md active:scale-[0.98]">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 transition-all duration-200 group-hover:bg-blue-200 group-hover:scale-110 shadow-sm">
            <UserCircle className="h-6 w-6" />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate transition-colors duration-200 text-gray-900 group-hover:text-blue-700 group-hover:font-semibold">
              {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.email || 'No email'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
