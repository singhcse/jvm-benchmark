package com.benchmark.app1.model;

public class BenchmarkResult {

    private String app;
    private String endpoint;
    private String result;
    private long durationMs;
    private String threadName;
    private String threadType;

    public BenchmarkResult() {}

    private BenchmarkResult(Builder builder) {
        this.app = builder.app;
        this.endpoint = builder.endpoint;
        this.result = builder.result;
        this.durationMs = builder.durationMs;
        this.threadName = builder.threadName;
        this.threadType = builder.threadType;
    }

    public static Builder builder() { return new Builder(); }

    public String getApp() { return app; }
    public String getEndpoint() { return endpoint; }
    public String getResult() { return result; }
    public long getDurationMs() { return durationMs; }
    public String getThreadName() { return threadName; }
    public String getThreadType() { return threadType; }

    public static class Builder {
        private String app;
        private String endpoint;
        private String result;
        private long durationMs;
        private String threadName;
        private String threadType;

        public Builder app(String app) { this.app = app; return this; }
        public Builder endpoint(String endpoint) { this.endpoint = endpoint; return this; }
        public Builder result(String result) { this.result = result; return this; }
        public Builder durationMs(long durationMs) { this.durationMs = durationMs; return this; }
        public Builder threadName(String threadName) { this.threadName = threadName; return this; }
        public Builder threadType(String threadType) { this.threadType = threadType; return this; }
        public BenchmarkResult build() { return new BenchmarkResult(this); }
    }
}
