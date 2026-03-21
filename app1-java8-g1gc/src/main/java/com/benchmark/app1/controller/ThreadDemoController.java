package com.benchmark.app1.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.lang.management.ManagementFactory;
import java.lang.management.ThreadMXBean;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Thread stress demo endpoint.
 *
 * Each request sleeps for the given duration — simulating a blocking I/O call
 * (DB query, external API, file read etc.)
 *
 * App1 uses platform threads (one OS thread per request).
 * Under high concurrency, Tomcat's thread pool (default 200) exhausts quickly.
 * New requests get queued then rejected → latency spikes → errors appear.
 *
 * Compare with App2 which uses virtual threads — same sleep, no exhaustion.
 */
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ThreadDemoController {

    // Track concurrent requests in flight
    private static final AtomicInteger activePlatformThreads = new AtomicInteger(0);
    private static final AtomicInteger totalRequests         = new AtomicInteger(0);
    private static final AtomicInteger rejectedRequests      = new AtomicInteger(0);

    // Platform thread pool limit (Tomcat default)
    private static final int THREAD_POOL_LIMIT = 200;

    @GetMapping("/thread-demo")
    public ResponseEntity<Map<String, Object>> threadDemo(
            @RequestParam(defaultValue = "200") int sleepMs) throws InterruptedException {

        int current = activePlatformThreads.incrementAndGet();
        totalRequests.incrementAndGet();

        Map<String, Object> result = new LinkedHashMap<>();

        // Simulate what happens when thread pool is close to exhaustion
        if (current > THREAD_POOL_LIMIT) {
            rejectedRequests.incrementAndGet();
            activePlatformThreads.decrementAndGet();
            result.put("app",           "app1-java8-g1gc");
            result.put("status",        "REJECTED");
            result.put("reason",        "Thread pool exhausted — platform thread limit reached");
            result.put("activeThreads", current);
            result.put("threadLimit",   THREAD_POOL_LIMIT);
            result.put("threadType",    "platform");
            result.put("isVirtual",     false);
            return ResponseEntity.status(503).body(result);
        }

        long start = System.currentTimeMillis();
        try {
            // Blocking sleep — on platform threads this holds the OS thread
            Thread.sleep(sleepMs);
        } finally {
            activePlatformThreads.decrementAndGet();
        }

        ThreadMXBean threadBean = ManagementFactory.getThreadMXBean();

        result.put("app",              "app1-java8-g1gc");
        result.put("status",           "OK");
        result.put("threadName",       Thread.currentThread().getName());
        result.put("threadType",       "platform");
        result.put("isVirtual",        false);
        result.put("sleepMs",          sleepMs);
        result.put("actualMs",         System.currentTimeMillis() - start);
        result.put("activeThreads",    current);
        result.put("totalOsThreads",   threadBean.getThreadCount());
        result.put("threadLimit",      THREAD_POOL_LIMIT);
        result.put("rejectedSoFar",    rejectedRequests.get());
        result.put("utilizationPct",   Math.min(100, current * 100 / THREAD_POOL_LIMIT));
        return ResponseEntity.ok(result);
    }

    @GetMapping("/thread-demo/stats")
    public ResponseEntity<Map<String, Object>> stats() {
        ThreadMXBean threadBean = ManagementFactory.getThreadMXBean();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("app",            "app1-java8-g1gc");
        result.put("threadType",     "platform");
        result.put("isVirtual",      false);
        result.put("activeRequests", activePlatformThreads.get());
        result.put("totalOsThreads", threadBean.getThreadCount());
        result.put("threadLimit",    THREAD_POOL_LIMIT);
        result.put("totalRequests",  totalRequests.get());
        result.put("rejectedCount",  rejectedRequests.get());
        result.put("utilizationPct", Math.min(100, activePlatformThreads.get() * 100 / THREAD_POOL_LIMIT));
        result.put("willCrashAt",    THREAD_POOL_LIMIT + " concurrent requests");
        return ResponseEntity.ok(result);
    }
}
