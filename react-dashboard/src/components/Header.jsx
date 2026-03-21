import React from 'react'
import { APPS } from '../services/api'

const s = {
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 24, flexWrap: 'wrap', gap: 12,
  },
  left: {},
  title: {
    fontSize: 20, fontWeight: 600, fontFamily: 'var(--font-mono)',
    letterSpacing: '-0.5px', color: 'var(--text)',
  },
  subtitle: { fontSize: 12, color: 'var(--text2)', marginTop: 3 },
  right: { display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' },
  statusRow: { display: 'flex', gap: 14, alignItems: 'center' },
  status: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text2)' },
  dot: (online, color) => ({
    width: 7, height: 7, borderRadius: '50%',
    background: online ? color : '#445566',
    animation: online ? 'pulse 2s infinite' : 'none',
  }),
  controls: { display: 'flex', gap: 6 },
  btn: (active) => ({
    padding: '5px 12px', fontSize: 11, fontFamily: 'var(--font-mono)',
    background: active ? 'var(--accent)' : 'var(--bg3)',
    border: `1px solid ${active ? 'var(--accent)' : 'var(--border2)'}`,
    borderRadius: 5, cursor: 'pointer',
    color: active ? '#fff' : 'var(--text2)',
    transition: 'all 0.15s',
  }),
  refreshBtn: {
    padding: '5px 12px', fontSize: 11, fontFamily: 'var(--font-mono)',
    background: 'var(--bg3)', border: '1px solid var(--border2)',
    borderRadius: 5, cursor: 'pointer', color: 'var(--text2)',
    transition: 'all 0.15s',
  },
  clock: { fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text3)' },
}

const INTERVALS = [
  { label: '2s', ms: 2000 },
  { label: '5s', ms: 5000 },
  { label: '10s', ms: 10000 },
]

export default function Header({ metrics, interval, setIntervalMs, refresh, lastUpdated }) {
  return (
    <div style={s.header}>
      <div style={s.left}>
        <div style={s.title}>JVM Performance Observatory</div>
        <div style={s.subtitle}>
          Java 8 G1GC  ·  Java 21 ZGC+Loom  ·  GraalVM Native — live comparison
        </div>
      </div>

      <div style={s.right}>
        <div style={s.statusRow}>
          {Object.values(APPS).map(app => {
            const online = metrics[app.id]?._status === 'online'
            return (
              <div key={app.id} style={s.status}>
                <div style={s.dot(online, app.color)} />
                :{app.port}
              </div>
            )
          })}
        </div>

        <div style={s.controls}>
          {INTERVALS.map(({ label, ms }) => (
            <button key={ms} style={s.btn(interval === ms)} onClick={() => setIntervalMs(ms)}>
              {label}
            </button>
          ))}
        </div>

        <button style={s.refreshBtn} onClick={refresh}>↺ Now</button>

        {lastUpdated && (
          <div style={s.clock}>
            {lastUpdated.toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  )
}
