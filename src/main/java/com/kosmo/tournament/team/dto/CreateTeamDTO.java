package com.kosmo.tournament.team.dto;

public class CreateTeamDTO {

    private String name;
    private Long gameTypeId;
    private String imageUrl;

    public CreateTeamDTO() {
    }

    public String getName() {
        return name;
    }

    public Long getGameTypeId() {
        return gameTypeId;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setGameTypeId(Long gameTypeId) {
        this.gameTypeId = gameTypeId;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }
}