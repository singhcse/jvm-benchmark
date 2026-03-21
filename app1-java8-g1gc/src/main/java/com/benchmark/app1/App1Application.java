package com.benchmark.app1;

import com.benchmark.app1.config.StartupTracker;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class App1Application {

    public static void main(String[] args) {
        // Mark JVM start FIRST — before anything else including Spring
        StartupTracker.markJvmStart();

        SpringApplication.run(App1Application.class, args);

        System.out.println("[App1] Startup complete in " + StartupTracker.getStartupMs() + "ms");
        System.out.println("[App1] Stack: Java 8 + HotSpot JIT + G1GC + Platform Threads");
    }
}
