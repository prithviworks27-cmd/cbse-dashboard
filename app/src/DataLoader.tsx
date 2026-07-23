import { useEffect, useState } from 'react'
import App from './App'
import { sampleDashboard } from './data/sampleDashboard'
import type { DashboardData } from './types/dashboard'

type LoadState = { status: 'loading' } | { status: 'ready'; data: DashboardData } | { status: 'error'; message: string }

/**
 * Each school/class deployment ships its own generated dashboard.json (produced by
 * /data-pipeline) as a static asset, fetched at runtime. Falls back to the bundled sample
 * fixture only if no dashboard.json is present, for local development convenience.
 */
export function DataLoader() {
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    fetch('/dashboard.json')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`${res.status} ${res.statusText}`))))
      .then((data: DashboardData) => {
        if (!cancelled) setState({ status: 'ready', data })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'ready', data: sampleDashboard })
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (state.status === 'loading') {
    return <p className="mono" style={{ padding: 24 }}>Loading dashboard…</p>
  }
  if (state.status === 'error') {
    return <p className="mono" style={{ padding: 24 }}>Failed to load dashboard data: {state.message}</p>
  }
  return <App data={state.data} />
}
