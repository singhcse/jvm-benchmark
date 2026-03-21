package com.benchmark.app2;

import com.benchmark.app2.config.StartupTracker;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class App2Application {

    public static void main(String[] args) {
        StartupTracker.markJvmStart();
        SpringApplication.run(App2Application.class, args);
        System.out.println("[App2] Startup complete in " + StartupTracker.getStartupMs() + "ms");
        System.out.println("[App2] Stack: Java 21 + ZGC (Generational) + Virtual Threads (Loom) + JIT");

        Thread vt = Thread.ofVirtual().start(() ->
            System.out.println("[App2] Virtual thread confirmed: " + Thread.currentThread().isVirtual())
        );
        try { vt.join(); } catch (InterruptedException ignored) {}
    }
}
