import { useState, useEffect } from 'react'
import { productsAPI, type Product } from '@/lib/supabase/products'

interface UseProductsOptions {
  activeOnly?: boolean
  stage?: string
}

export function useProducts(options: UseProductsOptions = {}) {
  const { activeOnly = true, stage } = options
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true)
      setError(null)
      const { data, error: err } = await productsAPI.getAll(activeOnly, stage)
      if (err) {
        setError(err.message)
      } else {
        setProducts(data || [])
      }
      setLoading(false)
    }

    loadProducts()
  }, [activeOnly, stage])

  return { products, loading, error }
}
