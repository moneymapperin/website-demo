import { useState, useEffect, useCallback } from 'react'

export function useApi(apiFunc, dependencies = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const execute = useCallback(async (...args) => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFunc(...args)
      setData(res.data)
      return res.data
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred')
      throw err
    } finally {
      setLoading(false)
    }
  }, [apiFunc])

  useEffect(() => {
    execute()
  }, [...dependencies, execute])

  return { data, loading, error, execute, setData }
}
