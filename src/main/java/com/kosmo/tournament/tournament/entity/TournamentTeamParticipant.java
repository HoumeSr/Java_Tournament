package com.kosmo.tournament.tournament.entity;

import java.time.LocalDateTime;
import java.util.Objects;

import com.kosmo.tournament.team.entity.Team;

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
@Table(name = "\"TournamentTeamParticipant\"")
public class TournamentTeamParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "\"tournamentId\"", nullable = false)
    private Tournament tournament;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "\"teamId\"", nullable = false)
    private Team team;

    @Column(name = "\"status\"", nullable = false)
    private String status;

    @Column(name = "\"seed\"", nullable = false)
    private Integer seed;

    @Column(name = "\"parallel\"", nullable = false)
    private Integer parallel;

    @Column(name = "\"joinedAt\"", nullable = false)
    private LocalDateTime joinedAt;

    @Column(name = "\"finalPlace\"")
    private Integer finalPlace;

    public TournamentTeamParticipant() {
    }

    @PrePersist
    public void prePersist() {
        if (joinedAt == null) joinedAt = LocalDateTime.now();
        if (parallel == null) parallel = 0;
    }

    public Long getId() { return id; }
    public Tournament getTournament() { return tournament; }
    public Team getTeam() { return team; }
    public String getStatus() { return status; }
    public Integer getSeed() { return seed; }
    public Integer getParallel() { return parallel; }
    public LocalDateTime getJoinedAt() { return joinedAt; }
    public Integer getFinalPlace() { return finalPlace; }

    public void setId(Long id) { this.id = id; }
    public void setTournament(Tournament tournament) { this.tournament = tournament; }
    public void setTeam(Team team) { this.team = team; }
    public void setStatus(String status) { this.status = status; }
    public void setSeed(Integer seed) { this.seed = seed; }
    public void setParallel(Integer parallel) { this.parallel = parallel; }
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
