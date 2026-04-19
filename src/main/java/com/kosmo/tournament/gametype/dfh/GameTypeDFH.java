package com.kosmo.tournament.gametype.dfh;

public class GameTypeDFH {

    private Long id;
    private String name;
    private String code;
    private String description;
    private Boolean isActive;
    private String imageUrl;
    private Integer maxPlayers;

    public GameTypeDFH() {
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getCode() { return code; }
    public String getDescription() { return description; }
    public Boolean getIsActive() { return isActive; }
    public String getImageUrl() { return imageUrl; }
    public Integer getMaxPlayers() { return maxPlayers; }

    public void setId(Long id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setCode(String code) { this.code = code; }
    public void setDescription(String description) { this.description = description; }
    public void setIsActive(Boolean active) { isActive = active; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public void setMaxPlayers(Integer maxPlayers) { this.maxPlayers = maxPlayers; }
}