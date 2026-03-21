package com.benchmark.app1.controller;

import com.benchmark.app1.model.BenchmarkResult;
import com.benchmark.app1.model.MetricsSnapshot;
import com.benchmark.app1.service.BenchmarkService;
import com.benchmark.app1.service.MetricsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class BenchmarkController {

    private final BenchmarkService benchmarkService;
    private final MetricsService metricsService;

    public BenchmarkController(BenchmarkService benchmarkService, MetricsService metricsService) {
        this.benchmarkService = benchmarkService;
        this.metricsService = metricsService;
    }

    /**
     * CPU-intensive: recursive Fibonacci(40)
     * Shows JIT warm-up benefit over time on App1
     */
    @GetMapping("/cpu-intensive")
    public ResponseEntity<BenchmarkResult> cpuIntensive(
            @RequestParam(defaultValue = "40") int n) {
        long start = System.currentTimeMillis();
        long result = benchmarkService.fibonacci(n);
        long duration = System.currentTimeMillis() - start;

        return ResponseEntity.ok(BenchmarkResult.builder()
                .app("app1-java8-g1gc")
                .endpoint("/api/cpu-intensive")
                .result(String.valueOf(result))
                .durationMs(duration)
                .threadName(Thread.currentThread().getName())
                .threadType("platform")
                .build());
    }

    /**
     * IO-intensive: simulates external API / DB latency with sleep
     * Shows platform thread blocking cost on App1
     */
    @GetMapping("/io-intensive")
    public ResponseEntity<BenchmarkResult> ioIntensive(
            @RequestParam(defaultValue = "200") int sleepMs) throws InterruptedException {
        long start = System.currentTimeMillis();
        benchmarkService.simulateIo(sleepMs);
        long duration = System.currentTimeMillis() - start;

        return ResponseEntity.ok(BenchmarkResult.builder()
                .app("app1-java8-g1gc")
                .endpoint("/api/io-intensive")
                .result("io-complete")
                .durationMs(duration)
                .threadName(Thread.currentThread().getName())
                .threadType("platform")
                .build());
    }

    /**
     * Memory-intensive: allocates then releases memory to trigger GC
     * Shows G1GC pause times on App1
     */
    @GetMapping("/memory-test")
    public ResponseEntity<BenchmarkResult> memoryTest(
            @RequestParam(defaultValue = "100") int allocMb) {
        long start = System.currentTimeMillis();
        long bytesBefore = Runtime.getRuntime().freeMemory();
        benchmarkService.allocateMemory(allocMb);
        long bytesAfter = Runtime.getRuntime().freeMemory();
        long duration = System.currentTimeMillis() - start;

        return ResponseEntity.ok(BenchmarkResult.builder()
                .app("app1-java8-g1gc")
                .endpoint("/api/memory-test")
                .result("allocated-" + allocMb + "mb")
                .durationMs(duration)
                .threadName(Thread.currentThread().getName())
                .threadType("platform")
                .build());
    }

    /**
     * DB call: simple SELECT query — identical across all 3 apps
     */
    @GetMapping("/db-call")
    public ResponseEntity<BenchmarkResult> dbCall() {
        long start = System.currentTimeMillis();
        List<String> rows = benchmarkService.queryDatabase();
        long duration = System.currentTimeMillis() - start;

        return ResponseEntity.ok(BenchmarkResult.builder()
                .app("app1-java8-g1gc")
                .endpoint("/api/db-call")
                .result("rows-" + rows.size())
                .durationMs(duration)
                .threadName(Thread.currentThread().getName())
                .threadType("platform")
                .build());
    }

    /**
     * Custom metrics snapshot — polled by React dashboard every 2s
     */
    @GetMapping("/metrics/snapshot")
    public ResponseEntity<MetricsSnapshot> metricsSnapshot() {
        return ResponseEntity.ok(metricsService.buildSnapshot());
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("UP - app1-java8-g1gc");
    }
}
