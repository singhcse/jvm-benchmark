import React from 'react'

const s = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 10,
  },
  card: {
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: '14px 16px',
  },
  label: {
    fontSize: 10,
    fontFamily: 'var(--font-mono)',
    color: 'var(--text2)',
    textTransform: 'uppercase',
    letterSpacing: '0.7px',
    marginBottom: 10,
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  appLabel: { fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)' },
  val: (color) => ({
    fontSize: 13,
    fontWeight: 600,
    fontFamily: 'var(--font-mono)',
    color,
  }),
  winner: (color) => ({
    display: 'inline-block',
    marginTop: 8,
    fontSize: 9,
    fontWeight: 700,
    fontFamily: 'var(--font-mono)',
    padding: '2px 6px',
    borderRadius: 3,
    background: color + '22',
    color,
    letterSpacing: '0.3px',
  }),
}

function KpiCard({ label, rows, winner }) {
  return (
    <div style={s.card}>
      <div style={s.label}>{label}</div>
      {rows.map(r => (
        <div key={r.app} style={s.row}>
          <span style={s.appLabel}>{r.app}</span>
          <span style={s.val(r.color)}>{r.value ?? '—'}</span>
        </div>
      ))}
      {winner && <div style={s.winner(winner.color)}>{winner.text}</div>}
    </div>
  )
}

export default function KpiGrid({ metrics, apps }) {
  const d1 = metrics.app1, d2 = metrics.app2, d3 = metrics.app3

  const fmtMs = v => v != null ? v + ' ms' : '—'
  const fmtMb = v => v != null ? v + ' MB' : '—'
  const fmtRps = v => v != null ? Math.round(v).toLocaleString() : '—'

  // Startup — lower is better
  const startups = [d1?.startupMs, d2?.startupMs, d3?.startupMs]
  const minStartup = Math.min(...startups.filter(Boolean))

  // Memory — lower is better
  const mems = [d1?.heapUsedMb, d2?.heapUsedMb, d3?.heapUsedMb]
  const minMem = Math.min(...mems.filter(Boolean))

  // GC pause — lower is better
  const gcs = [d1?.gcPauseMaxMs, d2?.gcPauseMaxMs]
  const minGc = Math.min(...gcs.filter(Boolean))

  const winnerOf = (vals, appColors, lowerBetter = true) => {
    const valid = vals.map((v, i) => ({ v, i })).filter(x => x.v != null)
    if (!valid.length) return null
    const best = valid.reduce((a, b) => lowerBetter ? (a.v < b.v ? a : b) : (a.v > b.v ? a : b))
    const labels = ['App1', 'App2', 'App3']
    return { color: appColors[best.i], text: labels[best.i] + ' wins' }
  }

  const colors = [apps.app1.color, apps.app2.color, apps.app3.color]

  return (
    <div style={s.grid}>
      <KpiCard
        label="Startup time"
        rows={[
          { app: 'App1', color: apps.app1.color, value: d1?.startupMs ? (d1.startupMs / 1000).toFixed(2) + 's' : '—' },
          { app: 'App2', color: apps.app2.color, value: d2?.startupMs ? (d2.startupMs / 1000).toFixed(2) + 's' : '—' },
          { app: 'App3', color: apps.app3.color, value: d3?.startupMs ? (d3.startupMs / 1000).toFixed(2) + 's' : '—' },
        ]}
        winner={winnerOf([d1?.startupMs, d2?.startupMs, d3?.startupMs], colors, true)}
      />
      <KpiCard
        label="Heap used (MB)"
        rows={[
          { app: 'App1', color: apps.app1.color, value: fmtMb(d1?.heapUsedMb) },
          { app: 'App2', color: apps.app2.color, value: fmtMb(d2?.heapUsedMb) },
          { app: 'App3', color: apps.app3.color, value: fmtMb(d3?.heapUsedMb) },
        ]}
        winner={winnerOf([d1?.heapUsedMb, d2?.heapUsedMb, d3?.heapUsedMb], colors, true)}
      />
      <KpiCard
        label="GC pause max"
        rows={[
          { app: 'App1 G1',  color: apps.app1.color, value: fmtMs(d1?.gcPauseMaxMs) },
          { app: 'App2 ZGC', color: apps.app2.color, value: fmtMs(d2?.gcPauseMaxMs) },
          { app: 'App3',     color: apps.app3.color, value: 'N/A' },
        ]}
        winner={winnerOf([d1?.gcPauseMaxMs, d2?.gcPauseMaxMs, null], colors, true)}
      />
      <KpiCard
        label="Thread count"
        rows={[
          { app: 'App1', color: apps.app1.color, value: d1?.threadCount ?? '—' },
          { app: 'App2', color: apps.app2.color, value: d2?.threadCount ?? '—' },
          { app: 'App3', color: apps.app3.color, value: d3?.threadCount ?? '—' },
        ]}
      />
      <KpiCard
        label="CPU %"
        rows={[
          { app: 'App1', color: apps.app1.color, value: d1?.cpuPercent != null ? d1.cpuPercent.toFixed(1) + '%' : '—' },
          { app: 'App2', color: apps.app2.color, value: d2?.cpuPercent != null ? d2.cpuPercent.toFixed(1) + '%' : '—' },
          { app: 'App3', color: apps.app3.color, value: d3?.cpuPercent != null ? d3.cpuPercent.toFixed(1) + '%' : '—' },
        ]}
        winner={winnerOf([d1?.cpuPercent, d2?.cpuPercent, d3?.cpuPercent], colors, true)}
      />
      <KpiCard
        label="GC type"
        rows={[
          { app: 'App1', color: apps.app1.color, value: d1?.gcType ?? 'G1GC' },
          { app: 'App2', color: apps.app2.color, value: d2?.gcType ?? 'ZGC' },
          { app: 'App3', color: apps.app3.color, value: d3?.gcType ?? 'Serial' },
        ]}
      />
    </div>
  )
}
