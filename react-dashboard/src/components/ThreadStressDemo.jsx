import React, { useState, useCallback } from 'react'
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
  wrap:     { background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, padding:'16px 20px' },
  title:    { fontSize:11, fontFamily:'var(--font-mono)', color:'var(--text2)', textTransform:'uppercase', letterSpacing:'0.7px', marginBottom:4 },
  subtitle: { fontSize:11, color:'var(--text3)', fontFamily:'var(--font-mono)', marginBottom:14, lineHeight:1.7 },
  controlsWrap: { background:'var(--bg3)', borderRadius:8, padding:'12px 14px', marginBottom:16, display:'flex', flexDirection:'column', gap:10 },
  controlRow:   { display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' },
  controlLabel: { fontSize:10, fontFamily:'var(--font-mono)', color:'var(--text2)', minWidth:90, flexShrink:0, textTransform:'uppercase', letterSpacing:'0.5px' },
  presetBtn: (active, color) => ({
    padding:'5px 12px', borderRadius:5, fontFamily:'var(--font-mono)', fontSize:11, fontWeight:600,
    cursor:'pointer', transition:'all 0.15s',
    background: active ? color : 'var(--bg4)',
    border: `1px solid ${active ? color : 'var(--border2)'}`,
    color: active ? '#fff' : 'var(--text2)',
    display:'flex', flexDirection:'column', alignItems:'center', gap:1,
  }),
  presetLabel: { fontSize:11, fontWeight:700 },
  presetDesc:  { fontSize:8, opacity:0.8 },
  dangerTag: (val) => ({
    fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:3, fontFamily:'var(--font-mono)',
    background: val>=200 ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.1)',
    color: val>=5000?'#ef4444':val>=1000?'#f59e0b':val>=200?'#ef4444':'#22c55e',
    border:'1px solid currentColor',
  }),
  actionRow: { display:'flex', gap:8, alignItems:'center', marginTop:4 },
  fireBtn: (running) => ({
    flex:1, padding:'10px', borderRadius:7, fontFamily:'var(--font-mono)', fontSize:12, fontWeight:700,
    cursor: running?'not-allowed':'pointer',
    background: running?'var(--bg4)':'rgba(239,68,68,0.8)',
    border: `1px solid ${running?'var(--border)':'rgba(239,68,68,0.6)'}`,
    color: running?'var(--text3)':'#fff',
    display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'all 0.15s',
  }),
  resetBtn: { padding:'10px 16px', borderRadius:7, background:'var(--bg3)', border:'1px solid var(--border2)', color:'var(--text3)', fontFamily:'var(--font-mono)', fontSize:11, cursor:'pointer' },
  spinner: { width:12, height:12, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite' },
  panels: { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:14 },
  panel: (c,cm,cb) => ({ background:cm, border:`1px solid ${cb}`, borderRadius:10, padding:'12px 14px' }),
  panelTitle: (c) => ({ fontSize:11, fontWeight:700, fontFamily:'var(--font-mono)', color:c, marginBottom:8, display:'flex', alignItems:'center', gap:6 }),
  threadTag: (c) => ({ fontSize:9, padding:'1px 6px', borderRadius:3, background:c+'20', color:c, fontWeight:700 }),
  statusBadge: (ok) => ({
    display:'inline-flex', alignItems:'center', gap:5, fontSize:10, fontWeight:700,
    fontFamily:'var(--font-mono)', padding:'3px 8px', borderRadius:4, marginBottom:10,
    background: ok?'rgba(34,197,94,0.1)':'rgba(239,68,68,0.1)',
    color: ok?'#22c55e':'#ef4444',
    border: `1px solid ${ok?'rgba(34,197,94,0.3)':'rgba(239,68,68,0.3)'}`,
  }),
  statusDot: (ok) => ({ width:6, height:6, borderRadius:'50%', background:ok?'#22c55e':'#ef4444', animation:ok?'none':'pulse 0.8s infinite' }),

  // Thread count visualizer bars
  threadSection: { marginBottom:10 },
  threadRowLabel: { fontSize:10, fontFamily:'var(--font-mono)', color:'var(--text2)', marginBottom:3, display:'flex', justifyContent:'space-between' },
  threadTrack: { height:14, background:'var(--bg0)', borderRadius:3, overflow:'hidden', marginBottom:4 },
  threadFill: (c, pct, danger) => ({
    height:'100%', borderRadius:3,
    width: Math.min(Math.max(pct, 0), 100) + '%',
    background: danger && pct > 80 ? '#ef4444' : c,
    transition:'width 0.3s ease, background 0.3s ease',
    display:'flex', alignItems:'center', paddingLeft:5,
    minWidth: pct > 0 ? 20 : 0,
  }),
  threadFillText: { fontSize:9, fontWeight:700, color:'#fff', fontFamily:'var(--font-mono)', whiteSpace:'nowrap' },

  stats:   { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'3px 8px', marginBottom:8 },
  statRow: { display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:10, fontFamily:'var(--font-mono)', padding:'3px 0', borderBottom:'1px solid var(--border)' },
  statKey: { color:'var(--text3)' },
  statVal: (c) => ({ color:c, fontWeight:700 }),

  bigRow: { display:'flex', gap:8, marginTop:8 },
  bigBox: (c, hasVal) => ({
    flex:1, textAlign:'center', padding:'8px 4px',
    background: hasVal ? c+'12' : 'var(--bg3)',
    border: `1px solid ${hasVal ? c+'40' : 'var(--border)'}`,
    borderRadius:6,
  }),
  bigNum:   (c, hasVal) => ({ fontSize:22, fontWeight:700, fontFamily:'var(--font-mono)', color:hasVal?c:'var(--text3)', lineHeight:1 }),
  bigLabel: { fontSize:9, color:'var(--text3)', fontFamily:'var(--font-mono)', marginTop:2 },

  infoBox: { background:'var(--bg3)', borderRadius:6, padding:'10px 14px', marginTop:2, fontSize:11, color:'var(--text2)', fontFamily:'var(--font-mono)', lineHeight:1.8, borderLeft:'3px solid var(--accent)' },
}

const INITIAL = { ok:0, rejected:0, peakThreads:0, osThreads:0, carrierThreads:0, elapsedMs:0, status:'idle', loading:false }

async function burst(appBase, concurrency, sleepMs) {
  const timeout = sleepMs * 3 + 8000
  try {
    const res = await fetch(
      `${appBase}/api/thread-demo/burst?concurrency=${concurrency}&sleepMs=${sleepMs}`,
      { method:'POST', signal: AbortSignal.timeout(timeout) }
    )
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (e) {
    return { error:e.message, succeeded:0, rejected:concurrency, peakActiveThreads:0 }
  }
}

async function resetStats(appBase) {
  try { await fetch(`${appBase}/api/thread-demo/reset`, { method:'POST' }) } catch (_) {}
}

export default function ThreadStressDemo() {
  const [concurrency, setConcurrency] = useState(50)
  const [sleepMs,     setSleepMs]     = useState(200)
  const [running,     setRunning]     = useState(false)
  const [results,     setResults]     = useState({
    app1:{...INITIAL}, app2:{...INITIAL}, app3:{...INITIAL},
  })

  const fire = useCallback(async () => {
    if (running) return
    setRunning(true)
    await Promise.all(Object.values(APPS).map(a => resetStats(a.base)))
    setResults({
      app1:{...INITIAL, loading:true, status:'running'},
      app2:{...INITIAL, loading:true, status:'running'},
      app3:{...INITIAL, loading:true, status:'running'},
    })

    const [r1, r2, r3] = await Promise.all([
      burst(APPS.app1.base, concurrency, sleepMs),
      burst(APPS.app2.base, concurrency, sleepMs),
      burst(APPS.app3.base, concurrency, sleepMs),
    ])

    setResults({
      app1: {
        ok:           r1.succeeded        || 0,
        rejected:     r1.rejected         || 0,
        peakThreads:  r1.peakActiveThreads|| 0,
        osThreads:    r1.totalOsThreads   || 0,
        carrierThreads: 0,
        elapsedMs:    r1.elapsedMs        || 0,
        status:       (r1.rejected||0)>0  ? 'REJECTING' : 'OK',
        loading:      false,
      },
      app2: {
        ok:             r2.succeeded          || 0,
        rejected:       0,
        peakThreads:    r2.peakVirtualThreads || 0,
        osThreads:      0,
        carrierThreads: r2.carrierThreads     || 0,
        elapsedMs:      r2.elapsedMs          || 0,
        status:         'OK',
        loading:        false,
      },
      app3: {
        ok:           r3.succeeded        || 0,
        rejected:     r3.rejected         || 0,
        peakThreads:  r3.peakActiveThreads|| 0,
        osThreads:    r3.totalOsThreads   || 0,
        carrierThreads: 0,
        elapsedMs:    r3.elapsedMs        || 0,
        status:       (r3.rejected||0)>0  ? 'REJECTING' : 'OK',
        loading:      false,
      },
    })
    setRunning(false)
  }, [running, concurrency, sleepMs])

  const reset = useCallback(async () => {
    setRunning(false)
    await Promise.all(Object.values(APPS).map(a => resetStats(a.base)))
    setResults({ app1:{...INITIAL}, app2:{...INITIAL}, app3:{...INITIAL} })
  }, [])

  return (
    <div style={s.wrap}>
      <div style={s.title}>Platform threads vs Virtual threads — live stress test</div>
      <div style={s.subtitle}>
        Server spawns N concurrent threads internally. Watch thread counts climb — App1+App3 hit
        their {THREAD_LIMIT}-thread wall and reject. App2 virtual threads handle thousands, carrier OS threads stay ~8.
      </div>

      <div style={s.controlsWrap}>
        <div style={s.controlRow}>
          <span style={s.controlLabel}>Concurrent</span>
          {CONCURRENCY_PRESETS.map(p => {
            const isActive = concurrency === p.value
            const btnColor = p.value>=200 ? (p.value>=1000?'#f59e0b':'#ef4444') : '#22c55e'
            return (
              <button key={p.value} style={s.presetBtn(isActive, btnColor)}
                onClick={() => !running && setConcurrency(p.value)} disabled={running}>
                <span style={s.presetLabel}>{p.label}</span>
                <span style={s.presetDesc}>{p.desc}</span>
              </button>
            )
          })}
          <span style={s.dangerTag(concurrency)}>
            {concurrency>=5000?'EXTREME — App1+3 reject ~96%'
            :concurrency>=1000?'HEAVY — App1+3 reject ~80%'
            :concurrency>=500 ?'STRESS — App1+3 reject ~60%'
            :concurrency>=200 ?'AT LIMIT — App1+3 start rejecting'
            :concurrency>=100 ?'NEAR LIMIT'
            :'SAFE — all apps handle OK'}
          </span>
        </div>

        <div style={s.controlRow}>
          <span style={s.controlLabel}>I/O sleep</span>
          {SLEEP_PRESETS.map(p => (
            <button key={p.value} style={s.presetBtn(sleepMs===p.value,'var(--accent)')}
              onClick={() => !running && setSleepMs(p.value)} disabled={running}>
              <span style={s.presetLabel}>{p.label}</span>
            </button>
          ))}
          <span style={{fontSize:10,color:'var(--text3)',fontFamily:'var(--font-mono)'}}>
            simulates blocking I/O (DB query / API call) of this duration
          </span>
        </div>

        <div style={s.actionRow}>
          <button style={s.resetBtn} onClick={reset} disabled={running}>Reset</button>
          <button style={s.fireBtn(running)} onClick={fire} disabled={running}>
            {running
              ? <><div style={s.spinner}/>Running {concurrency.toLocaleString()} threads on each app...</>
              : <>Fire {concurrency.toLocaleString()} concurrent threads per app</>
            }
          </button>
        </div>
      </div>

      {/* App panels */}
      <div style={s.panels}>
        {Object.values(APPS).map(app => {
          const r      = results[app.id]
          const isVirt = app.id === 'app2'
          const isRej  = r.rejected > 0
          const total  = r.ok + r.rejected
          const rejPct = total > 0 ? ((r.rejected/total)*100).toFixed(0) : 0

          // Thread bar percentages
          const platformPct   = isVirt ? 0 : Math.min((r.peakThreads / THREAD_LIMIT) * 100, 100)
          const vThreadPct    = isVirt ? Math.min((r.peakThreads  / concurrency) * 100, 100) : 0
          const carrierPct    = isVirt ? Math.min((r.carrierThreads / 30) * 100, 100) : 0
          const osPct         = !isVirt ? Math.min((r.osThreads / 300) * 100, 100) : 0

          return (
            <div key={app.id} style={s.panel(app.color, app.colorM, app.colorB)}>
              <div style={s.panelTitle(app.color)}>
                {app.short}
                <span style={s.threadTag(app.color)}>{isVirt?'VIRTUAL':'PLATFORM'}</span>
              </div>

              <div style={s.statusBadge(!isRej && !r.loading)}>
                <div style={s.statusDot(!isRej && !r.loading)}/>
                {r.loading        ? 'RUNNING...'
                :r.status==='idle' ? 'IDLE — press Fire to test'
                :isRej             ? `REJECTING — ${rejPct}% dropped`
                :'ALL HANDLED OK'}
              </div>

              {/* Thread count bars */}
              <div style={s.threadSection}>

                {/* Platform: peak active threads */}
                {!isVirt && (
                  <>
                    <div style={s.threadRowLabel}>
                      <span>Peak active threads</span>
                      <span style={{color: platformPct>80?'#ef4444':app.color, fontWeight:700}}>
                        {r.loading ? '...' : `${r.peakThreads} / ${THREAD_LIMIT}`}
                      </span>
                    </div>
                    <div style={s.threadTrack}>
                      <div style={s.threadFill(app.color, r.loading?50:platformPct, true)}>
                        {(r.loading || platformPct>15) && (
                          <span style={s.threadFillText}>
                            {r.loading ? '...' : Math.round(platformPct)+'%'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={s.threadRowLabel}>
                      <span>Total OS threads (JVM)</span>
                      <span style={{color:app.color, fontWeight:700}}>
                        {r.loading ? '...' : r.osThreads || '—'}
                      </span>
                    </div>
                    <div style={s.threadTrack}>
                      <div style={s.threadFill(app.color, r.loading?20:osPct, false)}>
                        {(r.loading || osPct>15) && (
                          <span style={s.threadFillText}>{r.loading?'...':r.osThreads}</span>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Virtual: peak virtual threads + carrier threads */}
                {isVirt && (
                  <>
                    <div style={s.threadRowLabel}>
                      <span>Peak virtual threads</span>
                      <span style={{color:app.color, fontWeight:700}}>
                        {r.loading ? '...' : `${r.peakThreads.toLocaleString()} virtual`}
                      </span>
                    </div>
                    <div style={s.threadTrack}>
                      <div style={s.threadFill(app.color, r.loading?60:Math.min(vThreadPct,100), false)}>
                        {(r.loading || r.peakThreads>0) && (
                          <span style={s.threadFillText}>
                            {r.loading ? '...' : r.peakThreads.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={s.threadRowLabel}>
                      <span>Carrier OS threads used</span>
                      <span style={{color:'#22c55e', fontWeight:700}}>
                        {r.loading ? '...' : `only ${r.carrierThreads} OS threads!`}
                      </span>
                    </div>
                    <div style={s.threadTrack}>
                      <div style={s.threadFill('#22c55e', r.loading?15:carrierPct, false)}>
                        {(r.loading || r.carrierThreads>0) && (
                          <span style={s.threadFillText}>{r.loading?'...':r.carrierThreads}</span>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Stats grid */}
              <div style={s.stats}>
                <div style={s.statRow}>
                  <span style={s.statKey}>succeeded</span>
                  <span style={s.statVal('#22c55e')}>{r.loading?'...':r.ok.toLocaleString()}</span>
                </div>
                <div style={s.statRow}>
                  <span style={s.statKey}>rejected</span>
                  <span style={s.statVal(isRej?'#ef4444':'var(--text3)')}>{r.loading?'...':r.rejected.toLocaleString()}</span>
                </div>
                <div style={s.statRow}>
                  <span style={s.statKey}>thread limit</span>
                  <span style={s.statVal('var(--text2)')}>{isVirt?'∞ unlimited':THREAD_LIMIT}</span>
                </div>
                <div style={s.statRow}>
                  <span style={s.statKey}>completed in</span>
                  <span style={s.statVal('var(--text2)')}>{r.elapsedMs?r.elapsedMs+'ms':'—'}</span>
                </div>
              </div>

              {/* Big numbers */}
              <div style={s.bigRow}>
                <div style={s.bigBox(isRej?'#ef4444':'#22c55e', total>0)}>
                  <div style={s.bigNum(isRej?'#ef4444':'#22c55e', total>0)}>
                    {r.loading ? '...' : isVirt ? '0' : r.rejected > 0 ? r.rejected.toLocaleString() : '0'}
                  </div>
                  <div style={s.bigLabel}>{isVirt?'rejected (never)':'rejected (503)'}</div>
                </div>
                <div style={s.bigBox(app.color, r.peakThreads>0)}>
                  <div style={s.bigNum(app.color, r.peakThreads>0)}>
                    {r.loading ? '...' : isVirt
                      ? (r.carrierThreads > 0 ? r.carrierThreads : '—')
                      : (r.peakThreads > 0 ? r.peakThreads : '—')}
                  </div>
                  <div style={s.bigLabel}>{isVirt ? 'carrier OS threads' : 'peak OS threads'}</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div style={s.infoBox}>
        <strong style={{color:'var(--text)'}}>Reading the results:</strong><br/>
        <span style={{color:APPS.app1.color}}>App1 + App3</span> — pool of {THREAD_LIMIT} platform OS threads.
        {concurrency > THREAD_LIMIT
          ? ` With ${concurrency} tasks: ${THREAD_LIMIT} run, ${concurrency-THREAD_LIMIT} rejected immediately. Peak threads = ${THREAD_LIMIT}.`
          : ` With ${concurrency} tasks: all run, 0 rejected. Peak threads = ${concurrency}.`
        }<br/>
        <span style={{color:APPS.app2.color}}>App2 virtual threads</span> — all {concurrency.toLocaleString()} tasks get their own virtual thread.
        During Thread.sleep() virtual threads <strong>park</strong> — releasing their carrier OS thread.
        Result: {concurrency.toLocaleString()} concurrent tasks need only ~8 carrier OS threads. Zero rejections.
        Both complete in ~{sleepMs}ms because all run in parallel.
      </div>
    </div>
  )
}
