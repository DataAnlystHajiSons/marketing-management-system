"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { villagesAPI } from "@/lib/supabase/villages"

interface AddVillageModalProps {
  open: boolean
  onClose: () => void
  onVillageAdded?: (villageId: string) => void
  preSelectedAreaId?: string
}

export function AddVillageModal({
  open,
  onClose,
  onVillageAdded,
  preSelectedAreaId,
}: AddVillageModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    villageType: 'rural' as 'rural' | 'urban' | 'semi-urban',
    population: '',
    postalCode: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!preSelectedAreaId) {
      setError('Area must be selected first')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Check if village name already exists in this area
      const { exists, error: checkError } = await villagesAPI.checkNameExists(
        formData.name,
        preSelectedAreaId
      )

      if (checkError) {
        setError('Error checking village name: ' + checkError.message)
        setLoading(false)
        return
      }

      if (exists) {
        setError('A village with this name already exists in this area')
        setLoading(false)
        return
      }

      // Create village
      const { data, error: createError } = await villagesAPI.create({
        area_id: preSelectedAreaId,
        name: formData.name,
        code: formData.code || undefined,
        village_type: formData.villageType,
        population: formData.population ? parseInt(formData.population) : undefined,
        postal_code: formData.postalCode || undefined,
        is_active: true,
      })

      if (createError) {
        setError(createError.message || 'Failed to create village')
      } else if (data) {
        // Success
        if (onVillageAdded) {
          onVillageAdded(data.id)
        }
        
        // Reset form
        setFormData({
          name: '',
          code: '',
          villageType: 'rural',
          population: '',
          postalCode: '',
        })
        
        onClose()
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setError('')
      setFormData({
        name: '',
        code: '',
        villageType: 'rural',
        population: '',
        postalCode: '',
      })
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] p-6">
        <DialogHeader className="mb-4">
          <DialogTitle>Add New Village</DialogTitle>
          <DialogDescription>
            Create a new village entry in the selected area
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="village-name">
              Village Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="village-name"
              placeholder="e.g., Chak 123, Model Town"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="village-code">Village Code</Label>
              <Input
                id="village-code"
                placeholder="e.g., CHK-123"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="village-type">Village Type</Label>
              <Select
                id="village-type"
                value={formData.villageType}
                onChange={(e) => setFormData({ ...formData, villageType: e.target.value as any })}
                disabled={loading}
              >
                <option value="rural">Rural</option>
                <option value="urban">Urban</option>
                <option value="semi-urban">Semi-Urban</option>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="village-population">Population (Optional)</Label>
              <Input
                id="village-population"
                type="number"
                placeholder="e.g., 5000"
                value={formData.population}
                onChange={(e) => setFormData({ ...formData, population: e.target.value })}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="village-postal">Postal Code (Optional)</Label>
              <Input
                id="village-postal"
                placeholder="e.g., 60000"
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Village'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
