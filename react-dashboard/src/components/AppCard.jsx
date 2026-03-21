import React from 'react'

const s = {
  card: (color, colorM, colorB, online) => ({
    background: colorM,
    border: `1px solid ${online ? colorB : 'rgba(255,255,255,0.06)'}`,
    borderRadius: 12,
    padding: '16px 20px',
    position: 'relative',
    opacity: online ? 1 : 0.55,
    animation: 'fadeIn 0.4s ease',
    transition: 'opacity 0.3s',
  }),
  badge: (color) => ({
    display: 'inline-block',
    fontSize: 10,
    fontFamily: 'var(--font-mono)',
    fontWeight: 600,
    letterSpacing: '0.5px',
    padding: '2px 8px',
    borderRadius: 4,
    background: 'rgba(255,255,255,0.08)',
    color,
    marginBottom: 6,
  }),
  title: { fontSize: 14, fontWeight: 600, marginBottom: 4, color: 'var(--text)' },
  stack: { fontSize: 11, color: 'var(--text2)', fontFamily: 'var(--font-mono)', lineHeight: 1.7 },
  startup: { position: 'absolute', right: 18, top: 16, textAlign: 'right' },
  startupNum: (color) => ({ fontSize: 22, fontWeight: 600, fontFamily: 'var(--font-mono)', color }),
  startupLabel: { fontSize: 10, color: 'var(--text2)', marginTop: 1 },
  offlineBadge: {
    position: 'absolute', top: 12, right: 12,
    fontSize: 10, fontFamily: 'var(--font-mono)',
    color: 'var(--warn)', background: 'rgba(245,158,11,0.12)',
    padding: '2px 7px', borderRadius: 4,
  },
  dot: (online, color) => ({
    display: 'inline-block',
    width: 7, height: 7, borderRadius: '50%',
    background: online ? color : '#445566',
    marginRight: 6,
    animation: online ? 'pulse 2s infinite' : 'none',
  }),
}

export default function AppCard({ appMeta, data }) {
  const online = data?._status === 'online'
  const { color, colorM, colorB, label, short, gc, compiler, threads, port } = appMeta

  const startupSec = data?.startupMs ? (data.startupMs / 1000).toFixed(2) + 's' : '—'

  return (
    <div style={s.card(color, colorM, colorB, online)}>
      {!online && <div style={s.offlineBadge}>OFFLINE</div>}

      <div style={s.badge(color)}>
        <span style={s.dot(online, color)} />
        :{port}
      </div>

      <div style={s.title}>{label}</div>

      <div style={s.stack}>
        GC: {gc} · Compiler: {compiler}<br />
        Threads: {threads}
      </div>

      <div style={s.startup}>
        <div style={s.startupNum(color)}>{startupSec}</div>
        <div style={s.startupLabel}>startup</div>
      </div>
    </div>
  )
}
