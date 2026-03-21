package com.benchmark.app2.config;

import com.benchmark.app2.model.WorkItem;
import com.benchmark.app2.repository.WorkItemRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner seedDatabase(WorkItemRepository repo) {
        return args -> {
            if (repo.count() == 0) {
                for (int i = 1; i <= 100; i++) {
                    repo.save(new WorkItem("benchmark-payload-" + i));
                }
            }
            StartupTracker.markReady();
            System.out.println("[App2] Ready in " + StartupTracker.getStartupMs() + "ms total");
        };
    }
}
