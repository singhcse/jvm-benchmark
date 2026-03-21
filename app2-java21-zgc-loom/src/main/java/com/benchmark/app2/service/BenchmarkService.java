package com.benchmark.app2.service;

import com.benchmark.app2.model.WorkItem;
import com.benchmark.app2.repository.WorkItemRepository;
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
     * Same naive Fibonacci as App1 — intentionally identical for fair CPU comparison.
     * JIT will optimise this on both App1 and App2 after warmup.
     */
    public long fibonacci(int n) {
        if (n <= 1) return n;
        return fibonacci(n - 1) + fibonacci(n - 2);
    }

    /**
     * Thread.sleep() on a virtual thread parks the virtual thread and
     * releases the underlying carrier (OS) thread back to the pool.
     * This is why App2 can handle 100,000 concurrent sleeping requests
     * with just 8 carrier threads — no OS thread explosion.
     */
    public void simulateIo(int sleepMs) throws InterruptedException {
        Thread.sleep(sleepMs);
    }

    /**
     * Allocate memory to trigger ZGC.
     * ZGC is a concurrent collector — it does almost all work concurrently
     * with the application, producing sub-millisecond stop-the-world pauses.
     * Watch the GC pause dashboard panel to see the difference vs G1GC.
     */
    public void allocateMemory(int megabytes) {
        List<byte[]> allocations = new ArrayList<>();
        try {
            for (int i = 0; i < megabytes; i++) {
                allocations.add(new byte[1024 * 1024]);
            }
            Thread.sleep(10);
        } catch (InterruptedException | OutOfMemoryError e) {
            System.err.println("[App2] Memory allocation interrupted: " + e.getMessage());
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
