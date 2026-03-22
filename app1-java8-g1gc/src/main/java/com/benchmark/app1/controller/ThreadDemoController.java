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

    private static final AtomicInteger totalRejected = new AtomicInteger(0);
    private static final AtomicInteger totalSucceeded = new AtomicInteger(0);
    private static final int THREAD_POOL_LIMIT = 200;

    /**
     * Single request endpoint — still useful for manual testing
     */
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
     * BURST endpoint — the key to real concurrency testing.
     *
     * The React dashboard sends ONE request here asking the server to
     * spawn N concurrent threads internally. This bypasses the browser's
     * 6-connection limit entirely.
     *
     * App1 uses a fixed thread pool of THREAD_POOL_LIMIT (200).
     * When N > 200, excess tasks queue and eventually timeout → rejections.
     */
    @PostMapping("/thread-demo/burst")
    public ResponseEntity<Map<String, Object>> burst(
            @RequestParam(defaultValue = "100") int concurrency,
            @RequestParam(defaultValue = "200") int sleepMs) throws InterruptedException {

        // Fixed platform thread pool — simulates Tomcat's real constraint
        ExecutorService pool = Executors.newFixedThreadPool(THREAD_POOL_LIMIT);

        List<Future<String>> futures = new ArrayList<>();
        AtomicInteger accepted = new AtomicInteger(0);
        AtomicInteger rejected = new AtomicInteger(0);
        AtomicInteger completed = new AtomicInteger(0);

        long start = System.currentTimeMillis();

        // Submit all N tasks to the pool at once
        for (int i = 0; i < concurrency; i++) {
            try {
                Future<String> f = pool.submit(() -> {
                    accepted.incrementAndGet();
                    try {
                        Thread.sleep(sleepMs);
                        completed.incrementAndGet();
                        return "ok";
                    } catch (InterruptedException e) {
                        return "interrupted";
                    }
                });
                futures.add(f);
            } catch (RejectedExecutionException e) {
                rejected.incrementAndGet();
            }
        }

        pool.shutdown();
        // Wait for all tasks — max wait = sleepMs * 3
        boolean finished = pool.awaitTermination(sleepMs * 3L + 2000, TimeUnit.MILLISECONDS);

        // Count actual completions from futures
        int okCount = 0, failCount = 0;
        for (Future<String> f : futures) {
            try {
                String result = f.get(100, TimeUnit.MILLISECONDS);
                if ("ok".equals(result)) okCount++; else failCount++;
            } catch (Exception e) {
                failCount++;
            }
        }

        // Rejections = tasks rejected by pool + tasks that didn't complete
        int actualRejected = rejected.get() + (concurrency - accepted.get() - rejected.get());
        int actualOk = okCount;

        totalSucceeded.addAndGet(actualOk);
        totalRejected.addAndGet(actualRejected);

        ThreadMXBean tb = ManagementFactory.getThreadMXBean();
        long elapsed = System.currentTimeMillis() - start;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("app",           "app1-java8-g1gc");
        result.put("threadType",    "platform");
        result.put("isVirtual",     false);
        result.put("concurrency",   concurrency);
        result.put("sleepMs",       sleepMs);
        result.put("threadLimit",   THREAD_POOL_LIMIT);
        result.put("succeeded",     actualOk);
        result.put("rejected",      actualRejected);
        result.put("elapsedMs",     elapsed);
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
        r.put("app",            "app1-java8-g1gc");
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
        totalRejected.set(0);
        totalSucceeded.set(0);
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("reset", true);
        return ResponseEntity.ok(r);
    }
}
