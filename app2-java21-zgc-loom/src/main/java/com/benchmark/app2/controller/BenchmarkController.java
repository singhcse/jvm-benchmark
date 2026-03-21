package com.benchmark.app2.controller;

import com.benchmark.app2.model.BenchmarkResult;
import com.benchmark.app2.model.MetricsSnapshot;
import com.benchmark.app2.service.BenchmarkService;
import com.benchmark.app2.service.MetricsService;
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
     * App2 uses JIT just like App1, so warm throughput is comparable.
     * Key difference: requests execute on virtual threads — carrier threads
     * are not pinned during compute unless there is a synchronized block.
     */
    @GetMapping("/cpu-intensive")
    public ResponseEntity<BenchmarkResult> cpuIntensive(
            @RequestParam(defaultValue = "40") int n) {
        long start = System.currentTimeMillis();
        long result = benchmarkService.fibonacci(n);
        long duration = System.currentTimeMillis() - start;
        Thread t = Thread.currentThread();

        return ResponseEntity.ok(BenchmarkResult.builder()
                .app("app2-java21-zgc-loom")
                .endpoint("/api/cpu-intensive")
                .result(String.valueOf(result))
                .durationMs(duration)
                .threadName(t.getName())
                .threadType(t.isVirtual() ? "virtual" : "platform")
                .isVirtual(t.isVirtual())
                .build());
    }

    /**
     * IO-intensive: simulated blocking sleep
     * THIS is where App2 dominates at high concurrency.
     * Virtual threads park (release carrier) during Thread.sleep(),
     * allowing thousands of concurrent requests with just ~8 OS threads.
     * App1 would exhaust its platform thread pool quickly here.
     */
    @GetMapping("/io-intensive")
    public ResponseEntity<BenchmarkResult> ioIntensive(
            @RequestParam(defaultValue = "200") int sleepMs) throws InterruptedException {
        long start = System.currentTimeMillis();
        benchmarkService.simulateIo(sleepMs);
        long duration = System.currentTimeMillis() - start;
        Thread t = Thread.currentThread();

        return ResponseEntity.ok(BenchmarkResult.builder()
                .app("app2-java21-zgc-loom")
                .endpoint("/api/io-intensive")
                .result("io-complete")
                .durationMs(duration)
                .threadName(t.getName())
                .threadType(t.isVirtual() ? "virtual" : "platform")
                .isVirtual(t.isVirtual())
                .build());
    }

    /**
     * Memory-intensive: allocation + GC
     * ZGC advantage: sub-millisecond pause times even under heavy allocation.
     * Compare GC pause metrics vs App1 (G1GC) in the dashboard.
     */
    @GetMapping("/memory-test")
    public ResponseEntity<BenchmarkResult> memoryTest(
            @RequestParam(defaultValue = "100") int allocMb) {
        long start = System.currentTimeMillis();
        benchmarkService.allocateMemory(allocMb);
        long duration = System.currentTimeMillis() - start;
        Thread t = Thread.currentThread();

        return ResponseEntity.ok(BenchmarkResult.builder()
                .app("app2-java21-zgc-loom")
                .endpoint("/api/memory-test")
                .result("allocated-" + allocMb + "mb")
                .durationMs(duration)
                .threadName(t.getName())
                .threadType(t.isVirtual() ? "virtual" : "platform")
                .isVirtual(t.isVirtual())
                .build());
    }

    /**
     * DB call — identical logic across all 3 apps.
     * Virtual threads make JDBC blocking calls scalable without reactive code.
     */
    @GetMapping("/db-call")
    public ResponseEntity<BenchmarkResult> dbCall() {
        long start = System.currentTimeMillis();
        List<String> rows = benchmarkService.queryDatabase();
        long duration = System.currentTimeMillis() - start;
        Thread t = Thread.currentThread();

        return ResponseEntity.ok(BenchmarkResult.builder()
                .app("app2-java21-zgc-loom")
                .endpoint("/api/db-call")
                .result("rows-" + rows.size())
                .durationMs(duration)
                .threadName(t.getName())
                .threadType(t.isVirtual() ? "virtual" : "platform")
                .isVirtual(t.isVirtual())
                .build());
    }

    @GetMapping("/metrics/snapshot")
    public ResponseEntity<MetricsSnapshot> metricsSnapshot() {
        return ResponseEntity.ok(metricsService.buildSnapshot());
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("UP - app2-java21-zgc-loom");
    }
}
