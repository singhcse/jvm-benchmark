package com.benchmark.app3.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.lang.management.ManagementFactory;
import java.lang.management.ThreadMXBean;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Thread stress demo — App3 GraalVM Native version.
 *
 * App3 uses platform threads like App1 but with a smaller memory footprint.
 * Thread pool limit is similar to App1 — will also exhaust under high load.
 *
 * Key difference from App1: no JVM overhead, lower RSS memory per thread.
 * Key similarity to App1: still OS threads — will reject above ~200 concurrent.
 *
 * This shows that native image alone doesn't solve concurrency — you need
 * virtual threads (App2) for high-concurrency I/O workloads.
 */
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ThreadDemoController {

    private static final AtomicInteger activePlatformThreads = new AtomicInteger(0);
    private static final AtomicInteger totalRequests         = new AtomicInteger(0);
    private static final AtomicInteger rejectedRequests      = new AtomicInteger(0);
    private static final int THREAD_POOL_LIMIT = 200;

    @GetMapping("/thread-demo")
    public ResponseEntity<Map<String, Object>> threadDemo(
            @RequestParam(defaultValue = "200") int sleepMs) throws InterruptedException {

        int current = activePlatformThreads.incrementAndGet();
        totalRequests.incrementAndGet();

        Map<String, Object> result = new LinkedHashMap<>();

        if (current > THREAD_POOL_LIMIT) {
            rejectedRequests.incrementAndGet();
            activePlatformThreads.decrementAndGet();
            result.put("app",           "app3-graalvm-native");
            result.put("status",        "REJECTED");
            result.put("reason",        "Thread pool exhausted — native image uses platform threads");
            result.put("activeThreads", current);
            result.put("threadLimit",   THREAD_POOL_LIMIT);
            result.put("threadType",    "platform");
            result.put("isVirtual",     false);
            return ResponseEntity.status(503).body(result);
        }

        long start = System.currentTimeMillis();
        try {
            Thread.sleep(sleepMs);
        } finally {
            activePlatformThreads.decrementAndGet();
        }

        ThreadMXBean threadBean = ManagementFactory.getThreadMXBean();

        result.put("app",            "app3-graalvm-native");
        result.put("status",         "OK");
        result.put("threadName",     Thread.currentThread().getName());
        result.put("threadType",     "platform");
        result.put("isVirtual",      false);
        result.put("sleepMs",        sleepMs);
        result.put("actualMs",       System.currentTimeMillis() - start);
        result.put("activeThreads",  current);
        result.put("totalOsThreads", threadBean.getThreadCount());
        result.put("threadLimit",    THREAD_POOL_LIMIT);
        result.put("rejectedSoFar",  rejectedRequests.get());
        result.put("utilizationPct", Math.min(100, current * 100 / THREAD_POOL_LIMIT));
        return ResponseEntity.ok(result);
    }

    @GetMapping("/thread-demo/stats")
    public ResponseEntity<Map<String, Object>> stats() {
        ThreadMXBean threadBean = ManagementFactory.getThreadMXBean();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("app",            "app3-graalvm-native");
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
