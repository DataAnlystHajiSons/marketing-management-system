"use client"

import { useState } from "react"
import { Bell, Search, LogOut } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"

export function Header() {
  const { user, signOut } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6 shadow-sm">
      <div className="flex-1">
        <div className="relative w-full max-w-md group">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 transition-all duration-200 group-focus-within:text-blue-600 group-focus-within:scale-110" />
          <Input
            placeholder="Search farmers, dealers, products..."
            className="pl-10 border-2 border-gray-300 transition-all duration-200 focus:border-blue-600 focus:shadow-md focus:scale-[1.02] focus:ring-2 focus:ring-blue-200"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative group hover:bg-blue-100 hover:text-blue-700">
          <Bell className="h-5 w-5 transition-all duration-200 group-hover:scale-125 group-hover:rotate-12" />
          <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs shadow-lg transition-all duration-200 group-hover:scale-125 animate-pulse bg-red-600 text-white hover:bg-red-600">
            3
          </Badge>
        </Button>
        
        {user && (
          <Button variant="outline" size="sm" onClick={() => signOut()} className="group font-semibold hover:bg-red-600 hover:text-white hover:border-red-600">
            <LogOut className="mr-2 h-4 w-4 transition-all duration-200 group-hover:scale-125 group-hover:rotate-12" />
            Logout
          </Button>
        )}
      </div>
    </header>
  )
}
