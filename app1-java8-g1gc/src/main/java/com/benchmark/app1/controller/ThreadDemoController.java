package com.benchmark.app1.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.lang.management.ManagementFactory;
import java.lang.management.ThreadMXBean;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ThreadDemoController {

    private static final int THREAD_POOL_LIMIT = 200;

    // Cumulative totals across all bursts
    private static final AtomicInteger totalSucceeded = new AtomicInteger(0);
    private static final AtomicInteger totalRejected = new AtomicInteger(0);

    // Live stats — updated during burst so metrics panel reflects real-time
    private static volatile int liveActiveThreads = 0;
    private static volatile int livePeakThreads = 0;
    private static volatile int liveOsThreads = 0;
    private static volatile int lastConcurrency = 0;
    private static volatile int lastRejected = 0;
    private static volatile int lastSucceeded = 0;
    private static volatile long lastElapsedMs = 0;

    @GetMapping("/thread-demo")
    public ResponseEntity<Map<String, Object>> threadDemo(
            @RequestParam(defaultValue = "200") int sleepMs) throws InterruptedException {
        Thread.sleep(sleepMs);
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("app", "app1-java8-g1gc");
        r.put("status", "OK");
        r.put("threadName", Thread.currentThread().getName());
        r.put("threadType", "platform");
        r.put("isVirtual", false);
        r.put("sleepMs", sleepMs);
        return ResponseEntity.ok(r);
    }

    /**
     * Server-side burst — creates N concurrent platform threads internally.
     * Tracks live active count so the UI can show thread ramp-up in real time.
     * <p>
     * Thread pool = 200 (Tomcat default for platform threads).
     * When concurrency > 200: overflow tasks are REJECTED immediately.
     * Rejected = concurrency - THREAD_POOL_LIMIT when concurrency > limit.
     */
    @PostMapping("/thread-demo/burst")
    public ResponseEntity<Map<String, Object>> burst(
            @RequestParam(defaultValue = "100") int concurrency,
            @RequestParam(defaultValue = "200") int sleepMs) throws InterruptedException {

        lastConcurrency = concurrency;
        liveActiveThreads = 0;
        livePeakThreads = 0;

        // Fixed platform thread pool — this is the bottleneck
        ThreadPoolExecutor pool = new ThreadPoolExecutor(
                THREAD_POOL_LIMIT,          // corePoolSize
                THREAD_POOL_LIMIT,          // maximumPoolSize — hard cap
                0L, TimeUnit.MILLISECONDS,
                new SynchronousQueue<>(),   // no queue — reject immediately if pool full
                new ThreadPoolExecutor.AbortPolicy()
        );

        List<Future<String>> futures = new ArrayList<>();
        AtomicInteger active = new AtomicInteger(0);
        AtomicInteger peak = new AtomicInteger(0);
        AtomicInteger rejected = new AtomicInteger(0);

        long start = System.currentTimeMillis();

        // Submit all N tasks — some will be rejected if N > THREAD_POOL_LIMIT
        for (int i = 0; i < concurrency; i++) {
            try {
                futures.add(pool.submit(() -> {
                    int cur = active.incrementAndGet();
                    // Track peak concurrently active threads
                    peak.updateAndGet(p -> Math.max(p, cur));
                    liveActiveThreads = cur;
                    livePeakThreads = peak.get();
                    liveOsThreads = ManagementFactory.getThreadMXBean().getThreadCount();
                    try {
                        Thread.sleep(sleepMs);
                        return "ok";
                    } catch (InterruptedException e) {
                        return "interrupted";
                    } finally {
                        active.decrementAndGet();
                        liveActiveThreads = active.get();
                    }
                }));
            } catch (RejectedExecutionException e) {
                // Pool full — task rejected immediately, no OS thread used
                rejected.incrementAndGet();
            }
        }

        pool.shutdown();
        pool.awaitTermination(sleepMs * 3L + 3000, TimeUnit.MILLISECONDS);

        // Count completed futures
        int okCount = 0;
        for (Future<String> f : futures) {
            try {
                if ("ok".equals(f.get(200, TimeUnit.MILLISECONDS))) okCount++;
            } catch (Exception ignored) {
            }
        }

        int actualRejected = rejected.get() + Math.max(0, futures.size() - okCount);
        int actualOk = okCount;
        long elapsed = System.currentTimeMillis() - start;

        // Update live stats
        liveActiveThreads = 0;
        livePeakThreads = peak.get();
        liveOsThreads = ManagementFactory.getThreadMXBean().getThreadCount();
        lastRejected = actualRejected;
        lastSucceeded = actualOk;
        lastElapsedMs = elapsed;

        totalSucceeded.addAndGet(actualOk);
        totalRejected.addAndGet(actualRejected);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("app", "app1-java8-g1gc");
        result.put("threadType", "platform");
        result.put("isVirtual", false);
        result.put("concurrency", concurrency);
        result.put("sleepMs", sleepMs);
        result.put("threadPoolLimit", THREAD_POOL_LIMIT);
        result.put("succeeded", actualOk);
        result.put("rejected", actualRejected);
        result.put("peakActiveThreads", peak.get());
        result.put("elapsedMs", elapsed);
        result.put("totalOsThreads", liveOsThreads);
        result.put("utilizationPct", Math.min(100, peak.get() * 100 / THREAD_POOL_LIMIT));
        result.put("totalSucceeded", totalSucceeded.get());
        result.put("totalRejected", totalRejected.get());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/thread-demo/stats")
    public ResponseEntity<Map<String, Object>> stats() {
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("app", "app1-java8-g1gc");
        r.put("threadType", "platform");
        r.put("isVirtual", false);
        r.put("liveActiveThreads", liveActiveThreads);
        r.put("peakActiveThreads", livePeakThreads);
        r.put("totalOsThreads", liveOsThreads > 0 ? liveOsThreads : ManagementFactory.getThreadMXBean().getThreadCount());
        r.put("threadPoolLimit", THREAD_POOL_LIMIT);
        r.put("lastConcurrency", lastConcurrency);
        r.put("lastSucceeded", lastSucceeded);
        r.put("lastRejected", lastRejected);
        r.put("lastElapsedMs", lastElapsedMs);
        r.put("totalSucceeded", totalSucceeded.get());
        r.put("totalRejected", totalRejected.get());
        r.put("utilizationPct", THREAD_POOL_LIMIT > 0 ? Math.min(100, liveActiveThreads * 100 / THREAD_POOL_LIMIT) : 0);
        r.put("willCrashAt", THREAD_POOL_LIMIT + " concurrent requests");
        return ResponseEntity.ok(r);
    }

    @PostMapping("/thread-demo/reset")
    public ResponseEntity<Map<String, Object>> reset() {
        totalRejected.set(0);
        totalSucceeded.set(0);
        liveActiveThreads = 0;
        livePeakThreads = 0;
        lastRejected = 0;
        lastSucceeded = 0;
        lastElapsedMs = 0;
        lastConcurrency = 0;
        Map<String, Object> response = new HashMap<>();
        response.put("reset", true);
        return ResponseEntity.ok(response);
    }

    // Static getters so MetricsService can include burst data in /api/metrics/snapshot
    public static int getLiveActiveThreads() {
        return liveActiveThreads;
    }

    public static int getLivePeakThreads() {
        return livePeakThreads;
    }

    public static int getLastRejected() {
        return lastRejected;
    }
}
