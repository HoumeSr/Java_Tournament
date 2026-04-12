package com.kosmo.tournament.tournament.entity;

import com.kosmo.tournament.gametype.entity.GameType;
import com.kosmo.tournament.user.entity.User;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "Tournament")
public class Tournament {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String participantType;

    @Column(nullable = false)
    private String access;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "gameType", nullable = false)
    private GameType gameType;

    @Column(nullable = false)
    private String status;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "organizerId", nullable = false)
    private User organizer;

    @Column(nullable = false)
    private LocalDateTime startDate;

    private LocalDateTime registrationDeadline;

    private Integer maxParticipants;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public Tournament() {
    }

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getParticipantType() { return participantType; }
    public String getAccess() { return access; }
    public GameType getGameType() { return gameType; }
    public String getStatus() { return status; }
    public User getOrganizer() { return organizer; }
    public LocalDateTime getStartDate() { return startDate; }
    public LocalDateTime getRegistrationDeadline() { return registrationDeadline; }
    public Integer getMaxParticipants() { return maxParticipants; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public void setId(Long id) { this.id = id; }
    public void setTitle(String title) { this.title = title; }
    public void setDescription(String description) { this.description = description; }
    public void setParticipantType(String participantType) { this.participantType = participantType; }
    public void setAccess(String access) { this.access = access; }
    public void setGameType(GameType gameType) { this.gameType = gameType; }
    public void setStatus(String status) { this.status = status; }
    public void setOrganizer(User organizer) { this.organizer = organizer; }
    public void setStartDate(LocalDateTime startDate) { this.startDate = startDate; }
    public void setRegistrationDeadline(LocalDateTime registrationDeadline) { this.registrationDeadline = registrationDeadline; }
    public void setMaxParticipants(Integer maxParticipants) { this.maxParticipants = maxParticipants; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Tournament that)) return false;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}