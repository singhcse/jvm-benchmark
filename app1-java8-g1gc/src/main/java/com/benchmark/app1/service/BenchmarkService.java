package com.benchmark.app1.service;

import com.benchmark.app1.model.WorkItem;
import com.benchmark.app1.repository.WorkItemRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BenchmarkService {

    private final WorkItemRepository workItemRepository;

    public BenchmarkService(WorkItemRepository workItemRepository) {
        this.workItemRepository = workItemRepository;
    }

    /**
     * Recursive Fibonacci — intentionally naive to be CPU-heavy.
     * After JIT warmup, HotSpot C2 will heavily optimise this method.
     * You'll see latency drop significantly after ~50-100 calls on App1.
     */
    public long fibonacci(int n) {
        if (n <= 1) return n;
        return fibonacci(n - 1) + fibonacci(n - 2);
    }

    /**
     * Simulates blocking I/O (DB query, external API call, etc.)
     * On App1 (platform threads), each sleeping thread holds an OS thread.
     * On App2 (virtual threads), sleeping releases the carrier thread.
     * This is where App2 wins under high concurrency.
     */
    public void simulateIo(int sleepMs) throws InterruptedException {
        Thread.sleep(sleepMs);
    }

    /**
     * Allocates memory in 1MB chunks to trigger GC activity.
     * Forces G1GC to work — you'll see pause events in Prometheus.
     * App3 (native) has no traditional GC, so this completes differently.
     */
    public void allocateMemory(int megabytes) {
        List<byte[]> allocations = new ArrayList<>();
        try {
            for (int i = 0; i < megabytes; i++) {
                allocations.add(new byte[1024 * 1024]); // 1 MB per chunk
            }
            // Hold briefly to ensure GC notices
            Thread.sleep(10);
        } catch (InterruptedException | OutOfMemoryError e) {
            // Expected under heavy load — log and move on
            System.err.println("[App1] Memory allocation interrupted: " + e.getMessage());
        } finally {
            allocations.clear(); // Allow GC to reclaim
        }
    }

    /**
     * Real DB query — identical across all 3 apps.
     * Uses the shared PostgreSQL / H2 instance.
     */
    public List<String> queryDatabase() {
        return workItemRepository.findAll()
                .stream()
                .map(WorkItem::getPayload)
                .collect(Collectors.toList());
    }
}
