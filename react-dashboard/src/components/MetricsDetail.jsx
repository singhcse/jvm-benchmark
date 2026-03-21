import React, { useState } from 'react'

const s = {
  wrap: {
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '16px 20px',
  },
  title: {
    fontSize: 11, fontFamily: 'var(--font-mono)',
    color: 'var(--text2)', textTransform: 'uppercase',
    letterSpacing: '0.7px', marginBottom: 14,
  },
  tabs: { display: 'flex', gap: 6, marginBottom: 14 },
  tab: (active, color) => ({
    padding: '4px 14px', fontSize: 11, fontFamily: 'var(--font-mono)',
    background: active ? (color + '20') : 'var(--bg3)',
    border: `1px solid ${active ? color + '50' : 'var(--border)'}`,
    borderRadius: 5, cursor: 'pointer',
    color: active ? color : 'var(--text2)',
  }),
  grid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr',
    gap: '6px 24px',
  },
  row: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'baseline', padding: '5px 0',
    borderBottom: '1px solid var(--border)',
  },
  key: { fontSize: 11, color: 'var(--text2)', fontFamily: 'var(--font-mono)' },
  val: (color) => ({
    fontSize: 11, fontWeight: 600,
    fontFamily: 'var(--font-mono)', color: color || 'var(--text)',
  }),
  offline: {
    textAlign: 'center', padding: 24,
    color: 'var(--text3)', fontSize: 12, fontFamily: 'var(--font-mono)',
  },
}

function SnapshotView({ data, color }) {
  if (!data || data._status !== 'online') {
    return <div style={s.offline}>App is offline — start it on the configured port</div>
  }

  const rows = [
    { k: 'appName',         v: data.appName },
    { k: 'javaVersion',     v: data.javaVersion },
    { k: 'compiler',        v: data.compiler },
    { k: 'threadModel',     v: data.threadModel },
    { k: 'startupMs',       v: data.startupMs != null ? data.startupMs + ' ms' : null },
    { k: 'heapUsedMb',      v: data.heapUsedMb != null ? data.heapUsedMb + ' MB' : null },
    { k: 'heapMaxMb',       v: data.heapMaxMb  != null ? data.heapMaxMb  + ' MB' : null },
    { k: 'nonHeapUsedMb',   v: data.nonHeapUsedMb != null ? data.nonHeapUsedMb + ' MB' : null },
    { k: 'threadCount',     v: data.threadCount },
    { k: 'virtualThreads',  v: data.virtualThreads != null ? String(data.virtualThreads) : null },
    { k: 'gcType',          v: data.gcType },
    { k: 'gcPauseMaxMs',    v: data.gcPauseMaxMs != null ? data.gcPauseMaxMs + ' ms' : null },
    { k: 'gcPauseAvgMs',    v: data.gcPauseAvgMs != null ? data.gcPauseAvgMs + ' ms' : null },
    { k: 'gcCollectionCount', v: data.gcCollectionCount },
    { k: 'cpuPercent',      v: data.cpuPercent != null ? data.cpuPercent.toFixed(2) + '%' : null },
    { k: 'nativeImage',     v: data.nativeImage != null ? String(data.nativeImage) : null },
  ].filter(r => r.v != null)

  return (
    <div style={s.grid}>
      {rows.map(({ k, v }) => (
        <div key={k} style={s.row}>
          <span style={s.key}>{k}</span>
          <span style={s.val(color)}>{String(v)}</span>
        </div>
      ))}
    </div>
  )
}

export default function MetricsDetail({ metrics, apps }) {
  const [active, setActive] = useState('app1')

  return (
    <div style={s.wrap}>
      <div style={s.title}>Raw metrics snapshot — /api/metrics/snapshot</div>
      <div style={s.tabs}>
        {Object.values(apps).map(app => (
          <button
            key={app.id}
            style={s.tab(active === app.id, app.color)}
            onClick={() => setActive(app.id)}
          >
            {app.short}
          </button>
        ))}
      </div>
      <SnapshotView data={metrics[active]} color={apps[active].color} />
    </div>
  )
}
