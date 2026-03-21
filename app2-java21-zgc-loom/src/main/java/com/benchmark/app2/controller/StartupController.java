package com.benchmark.app2.controller;

import com.benchmark.app2.config.StartupTracker;
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
        result.put("app",       "app2-java21-zgc-loom");
        result.put("port",       8081);
        result.put("startupMs", StartupTracker.getStartupMs());
        result.put("ready",     StartupTracker.isReady());
        result.put("jvmStart",  StartupTracker.getJvmStartTime());
        result.put("readyAt",   StartupTracker.getReadyTime());
        result.put("stack",     "Java 21 · ZGC · JIT · Virtual Threads");
        return ResponseEntity.ok(result);
    }
}
