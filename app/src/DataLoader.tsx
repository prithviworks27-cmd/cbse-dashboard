import { useEffect, useState } from 'react'
import App from './App'
import type { DashboardData } from './types/dashboard'

type LoadState = { status: 'loading' } | { status: 'ready'; data: DashboardData } | { status: 'error'; message: string }

/**
 * Each school/class deployment ships its own generated dashboard.json (produced by
 * /data-pipeline) as a static asset, fetched at runtime. A missing or invalid file is a
 * real problem for a real deployment, so it surfaces as an explicit error — never a silent
 * fallback to placeholder data.
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
      .catch((err: Error) => {
        if (!cancelled) setState({ status: 'error', message: err.message })
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (state.status === 'loading') {
    return <p className="mono" style={{ padding: 24 }}>Loading dashboard…</p>
  }
  if (state.status === 'error') {
    return (
      <p className="mono" style={{ padding: 24 }}>
        No dashboard data found ({state.message}). Run the data pipeline to generate{' '}
        <code>dashboard.json</code> into <code>app/public/</code>.
      </p>
    )
  }
  return <App data={state.data} />
}
