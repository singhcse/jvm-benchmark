package com.benchmark.app3.service;

import com.benchmark.app3.model.WorkItem;
import com.benchmark.app3.repository.WorkItemRepository;
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
     * Identical Fibonacci — same algorithm, different runtime.
     * In native image: already machine code, no JIT warmup needed.
     * First call == hundredth call in performance. No cold start penalty.
     */
    public long fibonacci(int n) {
        if (n <= 1) return n;
        return fibonacci(n - 1) + fibonacci(n - 2);
    }

    public void simulateIo(int sleepMs) throws InterruptedException {
        Thread.sleep(sleepMs);
    }

    /**
     * Native image GC behaviour:
     * Default: Serial GC (single-threaded, minimal overhead, lowest RSS)
     * Optional: --gc=G1 or --gc=epsilon (no GC, for latency testing)
     * No dynamic class loading means GC has a simpler job.
     */
    public void allocateMemory(int megabytes) {
        List<byte[]> allocations = new ArrayList<>();
        try {
            for (int i = 0; i < megabytes; i++) {
                allocations.add(new byte[1024 * 1024]);
            }
            Thread.sleep(10);
        } catch (InterruptedException | OutOfMemoryError e) {
            System.err.println("[App3] Memory allocation interrupted: " + e.getMessage());
        } finally {
            allocations.clear();
        }
    }

    public List<String> queryDatabase() {
        return workItemRepository.findAll()
                .stream()
                .map(WorkItem::getPayload)
                .collect(Collectors.toList());
    }
}
