package com.kosmo.tournament.tournament.entity;

import com.kosmo.tournament.profile.entity.PlayerProfile;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(
        name = "TournamentSoloParticipant",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"tournamentId", "playerProfileId"})
        }
)
public class TournamentSoloParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "tournamentId", nullable = false)
    private Tournament tournament;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "playerProfileId", nullable = false)
    private PlayerProfile playerProfile;

    @Column(nullable = false)
    private String status;

    @Column(nullable = false)
    private Integer seed;

    @Column(nullable = false)
    private LocalDateTime joinedAt;

    private Integer finalPlace;

    public TournamentSoloParticipant() {
    }

    @PrePersist
    public void prePersist() {
        if (joinedAt == null) joinedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Tournament getTournament() { return tournament; }
    public PlayerProfile getPlayerProfile() { return playerProfile; }
    public String getStatus() { return status; }
    public Integer getSeed() { return seed; }
    public LocalDateTime getJoinedAt() { return joinedAt; }
    public Integer getFinalPlace() { return finalPlace; }

    public void setId(Long id) { this.id = id; }
    public void setTournament(Tournament tournament) { this.tournament = tournament; }
    public void setPlayerProfile(PlayerProfile playerProfile) { this.playerProfile = playerProfile; }
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