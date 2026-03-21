package com.benchmark.app1.controller;

import com.benchmark.app1.config.StartupTracker;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Dedicated startup info endpoint.
 * The React dashboard polls this during a cold-start race to track
 * exactly when each app becomes available and how long it took.
 */
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class StartupController {

    @GetMapping("/startup")
    public ResponseEntity<Map<String, Object>> startup() {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("app",        "app1-java8-g1gc");
        result.put("port",        8080);
        result.put("startupMs",  StartupTracker.getStartupMs());
        result.put("ready",      StartupTracker.isReady());
        result.put("jvmStart",   StartupTracker.getJvmStartTime());
        result.put("readyAt",    StartupTracker.getReadyTime());
        result.put("stack",      "Java 8 · G1GC · JIT · Platform Threads");
        return ResponseEntity.ok(result);
    }
}
