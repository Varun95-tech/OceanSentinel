package com.oceansentinel.api.incident;

import org.springframework.data.jpa.repository.JpaRepository;

public interface IncidentRepository extends JpaRepository<Incident, String> {
	long countBySeverity(String severity);
}
