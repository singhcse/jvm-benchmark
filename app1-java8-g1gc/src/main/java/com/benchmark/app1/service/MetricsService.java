package com.benchmark.app1.service;

import com.benchmark.app1.config.StartupTracker;
import com.benchmark.app1.controller.ThreadDemoController;
import com.benchmark.app1.model.MetricsSnapshot;
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
        String gcName = "G1GC";
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
                .appName("app1-java8-g1gc")
                .appLabel("Java 8 · G1GC · JIT")
                .port(8080)
                .startupMs(StartupTracker.getStartupMs())
                .heapUsedMb(heap.getUsed()    / 1024 / 1024)
                .heapMaxMb(heap.getMax()       / 1024 / 1024)
                .nonHeapUsedMb(nonHeap.getUsed() / 1024 / 1024)
                // Total JVM threads (background: GC, JIT, Tomcat idle pool etc.)
                .threadCount(threads.getThreadCount())
                // Peak threads during last burst — captured from ThreadDemoController
                .peakBurstThreads(ThreadDemoController.getLivePeakThreads())
                .activeBurstThreads(ThreadDemoController.getLiveActiveThreads())
                .burstRejected(ThreadDemoController.getLastRejected())
                .virtualThreads(false)
                .gcPauseMaxMs(gcPauseMax)
                .gcPauseAvgMs(gcPauseAvg)
                .gcCollectionCount(gcCount)
                .gcType(gcName)
                .cpuPercent(Math.max(0, Math.min(100, cpu)))
                .javaVersion("8")
                .compiler("JIT (C1+C2 Tiered)")
                .threadModel("Platform (OS) threads")
                .build();
    }
}
