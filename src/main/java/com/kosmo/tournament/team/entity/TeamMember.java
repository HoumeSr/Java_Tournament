package com.kosmo.tournament.team.entity;

import java.time.LocalDateTime;
import java.util.Objects;

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
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
        name = "\"TeamMembers\"",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"playerId", "teamId"})
        }
)
public class TeamMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "\"playerId\"", nullable = false)
    private User player;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "\"teamId\"", nullable = false)
    private Team team;

    @Column(name = "\"role\"", nullable = false)
    private String role;

    @Column(name = "\"joinedAt\"", nullable = false)
    private LocalDateTime joinedAt;

    public TeamMember() {
    }

    @PrePersist
    public void prePersist() {
        if (joinedAt == null) joinedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public User getPlayer() { return player; }
    public Team getTeam() { return team; }
    public String getRole() { return role; }
    public LocalDateTime getJoinedAt() { return joinedAt; }

    public void setId(Long id) { this.id = id; }
    public void setPlayer(User player) { this.player = player; }
    public void setTeam(Team team) { this.team = team; }
    public void setRole(String role) { this.role = role; }
    public void setJoinedAt(LocalDateTime joinedAt) { this.joinedAt = joinedAt; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof TeamMember that)) return false;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}