"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Edit, Trash2, Mail } from "lucide-react"
import { usersAPI } from "@/lib/supabase/users"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function UsersManagementPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    setLoading(true)
    const { data } = await usersAPI.getAll()
    if (data) setUsers(data)
    setLoading(false)
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete user "${name}"?`)) return
    
    const { error } = await usersAPI.delete(id)
    if (error) {
      alert('Error deleting user: ' + error.message)
    } else {
      alert('User deleted successfully')
      fetchUsers()
    }
  }

  const getRoleBadge = (role: string) => {
    const roleColors: Record<string, string> = {
      'head_of_marketing': 'bg-purple-100 text-purple-800',
      'country_manager': 'bg-blue-100 text-blue-800',
      'telemarketing_officer': 'bg-green-100 text-green-800',
      'telemarketing_manager': 'bg-teal-100 text-teal-800',
      'event_coordinator': 'bg-orange-100 text-orange-800',
      'admin': 'bg-red-100 text-red-800',
      'viewer': 'bg-gray-100 text-gray-800',
    }
    
    const roleNames: Record<string, string> = {
      'head_of_marketing': 'Head of Marketing',
      'country_manager': 'Country Manager',
      'telemarketing_officer': 'TMO',
      'telemarketing_manager': 'TM Manager',
      'event_coordinator': 'Event Coordinator',
      'admin': 'Admin',
      'viewer': 'Viewer',
    }
    
    return {
      color: roleColors[role] || 'bg-gray-100 text-gray-800',
      name: roleNames[role] || role.replace('_', ' '),
    }
  }

  const filteredUsers = users.filter(user =>
    user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Users Management</h1>
          <p className="text-muted-foreground">Manage system users and permissions</p>
        </div>
        <Link href="/management/users/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>Total users: {users.length}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 text-left font-medium">Name</th>
                  <th className="p-3 text-left font-medium">Email</th>
                  <th className="p-3 text-left font-medium">Role</th>
                  <th className="p-3 text-left font-medium">Status</th>
                  <th className="p-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const roleBadge = getRoleBadge(user.role)
                    return (
                      <tr key={user.id} className="border-b">
                        <td className="p-3 font-medium">{user.full_name}</td>
                        <td className="p-3 text-sm">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge className={roleBadge.color}>
                            {roleBadge.name}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge variant={user.is_active ? 'success' : 'secondary'}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Link href={`/management/users/${user.id}/edit`}>
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(user.id, user.full_name)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
