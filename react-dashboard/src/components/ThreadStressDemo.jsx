import React, { useState, useRef, useCallback, useEffect } from 'react'
import { APPS } from '../services/api'

const THREAD_LIMIT = 200

const CONCURRENCY_PRESETS = [
  { label: '50',   value: 50,   desc: 'Safe for all'  },
  { label: '100',  value: 100,  desc: 'Near limit'    },
  { label: '200',  value: 200,  desc: 'At limit'      },
  { label: '500',  value: 500,  desc: 'App1/3 crash'  },
  { label: '1000', value: 1000, desc: 'Heavy stress'  },
  { label: '5000', value: 5000, desc: 'Extreme'       },
]

const SLEEP_PRESETS = [
  { label: '50ms',   value: 50   },
  { label: '200ms',  value: 200  },
  { label: '500ms',  value: 500  },
  { label: '1000ms', value: 1000 },
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
    letterSpacing: '0.7px', marginBottom: 4,
  },
  subtitle: {
    fontSize: 11, color: 'var(--text3)',
    fontFamily: 'var(--font-mono)', marginBottom: 16, lineHeight: 1.7,
  },

  // Controls row
  controlsWrap: {
    background: 'var(--bg3)', borderRadius: 8,
    padding: '12px 14px', marginBottom: 16,
    display: 'flex', flexDirection: 'column', gap: 10,
  },
  controlRow: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  controlLabel: {
    fontSize: 10, fontFamily: 'var(--font-mono)',
    color: 'var(--text2)', minWidth: 90, flexShrink: 0,
    textTransform: 'uppercase', letterSpacing: '0.5px',
  },

  // Preset buttons
  presetBtn: (active, color) => ({
    padding: '5px 12px', borderRadius: 5,
    fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
    cursor: 'pointer', transition: 'all 0.15s',
    background: active ? (color || 'var(--accent)') + (active ? 'dd' : '22') : 'var(--bg4)',
    border: `1px solid ${active ? (color || 'var(--accent)') : 'var(--border2)'}`,
    color: active ? '#fff' : 'var(--text2)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
  }),
  presetLabel: { fontSize: 11, fontWeight: 700 },
  presetDesc:  { fontSize: 8, opacity: 0.8 },

  // Danger indicator for high concurrency
  dangerTag: (val) => ({
    fontSize: 9, fontWeight: 700, padding: '2px 7px',
    borderRadius: 3, fontFamily: 'var(--font-mono)',
    background: val >= 5000 ? 'rgba(239,68,68,0.15)'
               : val >= 1000 ? 'rgba(245,158,11,0.15)'
               : val >= 200  ? 'rgba(239,68,68,0.1)'
               : 'rgba(34,197,94,0.1)',
    color: val >= 5000 ? '#ef4444'
         : val >= 1000 ? '#f59e0b'
         : val >= 200  ? '#ef4444'
         : '#22c55e',
    border: '1px solid currentColor',
  }),

  // Fire / stop buttons
  actionRow: { display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 },
  fireBtn: (running, concurrency) => ({
    flex: 1, padding: '10px', borderRadius: 7,
    fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700,
    cursor: running ? 'not-allowed' : 'pointer',
    background: running ? 'var(--bg4)'
              : concurrency >= 1000 ? 'rgba(239,68,68,0.85)'
              : 'rgba(239,68,68,0.75)',
    border: `1px solid ${running ? 'var(--border)' : 'rgba(239,68,68,0.6)'}`,
    color: running ? 'var(--text3)' : '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    transition: 'all 0.15s',
  }),
  stopBtn: {
    padding: '10px 20px', borderRadius: 7,
    background: 'var(--bg3)', border: '1px solid var(--border2)',
    color: 'var(--text2)', fontFamily: 'var(--font-mono)',
    fontSize: 12, cursor: 'pointer',
  },
  resetBtn: {
    padding: '10px 16px', borderRadius: 7,
    background: 'var(--bg3)', border: '1px solid var(--border2)',
    color: 'var(--text3)', fontFamily: 'var(--font-mono)',
    fontSize: 11, cursor: 'pointer',
  },
  waveBadge: {
    fontSize: 11, fontFamily: 'var(--font-mono)',
    color: 'var(--text2)', padding: '4px 10px',
    background: 'var(--bg4)', borderRadius: 4,
    border: '1px solid var(--border)',
  },
  spinner: {
    width: 12, height: 12,
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff', borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },

  // App panels
  panels: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 14 },
  panel: (color, colorM, colorB) => ({
    background: colorM, border: `1px solid ${colorB}`,
    borderRadius: 10, padding: '12px 14px',
  }),
  panelTitle: (color) => ({
    fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)',
    color, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6,
  }),
  threadTag: (color) => ({
    fontSize: 9, padding: '1px 6px', borderRadius: 3,
    background: color + '20', color, fontWeight: 700,
  }),
  statusBadge: (ok) => ({
    display: 'inline-flex', alignItems: 'center', gap: 5,
    fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)',
    padding: '3px 8px', borderRadius: 4, marginBottom: 8,
    background: ok ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
    color: ok ? '#22c55e' : '#ef4444',
    border: `1px solid ${ok ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
  }),
  statusDot: (ok) => ({
    width: 6, height: 6, borderRadius: '50%',
    background: ok ? '#22c55e' : '#ef4444',
    animation: ok ? 'none' : 'pulse 0.8s infinite',
  }),
  meterWrap: { marginBottom: 8 },
  meterLabel: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    fontSize: 10, fontFamily: 'var(--font-mono)',
    color: 'var(--text2)', marginBottom: 3,
  },
  meterTrack: { height: 16, background: 'var(--bg0)', borderRadius: 3, overflow: 'hidden', position: 'relative' },
  meterFill: (color, pct, danger) => ({
    height: '100%', borderRadius: 3,
    width: Math.min(pct, 100) + '%',
    background: danger && pct > 80 ? '#ef4444' : color,
    transition: 'width 0.2s ease, background 0.2s ease',
    display: 'flex', alignItems: 'center', paddingLeft: 6,
  }),
  meterText: { fontSize: 9, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)' },
  stats: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 8px' },
  statRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    fontSize: 10, fontFamily: 'var(--font-mono)',
    padding: '3px 0', borderBottom: '1px solid var(--border)',
  },
  statKey: { color: 'var(--text3)' },
  statVal: (color) => ({ color, fontWeight: 700 }),
  bigNum: (color, hasValue) => ({
    fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-mono)',
    color: hasValue ? color : 'var(--text3)',
    textAlign: 'center', marginTop: 8, lineHeight: 1,
  }),
  bigLabel: { fontSize: 9, color: 'var(--text3)', fontFamily: 'var(--font-mono)', textAlign: 'center', marginTop: 2 },

  // Info
  infoBox: {
    background: 'var(--bg3)', borderRadius: 6,
    padding: '10px 14px', marginTop: 2,
    fontSize: 11, color: 'var(--text2)',
    fontFamily: 'var(--font-mono)', lineHeight: 1.8,
    borderLeft: '3px solid var(--accent)',
  },
}

const INITIAL = { ok: 0, rejected: 0, active: 0, osThreads: 0, utilPct: 0, status: 'idle' }

export default function ThreadStressDemo() {
  const [concurrency, setConcurrency] = useState(50)
  const [sleepMs,     setSleepMs]     = useState(200)
  const [running,     setRunning]     = useState(false)
  const [waves,       setWaves]       = useState(0)
  const [results,     setResults]     = useState({ app1: {...INITIAL}, app2: {...INITIAL}, app3: {...INITIAL} })
  const stopRef    = useRef(false)
  const statsTimer = useRef(null)

  // Poll /thread-demo/stats during run
  useEffect(() => {
    if (!running) { clearInterval(statsTimer.current); return }
    statsTimer.current = setInterval(async () => {
      const updates = await Promise.all(
        Object.entries(APPS).map(async ([id, app]) => {
          try {
            const res = await fetch(`${app.base}/api/thread-demo/stats`, { signal: AbortSignal.timeout(1500) })
            if (!res.ok) return [id, null]
            const d = await res.json()
            return [id, {
              active:    d.activeRequests  || 0,
              osThreads: d.totalOsThreads  || d.carrierThreads || 0,
              utilPct:   d.utilizationPct  || 0,
              rejected:  d.rejectedCount   || 0,
              status:    d.rejectedCount > 0 ? 'REJECTING' : 'OK',
            }]
          } catch { return [id, null] }
        })
      )
      setResults(prev => {
        const next = { ...prev }
        updates.forEach(([id, data]) => { if (data) next[id] = { ...prev[id], ...data } })
        return next
      })
    }, 300)
    return () => clearInterval(statsTimer.current)
  }, [running])

  const fire = useCallback(async () => {
    if (running) return
    stopRef.current = false
    setRunning(true)
    setWaves(0)
    setResults({ app1: {...INITIAL, status:'running'}, app2: {...INITIAL, status:'running'}, app3: {...INITIAL, status:'running'} })

    let wave = 0
    while (!stopRef.current) {
      wave++
      setWaves(wave)

      const reqs = Object.entries(APPS).flatMap(([id, app]) =>
        Array.from({ length: concurrency }, () =>
          fetch(`${app.base}/api/thread-demo?sleepMs=${sleepMs}`, { signal: AbortSignal.timeout(sleepMs + 5000) })
            .then(r => ({ id, ok: r.status === 200 }))
            .catch(() => ({ id, ok: false }))
        )
      )

      const settled = await Promise.allSettled(reqs)
      const tally = { app1:{ok:0,rej:0}, app2:{ok:0,rej:0}, app3:{ok:0,rej:0} }
      settled.forEach(r => {
        if (r.status === 'fulfilled') {
          const { id, ok } = r.value
          if (ok) tally[id].ok++; else tally[id].rej++
        }
      })

      setResults(prev => {
        const next = { ...prev }
        Object.entries(tally).forEach(([id, t]) => {
          next[id] = { ...prev[id], ok: (prev[id].ok||0)+t.ok, rejected: (prev[id].rejected||0)+t.rej, status: t.rej>0?'REJECTING':'OK' }
        })
        return next
      })

      if (stopRef.current) break
      await new Promise(r => setTimeout(r, 200))
    }
    setRunning(false)
  }, [running, concurrency, sleepMs])

  const stop  = () => { stopRef.current = true; setRunning(false) }
  const reset = () => { stopRef.current = true; setRunning(false); setWaves(0); setResults({ app1:{...INITIAL}, app2:{...INITIAL}, app3:{...INITIAL} }) }

  return (
    <div style={s.wrap}>
      <div style={s.title}>Platform threads vs Virtual threads — live stress test</div>
      <div style={s.subtitle}>
        Increase concurrent requests until App1 + App3 start rejecting (platform threads exhaust at ~{THREAD_LIMIT}).
        App2 virtual threads never reject — handles thousands with just ~8 OS threads.
      </div>

      {/* Controls */}
      <div style={s.controlsWrap}>

        {/* Concurrency presets */}
        <div style={s.controlRow}>
          <span style={s.controlLabel}>Concurrent</span>
          {CONCURRENCY_PRESETS.map(p => {
            const isActive = concurrency === p.value
            const btnColor = p.value >= 5000 ? '#ef4444'
                           : p.value >= 1000 ? '#f59e0b'
                           : p.value >= 200  ? '#ef4444'
                           : '#22c55e'
            return (
              <button
                key={p.value}
                style={s.presetBtn(isActive, btnColor)}
                onClick={() => !running && setConcurrency(p.value)}
                disabled={running}
              >
                <span style={s.presetLabel}>{p.label}</span>
                <span style={s.presetDesc}>{p.desc}</span>
              </button>
            )
          })}
          <span style={s.dangerTag(concurrency)}>
            {concurrency >= 5000 ? 'EXTREME — App1+3 will reject ~96%'
           : concurrency >= 1000 ? 'HEAVY — App1+3 reject ~80%'
           : concurrency >= 500  ? 'STRESS — App1+3 reject ~60%'
           : concurrency >= 200  ? 'AT LIMIT — App1+3 start rejecting'
           : concurrency >= 100  ? 'NEAR LIMIT'
           : 'SAFE — all handle OK'}
          </span>
        </div>

        {/* Sleep presets */}
        <div style={s.controlRow}>
          <span style={s.controlLabel}>I/O sleep</span>
          {SLEEP_PRESETS.map(p => (
            <button
              key={p.value}
              style={s.presetBtn(sleepMs === p.value, 'var(--accent)')}
              onClick={() => !running && setSleepMs(p.value)}
              disabled={running}
            >
              <span style={s.presetLabel}>{p.label}</span>
            </button>
          ))}
          <span style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
            each request blocks for this long (simulates DB query / API call)
          </span>
        </div>

        {/* Fire / Stop / Reset */}
        <div style={s.actionRow}>
          {running ? (
            <>
              <span style={s.waveBadge}>Wave {waves} · {concurrency * 3} requests/wave</span>
              <div style={{ flex: 1 }} />
              <button style={s.stopBtn} onClick={stop}>Stop</button>
            </>
          ) : (
            <>
              <button style={s.resetBtn} onClick={reset}>Reset</button>
              <button style={s.fireBtn(false, concurrency)} onClick={fire}>
                {concurrency >= 1000 && <span>⚠</span>}
                Fire {concurrency.toLocaleString()} concurrent threads
              </button>
            </>
          )}
        </div>
      </div>

      {/* App panels */}
      <div style={s.panels}>
        {Object.values(APPS).map(app => {
          const r      = results[app.id]
          const isVirt = app.id === 'app2'
          const pct    = isVirt
            ? Math.min((r.active / concurrency) * 30, 30)
            : Math.min((r.active / THREAD_LIMIT) * 100, 100)
          const danger = !isVirt && pct > 75
          const isRej  = r.rejected > 0
          const total  = r.ok + r.rejected
          const rejPct = total > 0 ? ((r.rejected / total) * 100).toFixed(0) : 0

          return (
            <div key={app.id} style={s.panel(app.color, app.colorM, app.colorB)}>

              <div style={s.panelTitle(app.color)}>
                {app.short}
                <span style={s.threadTag(app.color)}>
                  {isVirt ? 'VIRTUAL' : 'PLATFORM'}
                </span>
              </div>

              <div style={s.statusBadge(!isRej)}>
                <div style={s.statusDot(!isRej)} />
                {r.status === 'idle'    ? 'IDLE'
                 : r.status === 'running' && !isRej ? 'HANDLING ALL OK'
                 : isRej ? `REJECTING — ${rejPct}% dropped`
                 : 'HANDLING OK'}
              </div>

              {/* Thread utilization */}
              <div style={s.meterWrap}>
                <div style={s.meterLabel}>
                  <span>Thread pool usage</span>
                  <span style={{ color: danger ? '#ef4444' : app.color, fontWeight: 700 }}>
                    {isVirt
                      ? `${r.active} virtual / ~8 OS`
                      : `${r.active} / ${THREAD_LIMIT} OS`}
                  </span>
                </div>
                <div style={s.meterTrack}>
                  <div style={s.meterFill(app.color, isVirt ? 5 : pct, !isVirt)}>
                    {pct > 20 && <span style={s.meterText}>{isVirt ? '∞' : Math.round(pct) + '%'}</span>}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div style={s.stats}>
                <div style={s.statRow}>
                  <span style={s.statKey}>succeeded</span>
                  <span style={s.statVal('#22c55e')}>{r.ok.toLocaleString()}</span>
                </div>
                <div style={s.statRow}>
                  <span style={s.statKey}>rejected</span>
                  <span style={s.statVal(r.rejected > 0 ? '#ef4444' : 'var(--text3)')}>
                    {r.rejected.toLocaleString()}
                  </span>
                </div>
                <div style={s.statRow}>
                  <span style={s.statKey}>OS threads</span>
                  <span style={s.statVal(app.color)}>{r.osThreads || '—'}</span>
                </div>
                <div style={s.statRow}>
                  <span style={s.statKey}>thread limit</span>
                  <span style={s.statVal('var(--text2)')}>
                    {isVirt ? '∞ unlimited' : THREAD_LIMIT}
                  </span>
                </div>
              </div>

              {/* Big rejection number */}
              <div style={s.bigNum(isRej ? '#ef4444' : isVirt ? '#22c55e' : 'var(--text3)', isRej || isVirt)}>
                {isVirt ? '0' : r.rejected > 0 ? r.rejected.toLocaleString() : '—'}
              </div>
              <div style={s.bigLabel}>
                {isVirt ? 'rejections — virtual threads never exhaust' : 'requests rejected (503)'}
              </div>

            </div>
          )
        })}
      </div>

      {/* Explainer */}
      <div style={s.infoBox}>
        <strong style={{ color: 'var(--text)' }}>Why this happens:</strong><br />
        <span style={{ color: APPS.app1.color }}>App1 + App3 (platform threads)</span> — each request occupies 1 OS thread for the full {sleepMs}ms sleep.
        Tomcat has ~{THREAD_LIMIT} threads. Above {THREAD_LIMIT} concurrent → queue fills → 503 rejections.<br />
        <span style={{ color: APPS.app2.color }}>App2 (virtual threads / Loom)</span> — Thread.sleep() parks the virtual thread and
        releases the carrier OS thread immediately. With {concurrency.toLocaleString()} concurrent requests,
        only ~8 OS threads are needed. Zero rejections, same {sleepMs}ms response time.
      </div>
    </div>
  )
}
