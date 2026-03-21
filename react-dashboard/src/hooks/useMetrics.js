import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchAllMetrics } from '../services/api'

const MAX_HISTORY = 40

export function useMetrics(intervalMs = 2000) {
  const [metrics, setMetrics] = useState({ app1: null, app2: null, app3: null })
  const [history, setHistory] = useState([])  // array of { ts, app1, app2, app3 }
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [interval, setIntervalMs] = useState(intervalMs)
  const timerRef = useRef(null)

  const poll = useCallback(async () => {
    const data = await fetchAllMetrics()
    setMetrics(data)
    setLastUpdated(new Date())
    setLoading(false)
    setHistory(prev => {
      const next = [...prev, { ts: new Date().toLocaleTimeString(), ...data }]
      return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next
    })
  }, [])

  useEffect(() => {
    poll()
    timerRef.current = setInterval(poll, interval)
    return () => clearInterval(timerRef.current)
  }, [poll, interval])

  const refresh = useCallback(() => poll(), [poll])

  return { metrics, history, loading, lastUpdated, interval, setIntervalMs, refresh }
}
