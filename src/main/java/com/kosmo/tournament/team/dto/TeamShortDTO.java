package com.kosmo.tournament.team.dto;

public class TeamShortDTO {

    private Long id;
    private String name;
    private String captainUsername;
    private String imageUrl;

    public TeamShortDTO() {
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