package com.kosmo.tournament.tournament.entity;

import java.time.LocalDateTime;
import java.util.Objects;

import com.kosmo.tournament.gametype.entity.GameType;
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
@Table(name = "\"Tournament\"")
public class Tournament {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "\"title\"", nullable = false, unique = true)
    private String title;

    @Column(name = "\"description\"", nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "\"participantType\"", nullable = false)
    private String participantType;

    @Column(name = "\"access\"", nullable = false)
    private String access;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "\"gameType\"", nullable = false)
    private GameType gameType;

    @Column(name = "\"status\"", nullable = false)
    private String status;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "\"organizerId\"", nullable = false)
    private User organizer;

    @Column(name = "\"startDate\"", nullable = false)
    private LocalDateTime startDate;

    @Column(name = "\"registrationDeadline\"")
    private LocalDateTime registrationDeadline;

    @Column(name = "\"minParticipants\"")
    private Integer minParticipants;

    @Column(name = "\"maxParticipants\"")
    private Integer maxParticipants;

    @Column(name = "\"createdAt\"", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "\"imageUrl\"")
    private String imageUrl;

    public Tournament() {
    }

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (participantType == null) participantType = "SOLO";
        if (access == null) access = "OPEN";
        if (startDate == null) startDate = LocalDateTime.now();
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
    public String getImageUrl() { return imageUrl; }
    public Integer getMinParticipants() {return minParticipants;}

    public void setMinParticipants(Integer minParticipants) {this.minParticipants = minParticipants;}
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
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

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