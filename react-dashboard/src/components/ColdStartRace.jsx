import React, { useState, useRef, useCallback } from 'react'
import { APPS } from '../services/api'

const POLL_MS = 300  // poll every 300ms during race for fast updates

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
    letterSpacing: '0.7px', marginBottom: 6,
  },
  subtitle: {
    fontSize: 11, color: 'var(--text3)', marginBottom: 14, lineHeight: 1.6,
  },
  instructions: {
    background: 'var(--bg3)', borderRadius: 6,
    padding: '10px 14px', marginBottom: 14,
    fontSize: 11, color: 'var(--text2)', lineHeight: 1.8,
    fontFamily: 'var(--font-mono)',
    borderLeft: '3px solid var(--accent)',
  },
  startBtn: (racing) => ({
    padding: '8px 20px', fontSize: 12, fontFamily: 'var(--font-mono)',
    background: racing ? 'var(--bg3)' : 'rgba(59,130,246,0.85)',
    border: `1px solid ${racing ? 'var(--border2)' : 'rgba(59,130,246,0.5)'}`,
    borderRadius: 6, cursor: racing ? 'not-allowed' : 'pointer',
    color: racing ? 'var(--text2)' : '#fff',
    marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8,
  }),
  spinner: {
    width: 12, height: 12,
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },
  appRow: {
    display: 'flex', alignItems: 'center',
    gap: 12, marginBottom: 10,
  },
  appName: (color) => ({
    fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
    color, minWidth: 110, flexShrink: 0,
  }),
  track: {
    flex: 1, height: 28, background: 'var(--bg3)',
    borderRadius: 5, overflow: 'hidden', position: 'relative',
  },
  fill: (color, pct, done) => ({
    position: 'absolute', top: 0, left: 0, bottom: 0,
    width: pct + '%',
    background: done ? color : color + '88',
    borderRadius: 5,
    transition: 'width 0.25s ease',
    display: 'flex', alignItems: 'center', paddingLeft: 10,
  }),
  fillLabel: {
    fontFamily: 'var(--font-mono)', fontSize: 10,
    fontWeight: 600, color: '#fff', whiteSpace: 'nowrap',
  },
  timeVal: (color, done) => ({
    fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700,
    color: done ? color : 'var(--text3)', minWidth: 70, textAlign: 'right', flexShrink: 0,
  }),
  statusTag: (color, done) => ({
    fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
    padding: '2px 7px', borderRadius: 3, flexShrink: 0,
    background: done ? (color + '20') : 'var(--bg4)',
    color: done ? color : 'var(--text3)',
    minWidth: 52, textAlign: 'center',
  }),
  winnerBanner: (color) => ({
    marginTop: 14, padding: '10px 16px',
    background: color + '15', border: `1px solid ${color}40`,
    borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 12,
    color, display: 'flex', alignItems: 'center', gap: 10,
  }),
  resetBtn: {
    marginLeft: 'auto', padding: '4px 12px', fontSize: 10,
    fontFamily: 'var(--font-mono)',
    background: 'transparent', border: '1px solid var(--border2)',
    borderRadius: 4, cursor: 'pointer', color: 'var(--text3)',
  },
  tip: {
    marginTop: 10, fontSize: 10, color: 'var(--text3)',
    fontFamily: 'var(--font-mono)', lineHeight: 1.6,
  },
}

const INITIAL_STATE = {
  app1: { startupMs: null, done: false, elapsed: 0 },
  app2: { startupMs: null, done: false, elapsed: 0 },
  app3: { startupMs: null, done: false, elapsed: 0 },
}

async function pollStartup(appId, base, signal) {
  try {
    const res = await fetch(`${base}/api/startup`, { signal, cache: 'no-store' })
    if (!res.ok) return null
    const data = await res.json()
    return data.ready ? data.startupMs : null
  } catch {
    return null
  }
}

export default function ColdStartRace() {
  const [racing, setRacing]     = useState(false)
  const [results, setResults]   = useState(INITIAL_STATE)
  const [raceStart, setRaceStart] = useState(null)
  const [elapsed, setElapsed]   = useState(0)
  const [winner, setWinner]     = useState(null)
  const [hasRaced, setHasRaced] = useState(false)
  const timersRef = useRef([])
  const abortRef  = useRef(null)

  const reset = useCallback(() => {
    timersRef.current.forEach(clearInterval)
    timersRef.current = []
    if (abortRef.current) abortRef.current.abort()
    setRacing(false)
    setResults(INITIAL_STATE)
    setRaceStart(null)
    setElapsed(0)
    setWinner(null)
    setHasRaced(false)
  }, [])

  const startRace = useCallback(() => {
    if (racing) return
    reset()

    const start = Date.now()
    setRaceStart(start)
    setRacing(true)
    setHasRaced(true)
    setResults(INITIAL_STATE)
    setWinner(null)

    const abort = new AbortController()
    abortRef.current = abort

    // Elapsed timer — updates every 100ms
    const elapsedTimer = setInterval(() => {
      setElapsed(Date.now() - start)
    }, 100)
    timersRef.current.push(elapsedTimer)

    // Poll each app independently every 300ms
    const appEntries = Object.entries(APPS)
    const doneApps = new Set()

    appEntries.forEach(([appId, app]) => {
      const pollTimer = setInterval(async () => {
        if (doneApps.has(appId)) return
        const ms = await pollStartup(appId, app.base, abort.signal)
        if (ms != null && ms > 0) {
          doneApps.add(appId)
          setResults(prev => ({ ...prev, [appId]: { startupMs: ms, done: true } }))

          // First one done = winner
          setWinner(prev => prev || appId)

          // All done?
          if (doneApps.size === appEntries.length) {
            clearInterval(elapsedTimer)
            timersRef.current.forEach(clearInterval)
            timersRef.current = []
            setRacing(false)
          }
        }
      }, POLL_MS)
      timersRef.current.push(pollTimer)
    })

    // Safety timeout after 60s
    const safetyTimer = setTimeout(() => {
      timersRef.current.forEach(clearInterval)
      setRacing(false)
    }, 60000)
    timersRef.current.push(safetyTimer)
  }, [racing, reset])

  // Max startup for bar scaling
  const maxMs = Math.max(
    ...Object.values(results).map(r => r.startupMs || 0),
    1000
  )

  const appOrder = ['app1', 'app2', 'app3']

  return (
    <div style={s.wrap}>
      <div style={s.title}>Cold start race</div>
      <div style={s.subtitle}>
        Measures real startup time from JVM launch to first request ready.
      </div>

      <div style={s.instructions}>
        How to run a real cold-start race:<br/>
        1. Click "Start watching" below — dashboard starts polling<br/>
        2. In IntelliJ: stop all 3 apps (red square button)<br/>
        3. Restart all 3 apps (green run button)<br/>
        4. Dashboard detects each app coming online and shows exact startup time
      </div>

      <button style={s.startBtn(racing)} onClick={racing ? undefined : startRace}>
        {racing && <div style={s.spinner} />}
        {racing
          ? `Watching... ${(elapsed / 1000).toFixed(1)}s`
          : hasRaced ? 'Race again' : 'Start watching'}
      </button>

      {appOrder.map(appId => {
        const app = APPS[appId]
        const res = results[appId]
        const pct = res.startupMs ? Math.min((res.startupMs / maxMs) * 100, 100) : (racing ? 2 : 0)
        const label = res.done
          ? (res.startupMs / 1000).toFixed(2) + 's'
          : racing ? 'waiting...' : '—'

        return (
          <div key={appId} style={s.appRow}>
            <div style={s.appName(app.color)}>{app.short}</div>
            <div style={s.track}>
              {(racing || res.done) && (
                <div style={s.fill(app.color, pct, res.done)}>
                  {pct > 15 && (
                    <span style={s.fillLabel}>
                      {res.done ? (res.startupMs / 1000).toFixed(2) + 's' : '...'}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div style={s.timeVal(app.color, res.done)}>
              {res.done ? (res.startupMs / 1000).toFixed(2) + 's' : (racing ? '...' : '—')}
            </div>
            <div style={s.statusTag(app.color, res.done)}>
              {res.done ? 'READY' : racing ? 'waiting' : 'idle'}
            </div>
          </div>
        )
      })}

      {winner && (
        <div style={s.winnerBanner(APPS[winner].color)}>
          <span>Winner: {APPS[winner].label} — fastest to ready</span>
          <button style={s.resetBtn} onClick={reset}>reset</button>
        </div>
      )}

      <div style={s.tip}>
        Polls /api/startup every 300ms · startupMs = time from main() first line to DB seed complete
      </div>
    </div>
  )
}
