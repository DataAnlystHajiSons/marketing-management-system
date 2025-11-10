import { useState, useEffect } from 'react'
import { farmersAPI, type Farmer } from '@/lib/supabase/farmers'

export function useFarmers() {
  const [farmers, setFarmers] = useState<Farmer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadFarmers = async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await farmersAPI.getAll()
    if (err) {
      setError(err.message)
    } else {
      setFarmers(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadFarmers()
  }, [])

  const createFarmer = async (farmer: Partial<Farmer>) => {
    const { data, error: err } = await farmersAPI.create(farmer)
    if (!err && data) {
      setFarmers(prev => [data, ...prev])
    }
    return { data, error: err }
  }

  const updateFarmer = async (id: string, farmer: Partial<Farmer>) => {
    const { data, error: err } = await farmersAPI.update(id, farmer)
    if (!err && data) {
      setFarmers(prev => prev.map(f => f.id === id ? data : f))
    }
    return { data, error: err }
  }

  const deleteFarmer = async (id: string) => {
    const { error: err } = await farmersAPI.delete(id)
    if (!err) {
      setFarmers(prev => prev.filter(f => f.id !== id))
    }
    return { error: err }
  }

  return {
    farmers,
    loading,
    error,
    refresh: loadFarmers,
    createFarmer,
    updateFarmer,
    deleteFarmer,
  }
}

export function useFarmer(id: string) {
  const [farmer, setFarmer] = useState<Farmer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadFarmer = async () => {
      setLoading(true)
      setError(null)
      const { data, error: err } = await farmersAPI.getById(id)
      if (err) {
        setError(err.message)
      } else {
        setFarmer(data)
      }
      setLoading(false)
    }

    if (id) {
      loadFarmer()
    }
  }, [id])

  return { farmer, loading, error }
}
