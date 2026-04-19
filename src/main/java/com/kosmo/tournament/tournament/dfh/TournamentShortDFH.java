package com.kosmo.tournament.tournament.dfh;

public class TournamentShortDFH {
    private Long tournamentId;
    private String name;
    private String status;
    private Integer currentPlayers;
    private Integer maxPlayers;
    private String startDate;
    private String imageUrl;

    public TournamentShortDFH() {
    }

    public Long getTournamentId() { return tournamentId; }
    public String getName() { return name; }
    public String getStatus() { return status; }
    public Integer getCurrentPlayers() { return currentPlayers; }
    public Integer getMaxPlayers() { return maxPlayers; }
    public String getStartDate() { return startDate; }
    public String getImageUrl() { return imageUrl; }

    public void setTournamentId(Long tournamentId) { this.tournamentId = tournamentId; }
    public void setName(String name) { this.name = name; }
    public void setStatus(String status) { this.status = status; }
    public void setCurrentPlayers(Integer currentPlayers) { this.currentPlayers = currentPlayers; }
    public void setMaxPlayers(Integer maxPlayers) { this.maxPlayers = maxPlayers; }
    public void setStartDate(String startDate) { this.startDate = startDate; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
}