import React from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
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

const subStyle = {
  fontSize: 10,
  fontFamily: 'var(--font-mono)',
  color: 'var(--text3)',
  marginTop: -10,
  marginBottom: 10,
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

function buildData(history, accessor) {
  return history.map(h => ({
    ts:   h.ts,
    app1: accessor(h.app1),
    app2: accessor(h.app2),
    app3: accessor(h.app3),
  }))
}

function ChartCard({ title, subtitle, data, unit, apps, yDomain, refLine, refLabel }) {
  return (
    <div style={cardStyle}>
      <div style={titleStyle}>{title}</div>
      {subtitle && <div style={subStyle}>{subtitle}</div>}
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
          {refLine && (
            <ReferenceLine
              y={refLine}
              stroke="#ef4444"
              strokeDasharray="4 2"
              label={{ value: refLabel || refLine, fill: '#ef4444', fontSize: 10, fontFamily: 'var(--font-mono)' }}
            />
          )}
          <Line type="monotone" dataKey="app1" name={apps.app1.short} stroke={apps.app1.color} strokeWidth={1.5} dot={false} connectNulls />
          <Line type="monotone" dataKey="app2" name={apps.app2.short} stroke={apps.app2.color} strokeWidth={1.5} dot={false} connectNulls />
          <Line type="monotone" dataKey="app3" name={apps.app3.short} stroke={apps.app3.color} strokeWidth={1.5} dot={false} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function Charts({ history, apps }) {
  const heapData  = buildData(history, d => d?._status === 'online' ? d.heapUsedMb    : null)
  const cpuData   = buildData(history, d => d?._status === 'online' ? Math.round(d.cpuPercent) : null)
  const gcData    = buildData(history, d => d?._status === 'online' ? d.gcPauseMaxMs  : null)

  // JVM background thread count (always ~20 at idle)
  const threadData = buildData(history, d => d?._status === 'online' ? d.threadCount : null)

  // Peak burst threads — only non-zero after a thread stress test
  // App1/App3: peak platform threads (max 200)
  // App2: peak virtual threads (can be thousands, but show carrier threads for fair comparison)
  const burstData = buildData(history, d => {
    if (d?._status !== 'online') return null
    return d.peakBurstThreads > 0 ? d.peakBurstThreads : null
  })

  const hasBurstData = history.some(h =>
    (h.app1?.peakBurstThreads > 0) ||
    (h.app2?.peakBurstThreads > 0) ||
    (h.app3?.peakBurstThreads > 0)
  )

  if (history.length < 2) {
    return (
      <div style={{ ...cardStyle, textAlign: 'center', padding: 40, color: 'var(--text2)', fontSize: 13 }}>
        Collecting data... charts appear after 2+ data points.
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <ChartCard
        title="Heap used (MB)"
        data={heapData} unit=" MB" apps={apps}
      />
      <ChartCard
        title="CPU usage (%)"
        data={cpuData} unit="%" apps={apps} yDomain={[0, 100]}
      />
      <ChartCard
        title="GC pause max (ms)"
        data={gcData} unit=" ms" apps={apps}
      />
      <ChartCard
        title="JVM thread count (idle background)"
        subtitle="Always ~20 at idle — GC, JIT, Tomcat pool. Use Thread Stress Demo below for burst data."
        data={threadData} unit="" apps={apps}
      />
      {hasBurstData && (
        <ChartCard
          title="Peak burst threads (after stress test)"
          subtitle="App1+App3: platform threads (hard limit 200). App2: peak virtual threads spawned."
          data={burstData} unit="" apps={apps}
          refLine={200}
          refLabel="200 platform thread limit"
        />
      )}
    </div>
  )
}
