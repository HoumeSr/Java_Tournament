package com.kosmo.tournament.tournament.dto;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class UpdateTournamentDTO {

    private String title;
    private String description;
    private String participantType;
    private String access;
    private Long gameTypeId;
    private LocalDateTime startDate;
    private LocalDateTime registrationDeadline;
    private Integer maxParticipants;
    private Integer minParticipants;
    private String imageUrl;

    public UpdateTournamentDTO() {
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public String getParticipantType() {
        return participantType;
    }

    public String getAccess() {
        return access;
    }

    public Long getGameTypeId() {
        return gameTypeId;
    }

    public LocalDateTime getStartDate() {
        return startDate;
    }

    public LocalDateTime getRegistrationDeadline() {
        return registrationDeadline;
    }

    public Integer getMaxParticipants() {
        return maxParticipants;
    }

    public Integer getMinParticipants() {
        return minParticipants;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setParticipantType(String participantType) {
        this.participantType = participantType;
    }

    public void setAccess(String access) {
        this.access = access;
    }

    public void setGameTypeId(Long gameTypeId) {
        this.gameTypeId = gameTypeId;
    }

    public void setStartDate(LocalDateTime startDate) {
        this.startDate = startDate;
    }

    public void setRegistrationDeadline(LocalDateTime registrationDeadline) {
        this.registrationDeadline = registrationDeadline;
    }

    public void setMaxParticipants(Integer maxParticipants) {
        this.maxParticipants = maxParticipants;
    }

    public void setMinParticipants(Integer minParticipants) {
        this.minParticipants = minParticipants;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }
}