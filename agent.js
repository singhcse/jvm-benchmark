/**
 * JVM Benchmark — Restart Agent v3.0
 *
 * Runs as a Docker service OR standalone via: node agent.js
 *
 * When running as Docker service:
 *   - Docker socket is mounted: /var/run/docker.sock
 *   - Uses: docker compose restart <service>
 *   - PROJECT_ROOT env var points to /project (mounted volume)
 *
 * When running locally (node agent.js):
 *   - Auto-detects Docker containers
 *   - Falls back to java -jar if no containers found
 *
 * Port: 9999
 */

const http  = require('http')
const { exec, spawn } = require('child_process')
const path  = require('path')
const os    = require('os')
const fs    = require('fs')

const PORT         = parseInt(process.env.PORT || '9999')
const IS_WINDOWS   = os.platform() === 'win32'

// When running in Docker, PROJECT_ROOT is mounted as /project
// When running locally, it's the folder containing agent.js
const PROJECT_ROOT = process.env.PROJECT_ROOT || __dirname

// ── App definitions ───────────────────────────────────────────────────────────

const APPS = {
  app1: {
    name:          'app1-java8-g1gc',
    dockerService: 'app1',
    dir:           path.join(PROJECT_ROOT, 'app1-java8-g1gc'),
    port:          8080,
    jvmArgs: [
      '-server', '-XX:+UseG1GC', '-XX:MaxGCPauseMillis=200',
      '-Xms256m', '-Xmx512m', '-XX:+TieredCompilation',
      '-Dspring.profiles.active=local',
      '-Dserver.port=8080',
      '-Dspring.sql.init.mode=never',
    ],
  },
  app2: {
    name:          'app2-java21-zgc-loom',
    dockerService: 'app2',
    dir:           path.join(PROJECT_ROOT, 'app2-java21-zgc-loom'),
    port:          8081,
    jvmArgs: [
      '-XX:+UseZGC', '-XX:+ZGenerational',
      '-Xms128m', '-Xmx512m',
      '-Dspring.threads.virtual.enabled=true',
      '-Dspring.profiles.active=local',
      '-Dserver.port=8081',
      '-Dspring.sql.init.mode=never',
    ],
  },
  app3: {
    name:          'app3-graalvm-native',
    dockerService: 'app3',
    dir:           path.join(PROJECT_ROOT, 'app3-graalvm-native'),
    port:          8082,
    jvmArgs: [
      '-XX:+UseSerialGC', '-Xms64m', '-Xmx256m',
      '-Dspring.aot.enabled=false',
      '-Dspring.profiles.active=local',
      '-Dserver.port=8082',
      '-Dspring.sql.init.mode=never',
    ],
  },
}

// ── State ─────────────────────────────────────────────────────────────────────

const localProcesses = { app1: null, app2: null, app3: null }
const agentLog = []
let currentMode = 'detecting'

function log(msg) {
  const ts   = new Date().toLocaleTimeString()
  const line = `[${ts}] ${msg}`
  console.log(line)
  agentLog.unshift(line)
  if (agentLog.length > 60) agentLog.pop()
}

// ── Mode detection ────────────────────────────────────────────────────────────

function detectDockerMode() {
  return new Promise(resolve => {
    // First check if we're running inside Docker (env var set by docker-compose)
    if (process.env.RUNNING_IN_DOCKER === 'true') {
      resolve(true)
      return
    }
    // Otherwise check if containers are running via docker ps
    exec('docker ps --format "{{.Names}}"', (err, stdout) => {
      if (err) { resolve(false); return }
      resolve(stdout.includes('benchmark-app'))
    })
  })
}

async function refreshMode() {
  const isDocker = await detectDockerMode()
  currentMode = isDocker ? 'docker' : 'local'
  return currentMode
}

// ── Docker restart ────────────────────────────────────────────────────────────

function dockerRestart(services) {
  return new Promise(resolve => {
    const svcStr = Array.isArray(services) ? services.join(' ') : services
    log(`[Docker] Restarting: ${svcStr}`)

    // When inside Docker container, use docker directly
    // When running locally, use docker compose
    const cmd = process.env.RUNNING_IN_DOCKER === 'true'
      ? `docker restart ${svcStr.split(' ').map(s => `benchmark-${s}`).join(' ')}`
      : `docker compose restart ${svcStr}`

    exec(cmd, { cwd: PROJECT_ROOT }, (err, stdout, stderr) => {
      if (err) {
        log(`[Docker] Error: ${err.message}`)
        resolve({ ok: false, error: err.message })
      } else {
        log(`[Docker] Done: ${svcStr}`)
        resolve({ ok: true, services: svcStr })
      }
    })
  })
}

// ── Local JAR restart ─────────────────────────────────────────────────────────

function findJar(appDir, appName) {
  const targetDir = path.join(appDir, 'target')
  if (!fs.existsSync(targetDir)) return null
  const files = fs.readdirSync(targetDir)
  const jar = files.find(f =>
    f.endsWith('.jar') &&
    !f.endsWith('-sources.jar') &&
    !f.endsWith('-plain.jar') &&
    f.startsWith(appName)
  )
  return jar ? path.join(targetDir, jar) : null
}

function killPort(port) {
  return new Promise(resolve => {
    const cmd = IS_WINDOWS
      ? `for /f "tokens=5" %a in ('netstat -aon ^| find ":${port}" ^| find "LISTENING"') do taskkill /F /PID %a`
      : `lsof -ti:${port} | xargs kill -9 2>/dev/null || true`
    exec(cmd, () => resolve())
  })
}

async function localRestart(appId) {
  const app = APPS[appId]
  log(`[Local] Starting ${app.name} on :${app.port}`)

  await killPort(app.port)
  await new Promise(r => setTimeout(r, 500))

  if (localProcesses[appId]) {
    try { localProcesses[appId].kill('SIGTERM') } catch (_) {}
    localProcesses[appId] = null
    await new Promise(r => setTimeout(r, 300))
  }

  const jar = findJar(app.dir, app.name)
  if (!jar) {
    const msg = `JAR not found in ${app.dir}/target/ — run Build → Build Project in IntelliJ first`
    log(`[Local] ERROR: ${msg}`)
    return { ok: false, error: msg }
  }

  log(`[Local] Found: ${path.basename(jar)}`)
  const proc = spawn('java', [...app.jvmArgs, '-jar', jar], {
    cwd: app.dir, stdio: ['ignore', 'pipe', 'pipe'],
  })
  localProcesses[appId] = proc

  proc.stdout.on('data', d => {
    const t = d.toString().trim()
    if (t) log(`[${app.name}] ${t.split('\n')[0]}`)
  })
  proc.stderr.on('data', d => {
    const t = d.toString().trim()
    if (t && !t.includes('WARNING')) log(`[${app.name}:err] ${t.split('\n')[0]}`)
  })
  proc.on('exit', code => {
    log(`[${app.name}] exited (code=${code})`)
    if (localProcesses[appId] === proc) localProcesses[appId] = null
  })

  log(`[Local] ${app.name} spawned PID=${proc.pid}`)
  return { ok: true, pid: proc.pid, jar: path.basename(jar) }
}

// ── Unified restart ───────────────────────────────────────────────────────────

async function restart(target) {
  await refreshMode()

  if (currentMode === 'docker') {
    if (target === 'all') return dockerRestart(['app1', 'app2', 'app3'])
    if (!APPS[target])    return { ok: false, error: `Unknown: ${target}` }
    return dockerRestart(APPS[target].dockerService)
  }

  if (target === 'all') {
    const results = await Promise.all(['app1','app2','app3'].map(localRestart))
    return { ok: true, results }
  }
  if (!APPS[target]) return { ok: false, error: `Unknown: ${target}` }
  return localRestart(target)
}

// ── HTTP server ───────────────────────────────────────────────────────────────

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

function json(res, code, data) {
  cors(res)
  res.writeHead(code, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data, null, 2))
}

http.createServer(async (req, res) => {
  cors(res)
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }

  if (req.method === 'GET' && req.url === '/status') {
    await refreshMode()
    return json(res, 200, {
      agent:   'jvm-benchmark-restart-agent',
      version: '3.0.0',
      port:    PORT,
      mode:    currentMode,
      runningInDocker: process.env.RUNNING_IN_DOCKER === 'true',
      localProcesses: Object.fromEntries(
        Object.entries(localProcesses).map(([id, p]) => [id, {
          running: !!p, pid: p?.pid || null,
        }])
      ),
      log: agentLog.slice(0, 20),
    })
  }

  if (req.method === 'GET' && req.url === '/logs') {
    return json(res, 200, { log: agentLog })
  }

  if (req.method === 'POST' && req.url.startsWith('/restart/')) {
    const target = req.url.replace('/restart/', '')
    const result = await restart(target)
    return json(res, result.ok ? 200 : 500, { target, mode: currentMode, ...result })
  }

  json(res, 404, { routes: ['GET /status', 'GET /logs', 'POST /restart/app1|app2|app3|all'] })

}).listen(PORT, async () => {
  await refreshMode()
  const inDocker = process.env.RUNNING_IN_DOCKER === 'true'
  console.log('')
  console.log('  JVM Benchmark Restart Agent v3.0')
  console.log(`  http://localhost:${PORT}`)
  console.log(`  Mode: ${currentMode.toUpperCase()}`)
  console.log(`  Running in Docker: ${inDocker}`)
  console.log('')
  console.log('  POST /restart/all    restart all 3')
  console.log('  POST /restart/app1   restart App1')
  console.log('  POST /restart/app2   restart App2')
  console.log('  POST /restart/app3   restart App3')
  console.log('  GET  /status         agent info')
  console.log('')
})

process.on('SIGINT', () => {
  Object.values(localProcesses).forEach(p => { try { p?.kill() } catch (_) {} })
  process.exit(0)
})
