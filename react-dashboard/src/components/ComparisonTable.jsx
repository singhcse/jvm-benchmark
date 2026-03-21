import React from 'react'

const s = {
  wrap: {
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '16px 20px',
    overflowX: 'auto',
  },
  title: {
    fontSize: 11, fontFamily: 'var(--font-mono)',
    color: 'var(--text2)', textTransform: 'uppercase',
    letterSpacing: '0.7px', marginBottom: 14,
  },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  th: (color) => ({
    textAlign: 'left', padding: '8px 12px',
    borderBottom: '1px solid var(--border2)',
    color: color || 'var(--text2)',
    fontFamily: 'var(--font-mono)', fontWeight: 500, fontSize: 11,
  }),
  td: { padding: '9px 12px', borderBottom: '1px solid var(--border)', color: 'var(--text2)' },
  tdBold: { padding: '9px 12px', borderBottom: '1px solid var(--border)', color: 'var(--text)', fontWeight: 500 },
  val: (color) => ({
    fontFamily: 'var(--font-mono)', fontWeight: 600,
    color, fontSize: 12,
  }),
  win: (color) => ({
    fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
    color, background: color + '18', padding: '2px 6px', borderRadius: 3,
  }),
}

const ROWS = [
  { metric: 'Startup time',    a1: '~8–12 s',       a2: '~2–4 s',         a3: '~0.05–0.1 s',  winner: 'app3' },
  { metric: 'Memory (RSS)',    a1: '400–600 MB',     a2: '200–350 MB',     a3: '60–120 MB',    winner: 'app3' },
  { metric: 'GC type',        a1: 'G1GC',           a2: 'ZGC Generational', a3: 'Serial GC',  winner: null   },
  { metric: 'GC pause',       a1: '50–200 ms',      a2: '< 1 ms',         a3: 'None',         winner: 'app3' },
  { metric: 'Compiler',       a1: 'JIT (C1+C2)',    a2: 'JIT (C1+C2)',    a3: 'AOT',          winner: null   },
  { metric: 'JIT warmup',     a1: 'Yes (slow start)', a2: 'Yes (slower)', a3: 'No (instant)', winner: 'app3' },
  { metric: 'Peak CPU tput',  a1: 'High (warm JIT)', a2: 'Very High',     a3: 'Medium',       winner: 'app2' },
  { metric: 'Concurrency',    a1: 'Platform threads', a2: 'Virtual threads', a3: 'Platform',  winner: 'app2' },
  { metric: 'p99 latency',    a1: 'Medium',         a2: 'Low',            a3: 'Low',          winner: 'app2' },
  { metric: 'Cold start',     a1: 'Bad',            a2: 'Better',         a3: 'Best',         winner: 'app3' },
  { metric: 'Best for',       a1: 'Long-running monoliths', a2: 'High-concurrency I/O', a3: 'Serverless / FaaS', winner: null },
]

export default function ComparisonTable({ apps }) {
  return (
    <div style={s.wrap}>
      <div style={s.title}>Parameter comparison matrix</div>
      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th()}>Parameter</th>
            <th style={s.th(apps.app1.color)}>{apps.app1.short}</th>
            <th style={s.th(apps.app2.color)}>{apps.app2.short}</th>
            <th style={s.th(apps.app3.color)}>{apps.app3.short}</th>
            <th style={s.th()}>Winner</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map(row => (
            <tr key={row.metric}>
              <td style={s.tdBold}>{row.metric}</td>
              <td style={s.td}><span style={s.val(apps.app1.color)}>{row.a1}</span></td>
              <td style={s.td}><span style={s.val(apps.app2.color)}>{row.a2}</span></td>
              <td style={s.td}><span style={s.val(apps.app3.color)}>{row.a3}</span></td>
              <td style={s.td}>
                {row.winner && (
                  <span style={s.win(apps[row.winner].color)}>
                    {apps[row.winner].short}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
