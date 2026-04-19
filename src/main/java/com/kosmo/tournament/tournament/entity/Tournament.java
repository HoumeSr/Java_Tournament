package com.kosmo.tournament.tournament.entity;

import com.kosmo.tournament.gametype.entity.GameType;
import com.kosmo.tournament.user.entity.User;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "\"Tournaments\"")
public class Tournament {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "\"title\"", nullable = false)
    private String title;

    @Column(name = "\"status\"", nullable = false)
    private String status = "PENDING";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"organizerId\"")
    private User organizer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"gameTypeId\"")
    private GameType gameType;

    @Column(name = "\"maxParticipants\"")
    private Integer maxParticipants;

    @Column(name = "\"participantType\"")
    private String participantType; // SOLO или TEAM

    @Column(name = "\"startDate\"")
    private LocalDateTime startDate;

    @Column(name = "\"endDate\"")
    private LocalDateTime endDate;

    @Column(name = "\"imageUrl\"")
    private String imageUrl;

    @Column(name = "\"createdAt\"", nullable = false)
    private LocalDateTime createdAt;

    public Tournament() {}

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (status == null) status = "PENDING";
        if (imageUrl == null) imageUrl = "DEFAULT_TOURNAMENT_IMAGE.jpg";
    }

    // Getters
    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getStatus() { return status; }
    public User getOrganizer() { return organizer; }
    public GameType getGameType() { return gameType; }
    public Integer getMaxParticipants() { return maxParticipants; }
    public String getParticipantType() { return participantType; }
    public LocalDateTime getStartDate() { return startDate; }
    public LocalDateTime getEndDate() { return endDate; }
    public String getImageUrl() { return imageUrl; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setTitle(String title) { this.title = title; }
    public void setStatus(String status) { this.status = status; }
    public void setOrganizer(User organizer) { this.organizer = organizer; }
    public void setGameType(GameType gameType) { this.gameType = gameType; }
    public void setMaxParticipants(Integer maxParticipants) { this.maxParticipants = maxParticipants; }
    public void setParticipantType(String participantType) { this.participantType = participantType; }
    public void setStartDate(LocalDateTime startDate) { this.startDate = startDate; }
    public void setEndDate(LocalDateTime endDate) { this.endDate = endDate; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
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