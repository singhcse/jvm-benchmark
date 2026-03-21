package com.benchmark.app3;

import com.benchmark.app3.config.StartupTracker;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class App3Application {

    public static void main(String[] args) {
        StartupTracker.markJvmStart();
        SpringApplication.run(App3Application.class, args);
        System.out.println("[App3] Startup complete in " + StartupTracker.getStartupMs() + "ms");
        System.out.println("[App3] Stack: GraalVM Native Image + AOT + No JVM runtime");
        boolean isNative = System.getProperty("org.graalvm.nativeimage.imagecode") != null;
        System.out.println("[App3] Running as native image: " + isNative);
    }
}
