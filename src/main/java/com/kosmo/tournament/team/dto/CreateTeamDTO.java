package com.kosmo.tournament.team.dto;

public class CreateTeamDTO {

    private String name;
    private String imageUrl;

    public CreateTeamDTO() {
    }

    public String getName() { return name; }
    public String getImageUrl() { return imageUrl; }

    public void setName(String name) { this.name = name; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
}