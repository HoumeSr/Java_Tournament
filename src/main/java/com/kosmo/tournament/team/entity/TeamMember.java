package com.kosmo.tournament.team.entity;

import com.kosmo.tournament.profile.entity.PlayerProfile;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(
        name = "TeamMembers",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"teamId", "playerId"})
        }
)
public class TeamMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "playerId", nullable = false)
    private PlayerProfile player;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "teamId", nullable = false)
    private Team team;

    @Column(nullable = false)
    private String role;

    @Column(nullable = false)
    private LocalDateTime joinedAt;

    public TeamMember() {
    }

    @PrePersist
    public void prePersist() {
        if (joinedAt == null) joinedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public PlayerProfile getPlayer() { return player; }
    public Team getTeam() { return team; }
    public String getRole() { return role; }
    public LocalDateTime getJoinedAt() { return joinedAt; }

    public void setId(Long id) { this.id = id; }
    public void setPlayer(PlayerProfile player) { this.player = player; }
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