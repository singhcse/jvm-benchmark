import React, { useCallback } from 'react'
import { APPS } from './services/api'
import { useMetrics } from './hooks/useMetrics'
import Header from './components/Header'
import AppCard from './components/AppCard'
import KpiGrid from './components/KpiGrid'
import Charts from './components/Charts'
import BenchmarkRunner from './components/BenchmarkRunner'
import ComparisonTable from './components/ComparisonTable'
import MetricsDetail from './components/MetricsDetail'
import ColdStartRace from './components/ColdStartRace'
import RestartPanel from './components/RestartPanel'
import ThreadStressDemo from './components/ThreadStressDemo'
import LoadTestPanel from './components/LoadTestPanel'

const layout = {
  wrap:     { maxWidth: 1400, margin: '0 auto', padding: '24px 20px 48px' },
  appCards: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20, animation: 'fadeIn 0.5s ease' },
  section:  { marginBottom: 20 },
  twoCol:   { display: 'grid', gridTemplateColumns: '1fr 1fr',   gap: 12, marginBottom: 20 },
  threeCol: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 },
  loading: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '60vh', flexDirection: 'column', gap: 16,
  },
  spinner: {
    width: 32, height: 32, border: '3px solid var(--bg3)',
    borderTopColor: 'var(--accent)', borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: { fontFamily: 'var(--font-mono)', color: 'var(--text2)', fontSize: 13 },
  loadingNote: { fontFamily: 'var(--font-mono)', color: 'var(--text3)', fontSize: 11, textAlign: 'center' },
}

export default function App() {
  const { metrics, history, loading, lastUpdated, interval, setIntervalMs, refresh } = useMetrics(2000)

  const handleRestart = useCallback(() => {
    setTimeout(refresh, 1000)
  }, [refresh])

  if (loading) {
    return (
      <div style={layout.loading}>
        <div style={layout.spinner} />
        <div style={layout.loadingText}>Connecting to Spring Boot apps...</div>
        <div style={layout.loadingNote}>
          Make sure App1 (:8080), App2 (:8081), App3 (:8082) are running
        </div>
      </div>
    )
  }

  return (
    <div style={layout.wrap}>

      <Header
        metrics={metrics}
        interval={interval}
        setIntervalMs={setIntervalMs}
        refresh={refresh}
        lastUpdated={lastUpdated}
      />

      {/* App status cards */}
      <div style={layout.appCards}>
        {Object.values(APPS).map(app => (
          <AppCard key={app.id} appMeta={app} data={metrics[app.id]} />
        ))}
      </div>

      {/* KPI tiles */}
      <div style={layout.section}>
        <KpiGrid metrics={metrics} apps={APPS} />
      </div>

      {/* Live charts */}
      <div style={layout.section}>
        <Charts history={history} apps={APPS} />
      </div>

      {/* Thread stress demo */}
      <div style={layout.section}>
        <ThreadStressDemo />
      </div>

      {/* k6 load test */}
      <div style={layout.section}>
        <LoadTestPanel />
      </div>

      {/* Restart + Cold Start Race + Benchmark Runner */}
      <div style={layout.threeCol}>
        <RestartPanel onRestartTriggered={handleRestart} />
        <ColdStartRace />
        <BenchmarkRunner apps={APPS} />
      </div>

      {/* Raw metrics + Comparison table */}
      <div style={layout.twoCol}>
        <MetricsDetail metrics={metrics} apps={APPS} />
        <ComparisonTable apps={APPS} />
      </div>

    </div>
  )
}
