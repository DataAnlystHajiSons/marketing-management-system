import { useState, useEffect } from 'react'
import { 
  farmerEngagementsAPI, 
  type EngagementWithRelations,
  type DataSourceType,
  type LeadStage,
  type CreateEngagementData,
  type UpdateEngagementData
} from '@/lib/supabase/farmer-engagements'

interface UseEngagementsFilters {
  farmer_id?: string
  product_id?: string
  season?: string
  data_source?: DataSourceType
  lead_stage?: LeadStage
  is_active?: boolean
  assigned_tmo_id?: string
}

export function useFarmerEngagements(filters?: UseEngagementsFilters) {
  const [engagements, setEngagements] = useState<EngagementWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadEngagements = async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await farmerEngagementsAPI.getAll(filters)
    if (err) {
      setError(err.message)
    } else {
      setEngagements(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadEngagements()
  }, [
    filters?.farmer_id,
    filters?.product_id,
    filters?.season,
    filters?.data_source,
    filters?.lead_stage,
    filters?.is_active,
    filters?.assigned_tmo_id,
  ])

  return {
    engagements,
    loading,
    error,
    refresh: loadEngagements,
  }
}

export function useEngagement(id: string) {
  const [engagement, setEngagement] = useState<EngagementWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadEngagement = async () => {
      if (!id) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      const { data, error: err } = await farmerEngagementsAPI.getById(id)
      if (err) {
        setError(err.message)
      } else {
        setEngagement(data)
      }
      setLoading(false)
    }

    loadEngagement()
  }, [id])

  return { engagement, loading, error }
}

export function useFarmerEngagementsActions() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createEngagement = async (data: CreateEngagementData) => {
    setLoading(true)
    setError(null)
    const result = await farmerEngagementsAPI.create(data)
    setLoading(false)
    if (result.error) {
      setError(result.error.message)
    }
    return result
  }

  const updateEngagement = async (id: string, data: UpdateEngagementData) => {
    setLoading(true)
    setError(null)
    const result = await farmerEngagementsAPI.update(id, data)
    setLoading(false)
    if (result.error) {
      setError(result.error.message)
    }
    return result
  }

  const updateStage = async (id: string, newStage: LeadStage, reason?: string) => {
    setLoading(true)
    setError(null)
    const result = await farmerEngagementsAPI.updateStage(id, newStage, reason)
    setLoading(false)
    if (result.error) {
      setError(result.error.message)
    }
    return result
  }

  const markConverted = async (id: string, totalPurchases?: number) => {
    setLoading(true)
    setError(null)
    const result = await farmerEngagementsAPI.markConverted(id, totalPurchases)
    setLoading(false)
    if (result.error) {
      setError(result.error.message)
    }
    return result
  }

  const closeEngagement = async (id: string, reason: string) => {
    setLoading(true)
    setError(null)
    const result = await farmerEngagementsAPI.close(id, reason)
    setLoading(false)
    if (result.error) {
      setError(result.error.message)
    }
    return result
  }

  const reopenEngagement = async (id: string) => {
    setLoading(true)
    setError(null)
    const result = await farmerEngagementsAPI.reopen(id)
    setLoading(false)
    if (result.error) {
      setError(result.error.message)
    }
    return result
  }

  return {
    createEngagement,
    updateEngagement,
    updateStage,
    markConverted,
    closeEngagement,
    reopenEngagement,
    loading,
    error,
  }
}

export function useEngagementStats(filters?: {
  product_id?: string
  season?: string
  data_source?: DataSourceType
  assigned_tmo_id?: string
}) {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true)
      setError(null)
      const { data, error: err } = await farmerEngagementsAPI.getStats(filters)
      if (err) {
        setError(err.message)
      } else {
        setStats(data)
      }
      setLoading(false)
    }

    loadStats()
  }, [filters?.product_id, filters?.season, filters?.data_source, filters?.assigned_tmo_id])

  return { stats, loading, error }
}

export function useSeasons() {
  const [seasons, setSeasons] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadSeasons = async () => {
      setLoading(true)
      setError(null)
      const { data, error: err } = await farmerEngagementsAPI.getSeasons()
      if (err) {
        setError(err.message)
      } else {
        setSeasons(data)
      }
      setLoading(false)
    }

    loadSeasons()
  }, [])

  return { seasons, loading, error }
}
