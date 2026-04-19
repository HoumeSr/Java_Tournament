package com.kosmo.tournament.tournament.dfh;

import java.time.LocalDateTime;

public class CreateTournamentDFH {

    private String title;
    private String description;
    private String participantType;
    private String access;
    private Long gameTypeId;
    private String status;
    private LocalDateTime startDate;
    private LocalDateTime registrationDeadline;
    private Integer maxParticipants;
    private String imageUrl;

    public CreateTournamentDFH() {
    }

    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getParticipantType() { return participantType; }
    public String getAccess() { return access; }
    public Long getGameTypeId() { return gameTypeId; }
    public String getStatus() { return status; }
    public LocalDateTime getStartDate() { return startDate; }
    public LocalDateTime getRegistrationDeadline() { return registrationDeadline; }
    public Integer getMaxParticipants() { return maxParticipants; }
    public String getImageUrl() { return imageUrl; }

    public void setTitle(String title) { this.title = title; }
    public void setDescription(String description) { this.description = description; }
    public void setParticipantType(String participantType) { this.participantType = participantType; }
    public void setAccess(String access) { this.access = access; }
    public void setGameTypeId(Long gameTypeId) { this.gameTypeId = gameTypeId; }
    public void setStatus(String status) { this.status = status; }
    public void setStartDate(LocalDateTime startDate) { this.startDate = startDate; }
    public void setRegistrationDeadline(LocalDateTime registrationDeadline) { this.registrationDeadline = registrationDeadline; }
    public void setMaxParticipants(Integer maxParticipants) { this.maxParticipants = maxParticipants; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
}