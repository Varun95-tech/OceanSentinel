package com.oceansentinel.api.incident;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "incidents")
public class Incident {
    @Id
    private String id;
    private String location;
    private String area;
    private int confidence;
    private String severity;
    private String time;
    private String status;
    private int x;
    private int y;

    protected Incident() {
    }

    public Incident(String id, String location, String area, int confidence, String severity, String time, String status, int x, int y) {
        this.id = id;
        this.location = location;
        this.area = area;
        this.confidence = confidence;
        this.severity = severity;
        this.time = time;
        this.status = status;
        this.x = x;
        this.y = y;
    }

    public String getId() { return id; }
    public String getLocation() { return location; }
    public String getArea() { return area; }
    public int getConfidence() { return confidence; }
    public String getSeverity() { return severity; }
    public String getTime() { return time; }
    public String getStatus() { return status; }
    public int getX() { return x; }
    public int getY() { return y; }

    public void setLocation(String location) { this.location = location; }
    public void setArea(String area) { this.area = area; }
    public void setConfidence(int confidence) { this.confidence = confidence; }
    public void setSeverity(String severity) { this.severity = severity; }
    public void setTime(String time) { this.time = time; }
    public void setStatus(String status) { this.status = status; }
    public void setX(int x) { this.x = x; }
    public void setY(int y) { this.y = y; }
}
