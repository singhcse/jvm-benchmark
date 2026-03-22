package com.benchmark.app2.service;

import com.benchmark.app2.config.StartupTracker;
import com.benchmark.app2.controller.ThreadDemoController;
import com.benchmark.app2.model.MetricsSnapshot;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Service;
import java.lang.management.*;

@Service
public class MetricsService {

    private final MeterRegistry meterRegistry;

    public MetricsService(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
    }

    public MetricsSnapshot buildSnapshot() {
        MemoryMXBean mem     = ManagementFactory.getMemoryMXBean();
        MemoryUsage  heap    = mem.getHeapMemoryUsage();
        MemoryUsage  nonHeap = mem.getNonHeapMemoryUsage();
        ThreadMXBean threads = ManagementFactory.getThreadMXBean();

        long gcPauseMax = 0, gcPauseTotal = 0, gcCount = 0;
        String gcName = "ZGC";
        for (GarbageCollectorMXBean gc : ManagementFactory.getGarbageCollectorMXBeans()) {
            gcName = gc.getName();
            if (gc.getCollectionTime() > gcPauseMax) gcPauseMax = gc.getCollectionTime();
            gcPauseTotal += gc.getCollectionTime();
            gcCount      += gc.getCollectionCount();
        }
        long gcPauseAvg = gcCount > 0 ? gcPauseTotal / gcCount : 0;

        double cpu = 0;
        OperatingSystemMXBean os = ManagementFactory.getOperatingSystemMXBean();
        if (os instanceof com.sun.management.OperatingSystemMXBean) {
            cpu = ((com.sun.management.OperatingSystemMXBean) os).getProcessCpuLoad() * 100;
        }

        return MetricsSnapshot.builder()
                .appName("app2-java21-zgc-loom")
                .appLabel("Java 21 · ZGC · Loom")
                .port(8081)
                .startupMs(StartupTracker.getStartupMs())
                .heapUsedMb(heap.getUsed()    / 1024 / 1024)
                .heapMaxMb(heap.getMax()       / 1024 / 1024)
                .nonHeapUsedMb(nonHeap.getUsed() / 1024 / 1024)
                .threadCount(threads.getThreadCount())
                // App2: peak virtual threads + carrier OS threads
                .peakBurstThreads(ThreadDemoController.getPeakVirtualThreads())
                .activeBurstThreads(ThreadDemoController.getLiveActiveVThreads())
                .burstRejected(0)
                .virtualThreads(true)
                .gcPauseMaxMs(gcPauseMax)
                .gcPauseAvgMs(gcPauseAvg)
                .gcCollectionCount(gcCount)
                .gcType(gcName)
                .cpuPercent(Math.max(0, Math.min(100, cpu)))
                .javaVersion("21")
                .compiler("JIT HotSpot (C1+C2 Tiered)")
                .threadModel("Virtual Threads (Project Loom)")
                .build();
    }
}
