package com.benchmark.app2.model;

public class BenchmarkResult {

    private String app;
    private String endpoint;
    private String result;
    private long durationMs;
    private String threadName;
    private String threadType;
    private boolean isVirtual;

    public BenchmarkResult() {}

    private BenchmarkResult(Builder b) {
        this.app = b.app;
        this.endpoint = b.endpoint;
        this.result = b.result;
        this.durationMs = b.durationMs;
        this.threadName = b.threadName;
        this.threadType = b.threadType;
        this.isVirtual = b.isVirtual;
    }

    public static Builder builder() { return new Builder(); }

    public String getApp() { return app; }
    public String getEndpoint() { return endpoint; }
    public String getResult() { return result; }
    public long getDurationMs() { return durationMs; }
    public String getThreadName() { return threadName; }
    public String getThreadType() { return threadType; }
    public boolean isVirtual() { return isVirtual; }

    public static class Builder {
        private String app, endpoint, result, threadName, threadType;
        private long durationMs;
        private boolean isVirtual;

        public Builder app(String v) { this.app = v; return this; }
        public Builder endpoint(String v) { this.endpoint = v; return this; }
        public Builder result(String v) { this.result = v; return this; }
        public Builder durationMs(long v) { this.durationMs = v; return this; }
        public Builder threadName(String v) { this.threadName = v; return this; }
        public Builder threadType(String v) { this.threadType = v; return this; }
        public Builder isVirtual(boolean v) { this.isVirtual = v; return this; }
        public BenchmarkResult build() { return new BenchmarkResult(this); }
    }
}
