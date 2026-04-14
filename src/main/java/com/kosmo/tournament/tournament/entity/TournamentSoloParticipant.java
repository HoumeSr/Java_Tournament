package com.kosmo.tournament.tournament.entity;

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

@Entity
@Table(name = "\"TournamentSoloParticipant\"")
public class TournamentSoloParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "\"tournamentId\"", nullable = false)
    private Tournament tournament;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"playerProfileId\"")
    private User player;

    @Column(name = "\"status\"", nullable = false)
    private String status;

    @Column(name = "\"seed\"", nullable = false)
    private Integer seed;

    @Column(name = "\"joinedAt\"", nullable = false)
    private LocalDateTime joinedAt;

    @Column(name = "\"finalPlace\"")
    private Integer finalPlace;

    public TournamentSoloParticipant() {
    }

    @PrePersist
    public void prePersist() {
        if (joinedAt == null) joinedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Tournament getTournament() { return tournament; }
    public User getPlayer() { return player; }
    public String getStatus() { return status; }
    public Integer getSeed() { return seed; }
    public LocalDateTime getJoinedAt() { return joinedAt; }
    public Integer getFinalPlace() { return finalPlace; }

    public void setId(Long id) { this.id = id; }
    public void setTournament(Tournament tournament) { this.tournament = tournament; }
    public void setPlayer(User player) { this.player = player; }
    public void setStatus(String status) { this.status = status; }
    public void setSeed(Integer seed) { this.seed = seed; }
    public void setJoinedAt(LocalDateTime joinedAt) { this.joinedAt = joinedAt; }
    public void setFinalPlace(Integer finalPlace) { this.finalPlace = finalPlace; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof TournamentSoloParticipant that)) return false;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}