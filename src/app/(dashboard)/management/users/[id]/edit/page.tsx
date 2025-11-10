"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { usersAPI } from "@/lib/supabase/users"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: '',
    isActive: 'true',
  })

  useEffect(() => {
    async function fetchUser() {
      const { data, error } = await usersAPI.getById(id)
      if (error) {
        alert('Error loading user: ' + error.message)
        router.push('/management/users')
      } else if (data) {
        setFormData({
          fullName: data.full_name,
          email: data.email,
          phone: data.phone || '',
          role: data.role,
          isActive: data.is_active ? 'true' : 'false',
        })
      }
      setLoadingData(false)
    }
    fetchUser()
  }, [id, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error: err } = await usersAPI.update(id, {
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone || undefined,
        role: formData.role,
        is_active: formData.isActive === 'true',
      })

      if (err) {
        setError(err.message || 'Failed to update user')
      } else {
        alert('User updated successfully!')
        router.push('/management/users')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  if (loadingData) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/management/users">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Edit User</h1>
          <p className="text-muted-foreground">Update user information</p>
        </div>
      </div>

      <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-900">
        <p className="font-medium">Note:</p>
        <p className="mt-1">
          This updates the user profile only. To change password or email authentication, use Supabase Dashboard → Authentication → Users
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
            <CardDescription>Update the user details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder="Enter full name"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="user@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  placeholder="03XX-XXXXXXX"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Role</option>
                  <option value="head_of_marketing">Head of Marketing</option>
                  <option value="country_manager">Country Manager</option>
                  <option value="telemarketing_officer">Telemarketing Officer (TMO)</option>
                  <option value="telemarketing_manager">Telemarketing Manager</option>
                  <option value="event_coordinator">Event Coordinator</option>
                  <option value="admin">Admin</option>
                  <option value="viewer">Viewer</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="isActive">Status *</Label>
                <Select
                  id="isActive"
                  name="isActive"
                  value={formData.isActive}
                  onChange={handleChange}
                  required
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </Select>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Link href="/management/users">
                <Button type="button" variant="outline" disabled={loading}>
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update User'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
