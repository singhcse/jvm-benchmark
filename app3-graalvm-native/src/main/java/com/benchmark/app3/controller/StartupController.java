package com.benchmark.app3.controller;

import com.benchmark.app3.config.StartupTracker;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class StartupController {

    @GetMapping("/startup")
    public ResponseEntity<Map<String, Object>> startup() {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("app",       "app3-graalvm-native");
        result.put("port",       8082);
        result.put("startupMs", StartupTracker.getStartupMs());
        result.put("ready",     StartupTracker.isReady());
        result.put("jvmStart",  StartupTracker.getJvmStartTime());
        result.put("readyAt",   StartupTracker.getReadyTime());
        result.put("stack",     "GraalVM · AOT · No JVM");
        return ResponseEntity.ok(result);
    }
}
