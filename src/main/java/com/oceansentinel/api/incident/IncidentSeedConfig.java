package com.oceansentinel.api.incident;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class IncidentSeedConfig {
    @Bean
    CommandLineRunner seedIncidents(IncidentRepository repository) {
        return args -> {
            if (repository.count() > 0) return;
            repository.save(new Incident("OS-2026-0147", "Arabian Sea", "14.6 km²", 92, "High", "18 min ago", "Under review", 34, 42));
            repository.save(new Incident("OS-2026-0148", "Gulf of Kutch", "4.2 km²", 78, "Medium", "1h 42m ago", "New alert", 16, 27));
            repository.save(new Incident("OS-2026-0149", "Bay of Bengal", "28.1 km²", 96, "Critical", "3h 08m ago", "Escalated", 76, 58));
            repository.save(new Incident("OS-2026-0146", "Mumbai offshore", "2.8 km²", 71, "Low", "Yesterday", "Resolved", 29, 66));
        };
    }
}
