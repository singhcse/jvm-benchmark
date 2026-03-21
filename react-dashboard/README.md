# JVM Benchmark — React Dashboard

Live performance comparator for the 3 Spring Boot apps.

## Prerequisites

- Node.js 18+ (download from https://nodejs.org)
- All 3 Spring Boot apps running in IntelliJ:
  - App1 on http://localhost:8080
  - App2 on http://localhost:8081
  - App3 on http://localhost:8082

## Run

```cmd
cd react-dashboard
npm install
npm run dev
```

Open http://localhost:3000

## What it shows

- **App status cards** — online/offline + startup time per app
- **KPI tiles** — heap, GC pause, CPU, thread count (live from all 3)
- **Live charts** — heap / CPU / GC pause / threads over time (Recharts)
- **Benchmark runner** — hit CPU / IO / Memory / DB endpoints on all 3 simultaneously, compare response times with a bar chart
- **Raw snapshot** — full `/api/metrics/snapshot` JSON per app
- **Comparison table** — static parameter matrix

## Dependencies

Only 3 dependencies:
- `react` + `react-dom` — UI framework
- `recharts` — charts (built on D3, no extra installs)
- `vite` + `@vitejs/plugin-react` — dev server + build (devDependencies)

## Polling

The dashboard polls `/api/metrics/snapshot` on all 3 apps every 2s (configurable: 2s / 5s / 10s).
All Spring Boot controllers have `@CrossOrigin(origins = "*")` so no CORS proxy needed.
