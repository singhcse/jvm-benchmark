package com.benchmark.app3.model;

public class MetricsSnapshot {
    private String appName, appLabel, gcType, javaVersion, compiler, threadModel;
    private int port, threadCount;
    private long startupMs, heapUsedMb, heapMaxMb, nonHeapUsedMb;
    private long gcPauseMaxMs, gcPauseAvgMs, gcCollectionCount;
    private double cpuPercent;
    private boolean virtualThreads, nativeImage;

    public MetricsSnapshot() {}

    private MetricsSnapshot(Builder b) {
        this.appName = b.appName; this.appLabel = b.appLabel;
        this.port = b.port; this.startupMs = b.startupMs;
        this.heapUsedMb = b.heapUsedMb; this.heapMaxMb = b.heapMaxMb;
        this.nonHeapUsedMb = b.nonHeapUsedMb; this.threadCount = b.threadCount;
        this.virtualThreads = b.virtualThreads; this.nativeImage = b.nativeImage;
        this.gcPauseMaxMs = b.gcPauseMaxMs; this.gcPauseAvgMs = b.gcPauseAvgMs;
        this.gcCollectionCount = b.gcCollectionCount; this.gcType = b.gcType;
        this.cpuPercent = b.cpuPercent; this.javaVersion = b.javaVersion;
        this.compiler = b.compiler; this.threadModel = b.threadModel;
    }

    public static Builder builder() { return new Builder(); }

    public String getAppName() { return appName; }
    public String getAppLabel() { return appLabel; }
    public int getPort() { return port; }
    public long getStartupMs() { return startupMs; }
    public long getHeapUsedMb() { return heapUsedMb; }
    public long getHeapMaxMb() { return heapMaxMb; }
    public long getNonHeapUsedMb() { return nonHeapUsedMb; }
    public int getThreadCount() { return threadCount; }
    public boolean isVirtualThreads() { return virtualThreads; }
    public boolean isNativeImage() { return nativeImage; }
    public long getGcPauseMaxMs() { return gcPauseMaxMs; }
    public long getGcPauseAvgMs() { return gcPauseAvgMs; }
    public long getGcCollectionCount() { return gcCollectionCount; }
    public String getGcType() { return gcType; }
    public double getCpuPercent() { return cpuPercent; }
    public String getJavaVersion() { return javaVersion; }
    public String getCompiler() { return compiler; }
    public String getThreadModel() { return threadModel; }

    public static class Builder {
        private String appName, appLabel, gcType, javaVersion, compiler, threadModel;
        private int port, threadCount;
        private long startupMs, heapUsedMb, heapMaxMb, nonHeapUsedMb;
        private long gcPauseMaxMs, gcPauseAvgMs, gcCollectionCount;
        private double cpuPercent;
        private boolean virtualThreads, nativeImage;

        public Builder appName(String v) { this.appName = v; return this; }
        public Builder appLabel(String v) { this.appLabel = v; return this; }
        public Builder port(int v) { this.port = v; return this; }
        public Builder startupMs(long v) { this.startupMs = v; return this; }
        public Builder heapUsedMb(long v) { this.heapUsedMb = v; return this; }
        public Builder heapMaxMb(long v) { this.heapMaxMb = v; return this; }
        public Builder nonHeapUsedMb(long v) { this.nonHeapUsedMb = v; return this; }
        public Builder threadCount(int v) { this.threadCount = v; return this; }
        public Builder virtualThreads(boolean v) { this.virtualThreads = v; return this; }
        public Builder nativeImage(boolean v) { this.nativeImage = v; return this; }
        public Builder gcPauseMaxMs(long v) { this.gcPauseMaxMs = v; return this; }
        public Builder gcPauseAvgMs(long v) { this.gcPauseAvgMs = v; return this; }
        public Builder gcCollectionCount(long v) { this.gcCollectionCount = v; return this; }
        public Builder gcType(String v) { this.gcType = v; return this; }
        public Builder cpuPercent(double v) { this.cpuPercent = v; return this; }
        public Builder javaVersion(String v) { this.javaVersion = v; return this; }
        public Builder compiler(String v) { this.compiler = v; return this; }
        public Builder threadModel(String v) { this.threadModel = v; return this; }
        public MetricsSnapshot build() { return new MetricsSnapshot(this); }
    }
}
