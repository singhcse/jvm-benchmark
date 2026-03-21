import React, { useState } from 'react'
import { runBenchmark, APPS } from '../services/api'

const SCENARIOS = [
  {
    id: 'cpu',
    label: 'CPU Intensive',
    desc: 'Fibonacci(40) — watch JIT warmup on App1/App2',
    endpoint: 'cpu-intensive',
    params: { n: 40 },
  },
  {
    id: 'io',
    label: 'I/O Simulation',
    desc: '200ms sleep — virtual threads shine on App2',
    endpoint: 'io-intensive',
    params: { sleepMs: 200 },
  },
  {
    id: 'memory',
    label: 'Memory / GC',
    desc: 'Allocate 200MB — triggers GC on App1/App2',
    endpoint: 'memory-test',
    params: { allocMb: 200 },
  },
  {
    id: 'db',
    label: 'DB Call',
    desc: 'SELECT from work_items — real H2 query',
    endpoint: 'db-call',
    params: {},
  },
]

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
  grid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 },
  btn: (active) => ({
    padding: '10px 12px',
    background: active ? 'rgba(59,130,246,0.15)' : 'var(--bg3)',
    border: `1px solid ${active ? 'rgba(59,130,246,0.4)' : 'var(--border2)'}`,
    borderRadius: 8, cursor: 'pointer', textAlign: 'left',
    color: 'var(--text)', transition: 'all 0.15s',
  }),
  btnName: { fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 3, color: 'var(--text)' },
  btnDesc: { fontSize: 10, color: 'var(--text2)', lineHeight: 1.4 },
  results: { display: 'flex', flexDirection: 'column', gap: 8 },
  resultRow: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '8px 12px', background: 'var(--bg3)',
    borderRadius: 6, fontSize: 12,
  },
  appTag: (color) => ({
    fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
    color, minWidth: 80,
  }),
  bar: { flex: 1, height: 6, background: 'var(--bg4)', borderRadius: 3, overflow: 'hidden' },
  barFill: (color, pct) => ({
    height: '100%', background: color, borderRadius: 3,
    width: pct + '%', transition: 'width 0.4s ease',
  }),
  durVal: { fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text2)', minWidth: 70, textAlign: 'right' },
  thread: (color) => ({
    fontFamily: 'var(--font-mono)', fontSize: 10, color,
    background: color + '15', padding: '1px 6px', borderRadius: 3, marginLeft: 6,
  }),
  spinner: {
    width: 14, height: 14, border: '2px solid var(--bg4)',
    borderTopColor: 'var(--accent)', borderRadius: '50%',
    animation: 'spin 0.7s linear infinite', display: 'inline-block',
  },
  runBtn: (running) => ({
    marginTop: 12, padding: '8px 20px',
    background: running ? 'var(--bg3)' : 'rgba(59,130,246,0.85)',
    border: '1px solid rgba(59,130,246,0.4)',
    borderRadius: 6, cursor: running ? 'not-allowed' : 'pointer',
    color: running ? 'var(--text2)' : '#fff',
    fontSize: 12, fontFamily: 'var(--font-mono)',
    fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8,
  }),
  note: { fontSize: 11, color: 'var(--text3)', marginTop: 8, fontFamily: 'var(--font-mono)' },
}

export default function BenchmarkRunner({ apps }) {
  const [selected, setSelected]   = useState('cpu')
  const [running, setRunning]     = useState(false)
  const [results, setResults]     = useState([])

  const scenario = SCENARIOS.find(s => s.id === selected)

  async function run() {
    if (running) return
    setRunning(true)
    setResults([])

    const appIds = ['app1', 'app2', 'app3']
    const promises = appIds.map(id =>
      runBenchmark(id, scenario.endpoint, scenario.params).then(r => ({
        appId: id,
        app: apps[id],
        ...r,
      }))
    )

    // Show results as they come in
    for (const p of promises) {
      const r = await p
      setResults(prev => {
        const next = [...prev, r]
        return next
      })
    }
    setRunning(false)
  }

  const maxMs = Math.max(...results.map(r => r._clientMs || 0), 1)

  return (
    <div style={s.wrap}>
      <div style={s.title}>Benchmark runner</div>

      <div style={s.grid}>
        {SCENARIOS.map(sc => (
          <button
            key={sc.id}
            style={s.btn(selected === sc.id)}
            onClick={() => { setSelected(sc.id); setResults([]) }}
          >
            <span style={s.btnName}>{sc.label}</span>
            <span style={s.btnDesc}>{sc.desc}</span>
          </button>
        ))}
      </div>

      {results.length > 0 && (
        <div style={s.results}>
          {results.map(r => (
            <div key={r.appId} style={s.resultRow}>
              <span style={s.appTag(r.app.color)}>{r.app.short}</span>
              <div style={s.bar}>
                <div style={s.barFill(r.app.color, (r._clientMs / maxMs) * 100)} />
              </div>
              <span style={s.durVal}>
                {r._status === 'error' ? 'OFFLINE' : r._clientMs + ' ms'}
              </span>
              {r.threadType && (
                <span style={s.thread(r.app.color)}>{r.threadType}</span>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button style={s.runBtn(running)} onClick={run} disabled={running}>
          {running && <div style={s.spinner} />}
          {running ? 'Running...' : `Run ${scenario.label}`}
        </button>
      </div>

      <div style={s.note}>
        Calls GET /api/{scenario.endpoint} on all 3 apps simultaneously
        {scenario.params && Object.keys(scenario.params).length > 0 &&
          ' · params: ' + JSON.stringify(scenario.params)
        }
      </div>
    </div>
  )
}
