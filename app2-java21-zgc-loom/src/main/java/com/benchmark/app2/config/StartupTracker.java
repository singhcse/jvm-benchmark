package com.benchmark.app2.config;

public class StartupTracker {
    private static long jvmStartTime = 0;
    private static long readyTime    = 0;

    public static void markJvmStart() { jvmStartTime = System.currentTimeMillis(); }
    public static void markReady()    { if (readyTime == 0) readyTime = System.currentTimeMillis(); }
    public static long getStartupMs() { return (jvmStartTime == 0 || readyTime == 0) ? 0 : readyTime - jvmStartTime; }
    public static long getJvmStartTime() { return jvmStartTime; }
    public static long getReadyTime()    { return readyTime; }
    public static boolean isReady()      { return readyTime > 0; }
}