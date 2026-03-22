# JVM Benchmark — 3-App Performance Observatory

A mono-repo that demonstrates the performance characteristics of three different
Java runtime strategies side-by-side, with a live React dashboard and load testing suite.

---

## Architecture

```
React Dashboard (port 3000)
        │
        ▼
Spring Cloud Gateway (port 9000)    ← optional reverse proxy
        │
   ┌────┼─────────────────┐
   ▼    ▼                 ▼
App 1   App 2          App 3
:8080   :8081          :8082
 │       │               │
 └───────┴───────────────┘
              │
         PostgreSQL (port 5432)       ← shared by all 3

Prometheus (port 9090) ← scrapes all 3 apps
Grafana    (port 3001) ← dashboards
```

---

## The 3 Apps

| | App 1 | App 2 | App 3 |
|---|---|---|---|
| **Java version** | 8 | 21 | 21 (GraalVM) |
| **Spring Boot** | 2.7.x | 3.2.x | 3.2.x |
| **Compiler** | JIT (C1+C2) | JIT (C1+C2) | AOT (native-image) |
| **GC** | G1GC | ZGC (Generational) | Serial GC (native) |
| **Threads** | Platform (OS) | Virtual (Loom) | Platform |
| **Port** | 8080 | 8081 | 8082 |
| **Startup** | ~8-12s | ~2-4s | ~0.05-0.1s |
| **RSS memory** | ~400-600 MB | ~200-350 MB | ~60-120 MB |

---

## Project Structure

```
jvm-benchmark/
├── app1-java8-g1gc/                  # App 1 — Traditional JVM
│   ├── src/main/java/com/benchmark/app1/
│   │   ├── App1Application.java
│   │   ├── controller/BenchmarkController.java
│   │   ├── service/
│   │   │   ├── BenchmarkService.java   # fibonacci, simulateIo, allocateMemory
│   │   │   └── MetricsService.java     # builds /api/metrics/snapshot JSON
│   │   ├── model/
│   │   │   ├── BenchmarkResult.java
│   │   │   ├── MetricsSnapshot.java    # polled by React dashboard
│   │   │   └── WorkItem.java           # JPA entity
│   │   ├── repository/WorkItemRepository.java
│   │   └── config/DataInitializer.java
│   ├── src/main/resources/
│   │   ├── application.properties
│   │   └── schema.sql
│   ├── Dockerfile                      # Java 8 JRE + G1GC flags
│   └── pom.xml                         # Spring Boot 2.7.x
│
├── app2-java21-zgc-loom/              # App 2 — Modern JVM + Loom
│   ├── src/main/java/com/benchmark/app2/
│   │   ├── App2Application.java
│   │   ├── controller/BenchmarkController.java
│   │   ├── service/
│   │   │   ├── BenchmarkService.java
│   │   │   └── MetricsService.java
│   │   ├── model/
│   │   │   ├── BenchmarkResult.java    # has isVirtual field
│   │   │   ├── MetricsSnapshot.java
│   │   │   └── WorkItem.java           # Jakarta persistence
│   │   ├── repository/WorkItemRepository.java
│   │   └── config/
│   │       ├── VirtualThreadConfig.java  # ← wires Tomcat to virtual threads
│   │       └── DataInitializer.java
│   ├── src/main/resources/application.properties
│   ├── Dockerfile                      # Java 21 JRE + ZGC flags
│   └── pom.xml                         # Spring Boot 3.2.x
│
├── app3-graalvm-native/               # App 3 — GraalVM Native Image
│   ├── src/main/java/com/benchmark/app3/
│   │   ├── App3Application.java
│   │   ├── controller/BenchmarkController.java
│   │   ├── service/
│   │   │   ├── BenchmarkService.java
│   │   │   └── MetricsService.java
│   │   ├── model/
│   │   │   ├── BenchmarkResult.java    # has isNative field
│   │   │   ├── MetricsSnapshot.java    # has nativeImage field
│   │   │   └── WorkItem.java
│   │   ├── repository/WorkItemRepository.java
│   │   └── config/
│   │       ├── NativeHintsConfig.java  # ← AOT reflection hints (critical!)
│   │       └── DataInitializer.java
│   ├── src/main/resources/application.properties
│   ├── Dockerfile                      # GraalVM native-image build (5-10 min)
│   └── pom.xml                         # native-maven-plugin + native profile
│
├── gateway/                           # Spring Cloud Gateway (optional)
│   ├── src/main/java/com/benchmark/gateway/GatewayApplication.java
│   ├── src/main/resources/application.yml  # routes /app1,/app2,/app3
│   ├── Dockerfile
│   └── pom.xml
│
├── react-dashboard/                   # React frontend (Phase 6)
│   └── src/
│
├── k6-scripts/                        # Load testing
│   ├── load-all.js                    # Primary: all 3 apps, 100→1000 users
│   ├── cold-start.js                  # Cold start race
│   ├── cpu-benchmark.js               # JIT warmup curve vs AOT flat line
│   ├── io-concurrency.js              # Virtual threads vs platform threads
│   ├── memory-gc.js                   # G1GC pause spikes vs ZGC flatness
│   └── k6-results/                    # Output JSON + TXT reports
│
├── prometheus/
│   └── prometheus.yml                 # Scrapes all 3 apps every 5s
│
├── grafana/
│   ├── provisioning/
│   │   ├── datasources/prometheus.yml
│   │   └── dashboards/dashboard.yml
│   └── dashboards/benchmark.json      # Pre-built Grafana dashboard
│
├── db/
│   └── init.sql                       # PostgreSQL schema + seed data
│
├── logs/                              # GC logs mounted from containers
│   ├── app1/gc-app1.log
│   └── app2/gc-app2.log
│
├── docker-compose.yml                 # Orchestrates all services
├── Makefile                           # Convenience commands
└── pom.xml                            # Maven parent (multi-module)
```

---

## Quick Start

### Prerequisites

- Docker Desktop 4.x+ (with 8GB+ RAM allocated)
- Docker Compose v2.x
- Make (optional but recommended)
- k6 (optional, for load testing — or use Docker)

### Option A — Full stack with native image (takes 5-10 min to build App3)

```bash
git clone <your-repo>
cd jvm-benchmark

# Build and start everything
make up

# OR without Make:
mkdir -p logs/app1 logs/app2 logs/app3 k6-scripts/k6-results
docker compose up --build -d
```

### Option B — JVM apps only (fast build, skip native)

```bash
make up-no-native

# OR:
docker compose up --build -d postgres app1 app2 gateway prometheus grafana
```

### Verify all 3 apps are running

```bash
make health

# OR manually:
curl http://localhost:8080/api/health   # App1
curl http://localhost:8081/api/health   # App2
curl http://localhost:8082/api/health   # App3
```

### Open dashboards

| Dashboard | URL | Credentials |
|---|---|---|
| React Dashboard | http://localhost:3000 | — |
| Grafana | http://localhost:3001 | admin / benchmark |
| Prometheus | http://localhost:9090 | — |
| App1 Actuator | http://localhost:8080/actuator | — |
| App2 Actuator | http://localhost:8081/actuator | — |
| App3 Actuator | http://localhost:8082/actuator | — |
| Gateway routes | http://localhost:9000/actuator/gateway/routes | — |

---

## API Endpoints (identical on all 3 apps)

| Method | Endpoint | Description | Port |
|---|---|---|---|
| GET | `/api/health` | Health check | all |
| GET | `/api/cpu-intensive?n=40` | Fibonacci(n) — CPU bound | all |
| GET | `/api/io-intensive?sleepMs=200` | Blocking sleep — I/O simulation | all |
| GET | `/api/memory-test?allocMb=100` | Allocate + release memory | all |
| GET | `/api/db-call` | SELECT from work_items | all |
| GET | `/api/metrics/snapshot` | Full metrics JSON (polled by dashboard) | all |
| GET | `/actuator/prometheus` | Prometheus scrape endpoint | all |
| GET | `/actuator/health` | Spring Boot health | all |

### Gateway routes (prefix-based)

```
GET http://localhost:9000/app1/api/cpu-intensive  → app1:8080/api/cpu-intensive
GET http://localhost:9000/app2/api/io-intensive   → app2:8081/api/io-intensive
GET http://localhost:9000/app3/api/health         → app3:8082/api/health

GET http://localhost:9000/metrics/app1            → app1:8080/api/metrics/snapshot
GET http://localhost:9000/metrics/app2            → app2:8081/api/metrics/snapshot
GET http://localhost:9000/metrics/app3            → app3:8082/api/metrics/snapshot
```

---

## Load Testing

### Run all tests (recommended order)

```bash
# 1. Cold start race — run IMMEDIATELY after starting containers
make restart && sleep 5 && make test-coldstart

# 2. Full load test (all 3 apps, 100→1000 users, ~5 min)
make test-all

# 3. CPU benchmark (shows JIT warmup curve vs AOT flat line)
make test-cpu

# 4. I/O concurrency (virtual threads vs platform threads)
make test-io

# 5. GC benchmark (G1GC pause spikes vs ZGC sub-ms pauses)
make test-gc
```

### Run with Docker (no local k6 needed)

```bash
docker compose run --rm k6 run /scripts/load-all.js
docker compose run --rm k6 run /scripts/cpu-benchmark.js -e APP1_URL=http://app1:8080
```

---

## What Each Test Proves

### Cold Start Race (`cold-start.js`)
**Expected winner: App3 (GraalVM Native)**
```
App1 (Java 8 JVM):    ~8,000 – 12,000 ms  ← JVM init + class loading + Spring Boot
App2 (Java 21 JVM):   ~2,000 – 4,000  ms  ← faster Spring Boot 3.x
App3 (Native Image):  ~50    – 100    ms  ← binary already compiled, no JVM
```

### I/O Concurrency (`io-concurrency.js`)
**Expected winner: App2 (Virtual Threads)**
```
At 1000 concurrent requests (each sleeping 200ms):
App1: Thread pool exhausts → requests queue → tail latency spikes to seconds
App2: 1000 virtual threads park on sleep, 8 carrier threads handle all → stays fast
App3: Similar to App1 (platform threads, no Loom)
```

### CPU Throughput (`cpu-benchmark.js`)
**Expected winner: App1 or App2 (JIT, after warmup)**
```
First 50 requests:   App1/App2 slow (C1 interpreter), App3 consistent (AOT)
After 100 requests:  App1/App2 drop dramatically (C2 JIT kicks in)
App3:                Flat line throughout — no warmup, no improvement
```

### GC Pause Impact (`memory-gc.js`)
**Expected winner: App2 (ZGC) or App3 (no JVM GC)**
```
App1 G1GC:  p50=120ms, p99=800ms   ← stop-the-world pauses visible in tail latency
App2 ZGC:   p50=120ms, p99=130ms   ← concurrent GC, pauses < 1ms
App3 Native: no JVM GC              ← Serial GC with tiny RSS
```

---

## Building the Native Image Locally

If you have GraalVM installed (recommended: via SDKMAN):

```bash
# Install GraalVM via SDKMAN
sdk install java 21.0.3-graalce
sdk use java 21.0.3-graalce

# Verify native-image is available
native-image --version

# Compile App3
cd app3-graalvm-native
./mvnw -Pnative native:compile -DskipTests

# Run the native binary directly (no java command needed!)
./target/app3-native

# Inspect the binary
ls -lh target/app3-native          # typically 80-120MB
file target/app3-native            # ELF 64-bit LSB executable
```

---

## Troubleshooting

### App3 native image build fails
```bash
# Most common: missing GraalVM in Docker builder
# Check the Dockerfile uses: FROM ghcr.io/graalvm/native-image-community:21

# If reflection errors at runtime, add hints to NativeHintsConfig.java
# and re-run: ./mvnw -Pnative native:compile

# For H2 compatibility in native, ensure:
spring.datasource.url=jdbc:h2:mem:benchmarkdb;DB_CLOSE_DELAY=-1
```

### App2 virtual threads not enabled
```bash
# Verify in logs:
docker compose logs app2 | grep "Virtual thread confirmed"
# Should print: Virtual thread confirmed: true

# Check VirtualThreadConfig.java is on classpath
# Verify application.properties has:
# spring.threads.virtual.enabled=true
```

### Out of memory during native image build
```bash
# Increase Docker Desktop memory to 8GB+
# Or add to App3 pom.xml buildArgs:
# <buildArg>-J-Xmx6g</buildArg>
```

### Postgres connection refused
```bash
# Wait for healthcheck to pass before starting apps
docker compose ps postgres
# Status should be: healthy
# Apps depend_on postgres with condition: service_healthy
```

---

## Wiring the React Dashboard to Real APIs

The React dashboard (Phase 6) polls `/api/metrics/snapshot` from all 3 apps.
Replace the simulation in the dashboard with:

```javascript
// In react-dashboard/src/services/api.js
const ENDPOINTS = {
  app1: 'http://localhost:8080/api/metrics/snapshot',
  app2: 'http://localhost:8081/api/metrics/snapshot',
  app3: 'http://localhost:8082/api/metrics/snapshot',
};

// Or via Gateway (single origin):
const ENDPOINTS = {
  app1: 'http://localhost:9000/metrics/app1',
  app2: 'http://localhost:9000/metrics/app2',
  app3: 'http://localhost:9000/metrics/app3',
};

async function fetchAllMetrics() {
  const [app1, app2, app3] = await Promise.all([
    fetch(ENDPOINTS.app1).then(r => r.json()),
    fetch(ENDPOINTS.app2).then(r => r.json()),
    fetch(ENDPOINTS.app3).then(r => r.json()),
  ]);
  return { app1, app2, app3 };
}
```

---

## Phase Roadmap

- [x] **Phase 1** — Mono-repo structure, all 3 Spring Boot apps, Docker, docker-compose
- [ ] **Phase 2** — Observability deep-dive (Prometheus alert rules, JFR integration)
- [ ] **Phase 3** — React dashboard wired to real APIs
- [ ] **Phase 4** — CI/CD pipeline (GitHub Actions: build + test all 3 apps)
- [ ] **Phase 5** — Kubernetes deployment manifests (HPA, resource limits)
- [ ] **Phase 6** — Demo video + LinkedIn writeup

---

## Key Talking Points for Demo

> Don't say "X is better". Say each wins on its own axis.

- **App1** wins: sustained CPU throughput after JIT warmup; deep JVM tooling
- **App2** wins: I/O concurrency (millions of virtual threads); sub-ms GC pauses via ZGC
- **App3** wins: cold start time; memory footprint; serverless / FaaS deployments

The right choice depends entirely on the workload:
- Serverless → **Native Image**
- High-concurrency I/O microservice → **Virtual Threads + ZGC**
- Long-running compute-heavy service → **JIT JVM (App1 or App2)**
