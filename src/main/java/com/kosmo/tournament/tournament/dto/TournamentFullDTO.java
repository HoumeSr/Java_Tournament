package com.kosmo.tournament.tournament.dto;

import java.time.LocalDateTime;

public class TournamentFullDTO {

    private Long id;
    private String title;
    private String description;
    private String participantType;
    private String access;
    private String status;
    private String gameName;
    private String gameCode;
    private String organizerUsername;
    private LocalDateTime startDate;
    private LocalDateTime registrationDeadline;
    private Integer maxParticipants;
    private LocalDateTime createdAt;
    private String imageUrl;
    private boolean owner;

    public TournamentFullDTO() {
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getParticipantType() { return participantType; }
    public String getAccess() { return access; }
    public String getStatus() { return status; }
    public String getGameName() { return gameName; }
    public String getGameCode() { return gameCode; }
    public String getOrganizerUsername() { return organizerUsername; }
    public LocalDateTime getStartDate() { return startDate; }
    public LocalDateTime getRegistrationDeadline() { return registrationDeadline; }
    public Integer getMaxParticipants() { return maxParticipants; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public String getImageUrl() { return imageUrl; }
    public boolean isOwner() { return owner; }

    public void setId(Long id) { this.id = id; }
    public void setTitle(String title) { this.title = title; }
    public void setDescription(String description) { this.description = description; }
    public void setParticipantType(String participantType) { this.participantType = participantType; }
    public void setAccess(String access) { this.access = access; }
    public void setStatus(String status) { this.status = status; }
    public void setGameName(String gameName) { this.gameName = gameName; }
    public void setGameCode(String gameCode) { this.gameCode = gameCode; }
    public void setOrganizerUsername(String organizerUsername) { this.organizerUsername = organizerUsername; }
    public void setStartDate(LocalDateTime startDate) { this.startDate = startDate; }
    public void setRegistrationDeadline(LocalDateTime registrationDeadline) { this.registrationDeadline = registrationDeadline; }
    public void setMaxParticipants(Integer maxParticipants) { this.maxParticipants = maxParticipants; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public void setOwner(boolean owner) { this.owner = owner; }
}