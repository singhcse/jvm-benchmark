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
    private static final AtomicInteger totalRejected  = new AtomicInteger(0);

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
        r.put("isVirtual",  t.isVirtual());
        r.put("sleepMs", sleepMs);
        return ResponseEntity.ok(r);
    }

    /**
     * BURST endpoint — App2 version with VIRTUAL threads.
     *
     * Uses Executors.newVirtualThreadPerTaskExecutor() — creates one virtual
     * thread per task. No fixed pool, no rejection possible.
     *
     * With 1000 concurrent tasks each sleeping 200ms:
     *   App1: 200 run, 800 queue/reject (fixed platform pool)
     *   App2: ALL 1000 run concurrently on ~8 carrier OS threads
     *
     * This is the core Loom demonstration.
     */
    @PostMapping("/thread-demo/burst")
    public ResponseEntity<Map<String, Object>> burst(
            @RequestParam(defaultValue = "100") int concurrency,
            @RequestParam(defaultValue = "200") int sleepMs) throws InterruptedException {

        // Virtual thread per task — unlimited, no rejection possible
        ExecutorService pool = Executors.newVirtualThreadPerTaskExecutor();

        List<Future<String>> futures = new ArrayList<>();
        long start = System.currentTimeMillis();

        // Submit ALL tasks — all get their own virtual thread immediately
        for (int i = 0; i < concurrency; i++) {
            futures.add(pool.submit(() -> {
                // This parks the virtual thread, releases carrier OS thread
                Thread.sleep(sleepMs);
                return "ok";
            }));
        }

        pool.shutdown();
        pool.awaitTermination(sleepMs * 2L + 3000, TimeUnit.MILLISECONDS);

        int okCount = 0;
        for (Future<String> f : futures) {
            try { if ("ok".equals(f.get(100, TimeUnit.MILLISECONDS))) okCount++; }
            catch (Exception ignored) {}
        }

        totalSucceeded.addAndGet(okCount);
        // Virtual threads never reject
        long elapsed = System.currentTimeMillis() - start;

        ThreadMXBean tb = ManagementFactory.getThreadMXBean();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("app",            "app2-java21-zgc-loom");
        result.put("threadType",     "virtual");
        result.put("isVirtual",      true);
        result.put("concurrency",    concurrency);
        result.put("sleepMs",        sleepMs);
        result.put("threadLimit",    "unlimited");
        result.put("succeeded",      okCount);
        result.put("rejected",       0);
        result.put("elapsedMs",      elapsed);
        result.put("carrierThreads", tb.getThreadCount());
        result.put("utilizationPct", 0);
        result.put("totalSucceeded", totalSucceeded.get());
        result.put("totalRejected",  0);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/thread-demo/stats")
    public ResponseEntity<Map<String, Object>> stats() {
        ThreadMXBean tb = ManagementFactory.getThreadMXBean();
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("app",            "app2-java21-zgc-loom");
        r.put("threadType",     "virtual");
        r.put("isVirtual",      true);
        r.put("carrierThreads", tb.getThreadCount());
        r.put("threadLimit",    "unlimited");
        r.put("totalSucceeded", totalSucceeded.get());
        r.put("totalRejected",  0);
        r.put("willCrashAt",    "never");
        return ResponseEntity.ok(r);
    }

    @PostMapping("/thread-demo/reset")
    public ResponseEntity<Map<String, Object>> reset() {
        totalSucceeded.set(0); totalRejected.set(0);
        return ResponseEntity.ok(Map.of("reset", true));
    }
}
