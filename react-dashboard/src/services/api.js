// ─── App endpoints ────────────────────────────────────────────────────────────
// Each Spring Boot app exposes GET /api/metrics/snapshot
// All controllers have @CrossOrigin(origins = "*") so no CORS issues

export const APPS = {
  app1: {
    id:    'app1',
    label: 'App 1 — Java 8 G1GC',
    short: 'Java 8 G1GC',
    port:  8080,
    base:  'http://localhost:8080',
    color: 'var(--a1)',
    colorM: 'var(--a1m)',
    colorB: 'var(--a1b)',
    gc:    'G1GC',
    compiler: 'JIT (C1+C2)',
    threads: 'Platform',
  },
  app2: {
    id:    'app2',
    label: 'App 2 — Java 21 ZGC+Loom',
    short: 'Java 21 ZGC',
    port:  8081,
    base:  'http://localhost:8081',
    color: 'var(--a2)',
    colorM: 'var(--a2m)',
    colorB: 'var(--a2b)',
    gc:    'ZGC',
    compiler: 'JIT (C1+C2)',
    threads: 'Virtual',
  },
  app3: {
    id:    'app3',
    label: 'App 3 — GraalVM Native',
    short: 'GraalVM AOT',
    port:  8082,
    base:  'http://localhost:8082',
    color: 'var(--a3)',
    colorM: 'var(--a3m)',
    colorB: 'var(--a3b)',
    gc:    'Serial GC',
    compiler: 'AOT',
    threads: 'Platform',
  },
}

// Fetch /api/metrics/snapshot from one app with a timeout
async function fetchSnapshot(app) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 3000)
  try {
    const res = await fetch(`${app.base}/api/metrics/snapshot`, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    })
    clearTimeout(timeout)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return { ...(await res.json()), _status: 'online' }
  } catch (e) {
    clearTimeout(timeout)
    return { _status: 'offline', _error: e.message }
  }
}

// Fetch all 3 in parallel — never blocks on a slow/offline app
export async function fetchAllMetrics() {
  const [app1, app2, app3] = await Promise.all([
    fetchSnapshot(APPS.app1),
    fetchSnapshot(APPS.app2),
    fetchSnapshot(APPS.app3),
  ])
  return { app1, app2, app3 }
}

// Hit a benchmark endpoint on one app
export async function runBenchmark(appId, endpoint, params = {}) {
  const app = APPS[appId]
  const qs = new URLSearchParams(params).toString()
  const url = `${app.base}/api/${endpoint}${qs ? '?' + qs : ''}`
  const start = Date.now()
  try {
    const res = await fetch(url)
    const data = await res.json()
    return { ...data, _clientMs: Date.now() - start, _status: 'ok' }
  } catch (e) {
    return { _status: 'error', _error: e.message, _clientMs: Date.now() - start }
  }
}
