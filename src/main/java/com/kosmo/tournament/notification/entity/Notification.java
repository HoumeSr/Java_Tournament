package com.kosmo.tournament.notification.entity;

import java.time.LocalDateTime;
import java.util.Objects;

import com.kosmo.tournament.team.entity.Team;
import com.kosmo.tournament.user.entity.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "\"Notification\"")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "\"userId\"", nullable = false)
    private User user;

    @Column(name = "\"message\"")
    private String message;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"teamId\"")
    private Team team;

    @Column(name = "\"teamName\"")
    private String teamName;

    @Column(name = "\"type\"")
    private String type;

    @Column(name = "\"createdAt\"", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "\"status\"", nullable = false)
    private String status;

    @Column(name = "\"read\"", nullable = false)
    private Boolean read;

    public Notification() {
    }

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (message == null) message = "Вы приглашены в команду";
        if (type == null) type = "TEAM_INVITE";
        if (status == null) status = "PENDING";
        if (read == null) read = false;
    }

    public Long getId() { return id; }
    public User getUser() { return user; }
    public String getMessage() { return message; }
    public Team getTeam() { return team; }
    public String getTeamName() { return teamName; }
    public String getType() { return type; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public String getStatus() { return status; }
    public Boolean getRead() { return read; }

    public void setId(Long id) { this.id = id; }
    public void setUser(User user) { this.user = user; }
    public void setMessage(String message) { this.message = message; }
    public void setTeam(Team team) { this.team = team; }
    public void setTeamName(String teamName) { this.teamName = teamName; }
    public void setType(String type) { this.type = type; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setStatus(String status) { this.status = status; }
    public void setRead(Boolean read) { this.read = read; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Notification that)) return false;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}