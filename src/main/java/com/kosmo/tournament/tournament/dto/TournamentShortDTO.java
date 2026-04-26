package com.kosmo.tournament.tournament.dto;

public class TournamentShortDTO {

    private Long id;
    private String title;
    private String status;
    private String participantType;
    private String access;
    private Long gameTypeId;
    private String gameName;
    private String organizerUsername;
    private Integer currentParticipantsCount;
    private Integer maxParticipants;
    private String imageUrl;

    public TournamentShortDTO() {
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getStatus() {
        return status;
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

    public String getGameName() {
        return gameName;
    }

    public String getOrganizerUsername() {
        return organizerUsername;
    }

    public Integer getCurrentParticipantsCount() {
        return currentParticipantsCount;
    }

    public Integer getMaxParticipants() {
        return maxParticipants;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public void setStatus(String status) {
        this.status = status;
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

    public void setGameName(String gameName) {
        this.gameName = gameName;
    }

    public void setOrganizerUsername(String organizerUsername) {
        this.organizerUsername = organizerUsername;
    }

    public void setCurrentParticipantsCount(Integer currentParticipantsCount) {
        this.currentParticipantsCount = currentParticipantsCount;
    }

    public void setMaxParticipants(Integer maxParticipants) {
        this.maxParticipants = maxParticipants;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }
}