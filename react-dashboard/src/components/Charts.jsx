import React from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const cardStyle = {
  background: 'var(--bg2)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: '16px 20px',
}

const titleStyle = {
  fontSize: 11,
  fontFamily: 'var(--font-mono)',
  color: 'var(--text2)',
  textTransform: 'uppercase',
  letterSpacing: '0.7px',
  marginBottom: 14,
}

const tooltipStyle = {
  contentStyle: {
    background: '#131920',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 6,
    fontSize: 11,
    fontFamily: 'var(--font-mono)',
    color: '#cdd6e0',
  },
  labelStyle: { color: '#7a8fa6', marginBottom: 4 },
}

// Build chart data from history snapshots
function buildData(history, accessor) {
  return history.map(h => ({
    ts: h.ts,
    app1: accessor(h.app1),
    app2: accessor(h.app2),
    app3: accessor(h.app3),
  }))
}

function ChartCard({ title, data, unit, apps, yDomain }) {
  return (
    <div style={cardStyle}>
      <div style={titleStyle}>{title}</div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
          <XAxis
            dataKey="ts"
            tick={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: '#445566' }}
            interval="preserveStartEnd"
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: '#445566' }}
            tickLine={false}
            axisLine={false}
            domain={yDomain || ['auto', 'auto']}
            width={40}
          />
          <Tooltip
            {...tooltipStyle}
            formatter={(v, name) => [v != null ? `${v}${unit}` : '—', name]}
          />
          <Line
            type="monotone" dataKey="app1" name={apps.app1.short}
            stroke={apps.app1.color} strokeWidth={1.5}
            dot={false} connectNulls
          />
          <Line
            type="monotone" dataKey="app2" name={apps.app2.short}
            stroke={apps.app2.color} strokeWidth={1.5}
            dot={false} connectNulls
          />
          <Line
            type="monotone" dataKey="app3" name={apps.app3.short}
            stroke={apps.app3.color} strokeWidth={1.5}
            dot={false} connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function Charts({ history, apps }) {
  const heapData  = buildData(history, d => d?._status === 'online' ? d.heapUsedMb   : null)
  const cpuData   = buildData(history, d => d?._status === 'online' ? Math.round(d.cpuPercent) : null)
  const gcData    = buildData(history, d => d?._status === 'online' ? d.gcPauseMaxMs : null)
  const threadData= buildData(history, d => d?._status === 'online' ? d.threadCount  : null)

  if (history.length < 2) {
    return (
      <div style={{ ...cardStyle, textAlign: 'center', padding: 40, color: 'var(--text2)', fontSize: 13 }}>
        Collecting data... charts appear after 2+ data points.
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <ChartCard title="Heap used (MB)"    data={heapData}   unit=" MB"  apps={apps} />
      <ChartCard title="CPU usage (%)"     data={cpuData}    unit="%"    apps={apps} yDomain={[0, 100]} />
      <ChartCard title="GC pause max (ms)" data={gcData}     unit=" ms"  apps={apps} />
      <ChartCard title="Thread count"      data={threadData} unit=""     apps={apps} />
    </div>
  )
}
