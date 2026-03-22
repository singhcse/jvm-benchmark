package com.benchmark.app2.controller;

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

    private static final AtomicInteger totalSucceeded = new AtomicInteger(0);

    // Live tracking
    private static volatile int liveActiveVThreads = 0;
    private static volatile int peakActiveVThreads = 0;
    private static volatile int liveCarrierThreads = 0;
    private static volatile int lastConcurrency = 0;
    private static volatile int lastSucceeded = 0;
    private static volatile long lastElapsedMs = 0;

    @GetMapping("/thread-demo")
    public ResponseEntity<Map<String, Object>> threadDemo(
            @RequestParam(defaultValue = "200") int sleepMs) throws InterruptedException {
        Thread t = Thread.currentThread();
        Thread.sleep(sleepMs);
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("app", "app2-java21-zgc-loom");
        r.put("status", "OK");
        r.put("threadName", t.getName());
        r.put("threadType", "virtual");
        r.put("isVirtual", t.isVirtual());
        r.put("sleepMs", sleepMs);
        return ResponseEntity.ok(r);
    }

    /**
     * Server-side burst — App2 virtual thread version.
     * <p>
     * Key difference from App1:
     * App1: newFixedThreadPool(200) — 201st task rejected
     * App2: newVirtualThreadPerTaskExecutor() — every task gets its own virtual thread
     * <p>
     * With 1000 concurrent tasks sleeping 200ms:
     * App1: 200 run, 800 rejected, takes 200ms
     * App2: ALL 1000 run concurrently, 0 rejected, takes ~200ms (same!)
     * <p>
     * The carrier thread count (OS threads) stays tiny (~8-20)
     * while virtual threads number in the thousands.
     */
    @PostMapping("/thread-demo/burst")
    public ResponseEntity<Map<String, Object>> burst(
            @RequestParam(defaultValue = "100") int concurrency,
            @RequestParam(defaultValue = "200") int sleepMs) throws InterruptedException {

        lastConcurrency = concurrency;
        liveActiveVThreads = 0;
        peakActiveVThreads = 0;

        // Virtual thread per task — no limit, no rejection
        ExecutorService pool = Executors.newVirtualThreadPerTaskExecutor();

        List<Future<String>> futures = new ArrayList<>();
        AtomicInteger active = new AtomicInteger(0);
        AtomicInteger peak = new AtomicInteger(0);
        long start = System.currentTimeMillis();

        for (int i = 0; i < concurrency; i++) {
            futures.add(pool.submit(() -> {
                int cur = active.incrementAndGet();
                peak.updateAndGet(p -> Math.max(p, cur));
                liveActiveVThreads = cur;
                peakActiveVThreads = peak.get();
                // Carrier thread count — how many OS threads actually used
                liveCarrierThreads = ManagementFactory.getThreadMXBean().getThreadCount();
                try {
                    // Virtual thread PARKS here — releases carrier OS thread
                    // This is why carrier count stays low even with 5000 virtual threads
                    Thread.sleep(sleepMs);
                    return "ok";
                } finally {
                    active.decrementAndGet();
                    liveActiveVThreads = active.get();
                }
            }));
        }

        pool.shutdown();
        pool.awaitTermination(sleepMs * 2L + 3000, TimeUnit.MILLISECONDS);

        int okCount = 0;
        for (Future<String> f : futures) {
            try {
                if ("ok".equals(f.get(200, TimeUnit.MILLISECONDS))) okCount++;
            } catch (Exception ignored) {
            }
        }

        long elapsed = System.currentTimeMillis() - start;
        liveActiveVThreads = 0;
        peakActiveVThreads = peak.get();
        liveCarrierThreads = ManagementFactory.getThreadMXBean().getThreadCount();
        lastSucceeded = okCount;
        lastElapsedMs = elapsed;

        totalSucceeded.addAndGet(okCount);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("app", "app2-java21-zgc-loom");
        result.put("threadType", "virtual");
        result.put("isVirtual", true);
        result.put("concurrency", concurrency);
        result.put("sleepMs", sleepMs);
        result.put("threadLimit", "unlimited");
        result.put("succeeded", okCount);
        result.put("rejected", 0);
        result.put("peakVirtualThreads", peak.get());
        result.put("carrierThreads", liveCarrierThreads);
        result.put("elapsedMs", elapsed);
        result.put("totalSucceeded", totalSucceeded.get());
        result.put("totalRejected", 0);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/thread-demo/stats")
    public ResponseEntity<Map<String, Object>> stats() {
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("app", "app2-java21-zgc-loom");
        r.put("threadType", "virtual");
        r.put("isVirtual", true);
        r.put("liveActiveVThreads", liveActiveVThreads);
        r.put("peakVirtualThreads", peakActiveVThreads);
        r.put("carrierThreads", liveCarrierThreads > 0 ? liveCarrierThreads : ManagementFactory.getThreadMXBean().getThreadCount());
        r.put("threadLimit", "unlimited");
        r.put("lastConcurrency", lastConcurrency);
        r.put("lastSucceeded", lastSucceeded);
        r.put("lastRejected", 0);
        r.put("lastElapsedMs", lastElapsedMs);
        r.put("totalSucceeded", totalSucceeded.get());
        r.put("totalRejected", 0);
        r.put("utilizationPct", 0);
        r.put("willCrashAt", "never — virtual threads scale freely");
        return ResponseEntity.ok(r);
    }

    @PostMapping("/thread-demo/reset")
    public ResponseEntity<Map<String, Object>> reset() {
        totalSucceeded.set(0);
        liveActiveVThreads = 0;
        peakActiveVThreads = 0;
        lastSucceeded = 0;
        lastElapsedMs = 0;
        lastConcurrency = 0;
        return ResponseEntity.ok(Map.of("reset", true));
    }

    public static int getLiveActiveVThreads() {
        return liveActiveVThreads;
    }

    public static int getPeakVirtualThreads() {
        return peakActiveVThreads;
    }

    public static int getLastRejected() {
        return 0;
    }
}
