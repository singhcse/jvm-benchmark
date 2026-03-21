package com.benchmark.app3.config;

import com.benchmark.app3.model.WorkItem;
import com.benchmark.app3.repository.WorkItemRepository;
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
            System.out.println("[App3] Ready in " + StartupTracker.getStartupMs() + "ms total");
        };
    }
}
