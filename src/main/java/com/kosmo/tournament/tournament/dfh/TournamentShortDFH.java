package com.kosmo.tournament.tournament.dfh;

public class TournamentShortDFH {

    private Long id;
    private String title;
    private String status;
    private String participantType;
    private String gameName;
    private String organizerUsername;
    private String imageUrl;

    public TournamentShortDFH() {
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getStatus() { return status; }
    public String getParticipantType() { return participantType; }
    public String getGameName() { return gameName; }
    public String getOrganizerUsername() { return organizerUsername; }
    public String getImageUrl() { return imageUrl; }

    public void setId(Long id) { this.id = id; }
    public void setTitle(String title) { this.title = title; }
    public void setStatus(String status) { this.status = status; }
    public void setParticipantType(String participantType) { this.participantType = participantType; }
    public void setGameName(String gameName) { this.gameName = gameName; }
    public void setOrganizerUsername(String organizerUsername) { this.organizerUsername = organizerUsername; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
}