package com.benchmark.app2.config;

import org.springframework.boot.web.embedded.tomcat.TomcatProtocolHandlerCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.task.AsyncTaskExecutor;
import org.springframework.core.task.support.TaskExecutorAdapter;

import java.util.concurrent.Executors;

/**
 * Configures Spring Boot's embedded Tomcat to use virtual threads
 * for every incoming HTTP request.
 *
 * Without this config, Tomcat uses its standard thread pool (platform threads).
 * With this config, each request gets its own virtual thread — enabling
 * millions of concurrent requests with no OS thread exhaustion.
 *
 * This is the core differentiator of App2 vs App1.
 */
@Configuration
public class VirtualThreadConfig {

    /**
     * Override Tomcat's protocol handler to use virtual threads.
     * This single bean switches the entire server to virtual-thread-per-request model.
     */
    @Bean
    public TomcatProtocolHandlerCustomizer<?> protocolHandlerVirtualThreadExecutorCustomizer() {
        return protocolHandler -> {
            protocolHandler.setExecutor(Executors.newVirtualThreadPerTaskExecutor());
        };
    }

    /**
     * Also configure the Spring async task executor to use virtual threads,
     * so @Async methods also benefit from Loom.
     */
    @Bean
    public AsyncTaskExecutor applicationTaskExecutor() {
        return new TaskExecutorAdapter(Executors.newVirtualThreadPerTaskExecutor());
    }
}
