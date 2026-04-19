package com.kosmo.tournament.gametype.dfh;

public class UpdateGameTypeDFH {

    private String name;
    private String description;
    private Boolean isActive;
    private String imageUrl;
    private Integer maxPlayers;

    public UpdateGameTypeDFH() {
    }

    public String getName() { return name; }
    public String getDescription() { return description; }
    public Boolean getIsActive() { return isActive; }
    public String getImageUrl() { return imageUrl; }
    public Integer getMaxPlayers() { return maxPlayers; }

    public void setName(String name) { this.name = name; }
    public void setDescription(String description) { this.description = description; }
    public void setIsActive(Boolean active) { isActive = active; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public void setMaxPlayers(Integer maxPlayers) { this.maxPlayers = maxPlayers; }
}