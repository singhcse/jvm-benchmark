import React, { useState, useEffect, useCallback } from 'react'
import { APPS } from '../services/api'

const AGENT_BASE = 'http://localhost:9999'

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
  agentStatus: (online) => ({
    display: 'inline-flex', alignItems: 'center', gap: 6,
    fontSize: 10, fontFamily: 'var(--font-mono)',
    padding: '3px 10px', borderRadius: 4, marginBottom: 14,
    background: online ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
    color: online ? '#22c55e' : '#ef4444',
    border: `1px solid ${online ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
  }),
  dot: (online) => ({
    width: 6, height: 6, borderRadius: '50%',
    background: online ? '#22c55e' : '#ef4444',
    animation: online ? 'pulse 2s infinite' : 'none',
  }),
  btnGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 8, marginBottom: 14,
  },
  btn: (color, colorM, colorB, loading) => ({
    padding: '10px 8px', borderRadius: 7, cursor: loading ? 'not-allowed' : 'pointer',
    background: colorM, border: `1px solid ${colorB}`,
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
    opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s',
  }),
  btnIcon: (color) => ({
    fontSize: 16, color,
  }),
  btnLabel: (color) => ({
    fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 600,
    color, textAlign: 'center',
  }),
  btnSub: {
    fontSize: 9, color: 'var(--text3)', fontFamily: 'var(--font-mono)', textAlign: 'center',
  },
  restartAll: (loading) => ({
    width: '100%', padding: '10px', borderRadius: 7,
    background: loading ? 'var(--bg3)' : 'rgba(239,68,68,0.15)',
    border: `1px solid ${loading ? 'var(--border2)' : 'rgba(239,68,68,0.35)'}`,
    cursor: loading ? 'not-allowed' : 'pointer', color: loading ? 'var(--text3)' : '#ef4444',
    fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginBottom: 14, transition: 'all 0.15s',
  }),
  spinner: {
    width: 12, height: 12, border: '2px solid currentColor',
    borderTopColor: 'transparent', borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },
  logBox: {
    background: 'var(--bg0)', border: '1px solid var(--border)',
    borderRadius: 6, padding: '10px 12px',
    fontFamily: 'var(--font-mono)', fontSize: 10,
    color: 'var(--text2)', height: 120, overflowY: 'auto',
    lineHeight: 1.7,
  },
  logLine: (isErr) => ({
    color: isErr ? '#ef4444' : 'var(--text2)',
  }),
  notRunning: {
    padding: '14px 16px', background: 'rgba(245,158,11,0.08)',
    border: '1px solid rgba(245,158,11,0.25)', borderRadius: 8,
    fontSize: 11, color: '#f59e0b', fontFamily: 'var(--font-mono)',
    lineHeight: 1.8, marginBottom: 14,
  },
  code: {
    display: 'block', background: 'var(--bg0)', padding: '6px 10px',
    borderRadius: 4, marginTop: 6, fontSize: 11, color: 'var(--text)',
  },
}

export default function RestartPanel({ onRestartTriggered }) {
  const [agentOnline, setAgentOnline] = useState(false)
  const [loading, setLoading]         = useState({})
  const [agentLog, setAgentLog]       = useState([])

  // Poll agent status every 2s
  useEffect(() => {
    let mounted = true
    async function checkAgent() {
      try {
        const res = await fetch(`${AGENT_BASE}/status`, { signal: AbortSignal.timeout(1500) })
        if (!mounted) return
        if (res.ok) {
          const data = await res.json()
          setAgentOnline(true)
          setAgentLog(data.log || [])
        }
      } catch {
        if (mounted) setAgentOnline(false)
      }
    }
    checkAgent()
    const t = setInterval(checkAgent, 2000)
    return () => { mounted = false; clearInterval(t) }
  }, [])

  const restart = useCallback(async (target) => {
    if (!agentOnline || loading[target]) return
    setLoading(prev => ({ ...prev, [target]: true }))
    try {
      const res = await fetch(`${AGENT_BASE}/restart/${target}`, { method: 'POST' })
      const data = await res.json()
      console.log('Restart response:', data)
      if (onRestartTriggered) onRestartTriggered(target)
    } catch (e) {
      console.error('Restart failed:', e)
    } finally {
      // Keep loading state for 3s to prevent double-clicks during startup
      setTimeout(() => setLoading(prev => ({ ...prev, [target]: false })), 3000)
    }
  }, [agentOnline, loading, onRestartTriggered])

  const appList = Object.values(APPS)

  return (
    <div style={s.wrap}>
      <div style={s.title}>Restart apps from dashboard</div>

      {/* Agent status */}
      <div style={s.agentStatus(agentOnline)}>
        <div style={s.dot(agentOnline)} />
        {agentOnline ? 'Agent online :9999' : 'Agent offline'}
      </div>

      {!agentOnline && (
        <div style={s.notRunning}>
          Restart agent is not running. Start it first:
          <code style={s.code}>
            cd {'{your project folder}'}
          </code>
          <code style={s.code}>
            node agent.js
          </code>
          Keep that terminal open. Then buttons will activate.
        </div>
      )}

      {/* Restart All */}
      <button
        style={s.restartAll(loading['all'] || !agentOnline)}
        onClick={() => restart('all')}
        disabled={!agentOnline || loading['all']}
      >
        {loading['all'] && <div style={s.spinner} />}
        {loading['all'] ? 'Restarting all 3...' : '⟳ Restart All 3 Apps'}
      </button>

      {/* Per-app buttons */}
      <div style={s.btnGrid}>
        {appList.map(app => (
          <button
            key={app.id}
            style={s.btn(app.color, app.colorM, app.colorB, loading[app.id] || !agentOnline)}
            onClick={() => restart(app.id)}
            disabled={!agentOnline || loading[app.id]}
          >
            {loading[app.id]
              ? <div style={{ ...s.spinner, borderColor: app.color, borderTopColor: 'transparent' }} />
              : <span style={s.btnIcon(app.color)}>↺</span>
            }
            <span style={s.btnLabel(app.color)}>{app.short}</span>
            <span style={s.btnSub}>:{app.port}</span>
          </button>
        ))}
      </div>

      {/* Agent log */}
      <div style={s.logBox}>
        {agentLog.length === 0
          ? <span style={{ color: 'var(--text3)' }}>Agent log appears here...</span>
          : agentLog.map((line, i) => (
              <div key={i} style={s.logLine(line.includes('ERROR') || line.includes('err'))}>
                {line}
              </div>
            ))
        }
      </div>
    </div>
  )
}
