package com.benchmark.app3.service;

import com.benchmark.app3.config.StartupTracker;
import com.benchmark.app3.model.MetricsSnapshot;
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
        String gcName = "Serial GC";
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

        boolean isNativeImage = System.getProperty("org.graalvm.nativeimage.imagecode") != null;

        return MetricsSnapshot.builder()
                .appName("app3-graalvm-native")
                .appLabel("GraalVM Native · AOT")
                .port(8082)
                .startupMs(StartupTracker.getStartupMs())
                .heapUsedMb(heap.getUsed()    / 1024 / 1024)
                .heapMaxMb(heap.getMax()       / 1024 / 1024)
                .nonHeapUsedMb(nonHeap.getUsed() / 1024 / 1024)
                .threadCount(threads.getThreadCount())
                .virtualThreads(false)
                .gcPauseMaxMs(gcPauseMax)
                .gcPauseAvgMs(gcPauseAvg)
                .gcCollectionCount(gcCount)
                .gcType(gcName)
                .cpuPercent(Math.max(0, Math.min(100, cpu)))
                .javaVersion("21 (GraalVM)")
                .compiler("AOT (native-image)")
                .threadModel("Platform threads")
                .nativeImage(isNativeImage)
                .build();
    }
}
