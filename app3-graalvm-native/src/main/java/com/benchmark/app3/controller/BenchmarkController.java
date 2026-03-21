package com.benchmark.app3.controller;

import com.benchmark.app3.model.BenchmarkResult;
import com.benchmark.app3.model.MetricsSnapshot;
import com.benchmark.app3.service.BenchmarkService;
import com.benchmark.app3.service.MetricsService;
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
     * CPU-intensive: Fibonacci(40)
     * Native image key difference: NO JIT.
     * Code is already compiled to native machine code at build time (AOT).
     * No warmup needed — first call is as fast as the hundredth.
     * But: AOT can't apply runtime-specific optimisations that JIT can (e.g., inlining
     * based on actual call frequency). So peak CPU throughput may be lower than App1/App2 warm.
     */
    @GetMapping("/cpu-intensive")
    public ResponseEntity<BenchmarkResult> cpuIntensive(
            @RequestParam(defaultValue = "40") int n) {
        long start = System.currentTimeMillis();
        long result = benchmarkService.fibonacci(n);
        long duration = System.currentTimeMillis() - start;

        return ResponseEntity.ok(BenchmarkResult.builder()
                .app("app3-graalvm-native")
                .endpoint("/api/cpu-intensive")
                .result(String.valueOf(result))
                .durationMs(duration)
                .threadName(Thread.currentThread().getName())
                .threadType("platform")
                .isNative(true)
                .build());
    }

    /**
     * IO-intensive: simulated blocking I/O
     * Native image runs on platform threads by default.
     * For virtual threads in native: requires GraalVM 21+ with Loom support.
     * This version uses platform threads — showing native's I/O concurrency limits.
     */
    @GetMapping("/io-intensive")
    public ResponseEntity<BenchmarkResult> ioIntensive(
            @RequestParam(defaultValue = "200") int sleepMs) throws InterruptedException {
        long start = System.currentTimeMillis();
        benchmarkService.simulateIo(sleepMs);
        long duration = System.currentTimeMillis() - start;

        return ResponseEntity.ok(BenchmarkResult.builder()
                .app("app3-graalvm-native")
                .endpoint("/api/io-intensive")
                .result("io-complete")
                .durationMs(duration)
                .threadName(Thread.currentThread().getName())
                .threadType("platform")
                .isNative(true)
                .build());
    }

    /**
     * Memory-intensive: allocation
     * Native image has no traditional GC pauses.
     * Uses Serial GC by default (smallest footprint) or G1 with --gc=G1 flag.
     * Memory footprint (RSS) is drastically lower than JVM apps.
     */
    @GetMapping("/memory-test")
    public ResponseEntity<BenchmarkResult> memoryTest(
            @RequestParam(defaultValue = "100") int allocMb) {
        long start = System.currentTimeMillis();
        benchmarkService.allocateMemory(allocMb);
        long duration = System.currentTimeMillis() - start;

        return ResponseEntity.ok(BenchmarkResult.builder()
                .app("app3-graalvm-native")
                .endpoint("/api/memory-test")
                .result("allocated-" + allocMb + "mb")
                .durationMs(duration)
                .threadName(Thread.currentThread().getName())
                .threadType("platform")
                .isNative(true)
                .build());
    }

    @GetMapping("/db-call")
    public ResponseEntity<BenchmarkResult> dbCall() {
        long start = System.currentTimeMillis();
        List<String> rows = benchmarkService.queryDatabase();
        long duration = System.currentTimeMillis() - start;

        return ResponseEntity.ok(BenchmarkResult.builder()
                .app("app3-graalvm-native")
                .endpoint("/api/db-call")
                .result("rows-" + rows.size())
                .durationMs(duration)
                .threadName(Thread.currentThread().getName())
                .threadType("platform")
                .isNative(true)
                .build());
    }

    @GetMapping("/metrics/snapshot")
    public ResponseEntity<MetricsSnapshot> metricsSnapshot() {
        return ResponseEntity.ok(metricsService.buildSnapshot());
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("UP - app3-graalvm-native");
    }
}
