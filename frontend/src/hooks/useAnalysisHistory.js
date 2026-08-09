import { useEffect, useState } from 'react'
import { fetchBackendHistory } from '../services/analysisApi'
import { loadAnalysisHistory } from '../utils/storage'

export function useAnalysisHistory(limit) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    fetchBackendHistory()
      .then((payload) => {
        if (!active) return
        const rows = payload.history || []
        setHistory(limit ? rows.slice(0, limit) : rows)
      })
      .catch(() => {
        if (!active) return
        const rows = loadAnalysisHistory()
        setHistory(limit ? rows.slice(0, limit) : rows)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [limit])

  return { history, loading }
}
