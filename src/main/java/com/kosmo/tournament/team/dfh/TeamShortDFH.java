package com.kosmo.tournament.team.dfh;

public class TeamShortDFH {

    private Long id;
    private String name;
    private String captainUsername;
    private String imageUrl;

    public TeamShortDFH() {
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getCaptainUsername() { return captainUsername; }
    public String getImageUrl() { return imageUrl; }

    public void setId(Long id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setCaptainUsername(String captainUsername) { this.captainUsername = captainUsername; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
}