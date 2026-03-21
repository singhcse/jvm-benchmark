package com.benchmark.app1.config;

/**
 * Captures the real startup time of the application.
 *
 * HOW IT WORKS:
 *   1. App1Application.main() calls StartupTracker.markJvmStart()
 *      BEFORE SpringApplication.run() — this is the true t=0
 *
 *   2. DataInitializer calls StartupTracker.markReady()
 *      AFTER all beans are wired and DB is seeded — this is t=ready
 *
 *   3. startupMs = readyTime - jvmStartTime
 *      This captures the full startup including JVM init, class loading,
 *      Spring context build, Hibernate schema creation, and bean wiring.
 *
 * This is stored as a static so it survives across request threads
 * and is accessible from MetricsService at any time.
 */
public class StartupTracker {

    private static long jvmStartTime = 0;
    private static long readyTime    = 0;

    /** Call this as the very first line of main() */
    public static void markJvmStart() {
        jvmStartTime = System.currentTimeMillis();
    }

    /** Call this after Spring context is fully up and DB is seeded */
    public static void markReady() {
        if (readyTime == 0) {
            readyTime = System.currentTimeMillis();
        }
    }

    /** Returns full startup duration in ms. 0 if not yet ready. */
    public static long getStartupMs() {
        if (jvmStartTime == 0 || readyTime == 0) return 0;
        return readyTime - jvmStartTime;
    }

    public static long getJvmStartTime() { return jvmStartTime; }
    public static long getReadyTime()    { return readyTime;    }
    public static boolean isReady()      { return readyTime > 0; }
}
