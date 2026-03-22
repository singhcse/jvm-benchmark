package com.benchmark.app3.controller;

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

    private static final AtomicInteger totalRejected  = new AtomicInteger(0);
    private static final AtomicInteger totalSucceeded = new AtomicInteger(0);
    private static final int THREAD_POOL_LIMIT = 200;

    @GetMapping("/thread-demo")
    public ResponseEntity<Map<String, Object>> threadDemo(
            @RequestParam(defaultValue = "200") int sleepMs) throws InterruptedException {
        Thread.sleep(sleepMs);
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("app",        "app3-graalvm-native");
        r.put("status",     "OK");
        r.put("threadName", Thread.currentThread().getName());
        r.put("threadType", "platform");
        r.put("isVirtual",  false);
        r.put("sleepMs",    sleepMs);
        return ResponseEntity.ok(r);
    }

    /**
     * BURST endpoint — App3 version (same as App1, platform threads).
     * Native image still uses platform threads — same pool exhaustion behaviour.
     * Shows that AOT compilation alone doesn't solve concurrency.
     */
    @PostMapping("/thread-demo/burst")
    public ResponseEntity<Map<String, Object>> burst(
            @RequestParam(defaultValue = "100") int concurrency,
            @RequestParam(defaultValue = "200") int sleepMs) throws InterruptedException {

        ExecutorService pool = Executors.newFixedThreadPool(THREAD_POOL_LIMIT);
        List<Future<String>> futures = new ArrayList<>();
        AtomicInteger rejected = new AtomicInteger(0);
        long start = System.currentTimeMillis();

        for (int i = 0; i < concurrency; i++) {
            try {
                futures.add(pool.submit(() -> {
                    Thread.sleep(sleepMs);
                    return "ok";
                }));
            } catch (RejectedExecutionException e) {
                rejected.incrementAndGet();
            }
        }

        pool.shutdown();
        pool.awaitTermination(sleepMs * 3L + 2000, TimeUnit.MILLISECONDS);

        int okCount = 0;
        for (Future<String> f : futures) {
            try { if ("ok".equals(f.get(100, TimeUnit.MILLISECONDS))) okCount++; }
            catch (Exception ignored) {}
        }

        int actualRejected = concurrency - okCount;
        totalSucceeded.addAndGet(okCount);
        totalRejected.addAndGet(actualRejected);

        ThreadMXBean tb = ManagementFactory.getThreadMXBean();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("app",            "app3-graalvm-native");
        result.put("threadType",     "platform");
        result.put("isVirtual",      false);
        result.put("concurrency",    concurrency);
        result.put("sleepMs",        sleepMs);
        result.put("threadLimit",    THREAD_POOL_LIMIT);
        result.put("succeeded",      okCount);
        result.put("rejected",       actualRejected);
        result.put("elapsedMs",      System.currentTimeMillis() - start);
        result.put("totalOsThreads", tb.getThreadCount());
        result.put("utilizationPct", Math.min(100, concurrency * 100 / THREAD_POOL_LIMIT));
        result.put("totalSucceeded", totalSucceeded.get());
        result.put("totalRejected",  totalRejected.get());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/thread-demo/stats")
    public ResponseEntity<Map<String, Object>> stats() {
        ThreadMXBean tb = ManagementFactory.getThreadMXBean();
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("app",            "app3-graalvm-native");
        r.put("threadType",     "platform");
        r.put("isVirtual",      false);
        r.put("totalOsThreads", tb.getThreadCount());
        r.put("threadLimit",    THREAD_POOL_LIMIT);
        r.put("totalSucceeded", totalSucceeded.get());
        r.put("totalRejected",  totalRejected.get());
        r.put("willCrashAt",    THREAD_POOL_LIMIT + " concurrent");
        return ResponseEntity.ok(r);
    }

    @PostMapping("/thread-demo/reset")
    public ResponseEntity<Map<String, Object>> reset() {
        totalRejected.set(0); totalSucceeded.set(0);
        return ResponseEntity.ok(Map.of("reset", true));
    }
}
