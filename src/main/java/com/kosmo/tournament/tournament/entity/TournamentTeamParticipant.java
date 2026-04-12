package com.kosmo.tournament.tournament.entity;

import com.kosmo.tournament.team.entity.Team;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(
        name = "TournamentTeamParticipant",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"tournamentId", "teamId"})
        }
)
public class TournamentTeamParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "tournamentId", nullable = false)
    private Tournament tournament;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "teamId", nullable = false)
    private Team team;

    @Column(nullable = false)
    private String status;

    @Column(nullable = false)
    private Integer seed;

    @Column(nullable = false)
    private LocalDateTime joinedAt;

    private Integer finalPlace;

    public TournamentTeamParticipant() {
    }

    @PrePersist
    public void prePersist() {
        if (joinedAt == null) joinedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Tournament getTournament() { return tournament; }
    public Team getTeam() { return team; }
    public String getStatus() { return status; }
    public Integer getSeed() { return seed; }
    public LocalDateTime getJoinedAt() { return joinedAt; }
    public Integer getFinalPlace() { return finalPlace; }

    public void setId(Long id) { this.id = id; }
    public void setTournament(Tournament tournament) { this.tournament = tournament; }
    public void setTeam(Team team) { this.team = team; }
    public void setStatus(String status) { this.status = status; }
    public void setSeed(Integer seed) { this.seed = seed; }
    public void setJoinedAt(LocalDateTime joinedAt) { this.joinedAt = joinedAt; }
    public void setFinalPlace(Integer finalPlace) { this.finalPlace = finalPlace; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof TournamentTeamParticipant that)) return false;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}