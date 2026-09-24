package com.oceansentinel.api.incident;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:4173"})
public class IncidentController {
    private final IncidentRepository repository;

    public IncidentController(IncidentRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of("ok", true, "service", "ocean-sentinel-api", "environment", "mysql");
    }

    @GetMapping("/incidents")
    public List<Incident> getIncidents() {
        return repository.findAll();
    }

    @GetMapping("/incidents/{id}")
    public ResponseEntity<?> getIncident(@PathVariable String id) {
        Incident incident = repository.findById(id).orElse(null);
        if (incident == null) {
            return notFound();
        }
        return ResponseEntity.ok(incident);
    }

    @PatchMapping("/incidents/{id}")
    public ResponseEntity<?> updateIncident(@PathVariable String id, @RequestBody Map<String, Object> updates) {
        Incident incident = repository.findById(id).orElse(null);
        if (incident == null) {
            return notFound();
        }
        applyUpdates(incident, updates);
        return ResponseEntity.ok(repository.save(incident));
    }

    @GetMapping("/dashboard")
    public Map<String, Object> dashboard() {
        return Map.of(
                "totalIncidents", repository.count(),
                "highRiskAlerts", repository.countBySeverity("High") + repository.countBySeverity("Critical"),
                "areaObserved", 24800,
                "vesselsNearAlerts", 32,
                "incidents", repository.findAll()
        );
    }

    private void applyUpdates(Incident incident, Map<String, Object> updates) {
        if (updates.get("location") instanceof String value) incident.setLocation(value);
        if (updates.get("area") instanceof String value) incident.setArea(value);
        if (updates.get("severity") instanceof String value) incident.setSeverity(value);
        if (updates.get("time") instanceof String value) incident.setTime(value);
        if (updates.get("status") instanceof String value) incident.setStatus(value);
        if (updates.get("confidence") instanceof Number value) incident.setConfidence(value.intValue());
        if (updates.get("x") instanceof Number value) incident.setX(value.intValue());
        if (updates.get("y") instanceof Number value) incident.setY(value.intValue());
    }

    private ResponseEntity<Map<String, String>> notFound() {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("message", "Incident not found"));
    }
}
