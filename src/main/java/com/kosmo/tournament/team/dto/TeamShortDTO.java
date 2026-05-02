package com.kosmo.tournament.team.dto;

public class TeamShortDTO {

    private Long id;
    private String name;
    private String captainUsername;
    private String gameTypeName;
    private String imageUrl;
    private Integer currentMembersCount;
    private Integer maxMembersCount;
    private String listType;

    public TeamShortDTO() {
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getCaptainUsername() { return captainUsername; }
    public String getGameTypeName() { return gameTypeName; }
    public String getImageUrl() { return imageUrl; }
    public Integer getCurrentMembersCount() { return currentMembersCount; }
    public Integer getMaxMembersCount() { return maxMembersCount; }
    public String getListType() { return listType; }

    public void setId(Long id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setCaptainUsername(String captainUsername) { this.captainUsername = captainUsername; }
    public void setGameTypeName(String gameTypeName) { this.gameTypeName = gameTypeName; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public void setCurrentMembersCount(Integer currentMembersCount) { this.currentMembersCount = currentMembersCount; }
    public void setMaxMembersCount(Integer maxMembersCount) { this.maxMembersCount = maxMembersCount; }
    public void setListType(String listType) { this.listType = listType; }
}