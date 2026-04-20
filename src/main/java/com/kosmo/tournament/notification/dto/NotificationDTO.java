package com.kosmo.tournament.notification.dto;

import java.time.LocalDateTime;

public class NotificationDTO {

    private Long id;
    private String message;
    private Long teamId;
    private String teamName;
    private String type;
    private String status;
    private LocalDateTime createdAt;

    public NotificationDTO() {
    }

    public Long getId() { return id; }
    public String getMessage() { return message; }
    public Long getTeamId() { return teamId; }
    public String getTeamName() { return teamName; }
    public String getType() { return type; }
    public String getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public void setId(Long id) { this.id = id; }
    public void setMessage(String message) { this.message = message; }
    public void setTeamId(Long teamId) { this.teamId = teamId; }
    public void setTeamName(String teamName) { this.teamName = teamName; }
    public void setType(String type) { this.type = type; }
    public void setStatus(String status) { this.status = status; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}