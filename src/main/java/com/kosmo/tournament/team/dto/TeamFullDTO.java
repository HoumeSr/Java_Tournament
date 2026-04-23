package com.kosmo.tournament.team.dto;

import java.time.LocalDateTime;
import java.util.List;

public class TeamFullDTO {

    private Long id;
    private String name;
    private String captainUsername;
    private Long captainId;
    private Long gameTypeId;
    private String gameTypeName;
    private String accessType;
    private String imageUrl;
    private LocalDateTime createdAt;
    private boolean owner;
    private Integer currentMembersCount;
    private Integer maxMembersCount;
    private List<TeamMemberDTO> members;

    public TeamFullDTO() {
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getCaptainUsername() { return captainUsername; }
    public Long getCaptainId() { return captainId; }
    public Long getGameTypeId() { return gameTypeId; }
    public String getGameTypeName() { return gameTypeName; }
    public String getAccessType() { return accessType; }
    public String getImageUrl() { return imageUrl; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public boolean isOwner() { return owner; }
    public Integer getCurrentMembersCount() { return currentMembersCount; }
    public Integer getMaxMembersCount() { return maxMembersCount; }
    public List<TeamMemberDTO> getMembers() { return members; }

    public void setId(Long id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setCaptainUsername(String captainUsername) { this.captainUsername = captainUsername; }
    public void setCaptainId(Long captainId) { this.captainId = captainId; }
    public void setGameTypeId(Long gameTypeId) { this.gameTypeId = gameTypeId; }
    public void setGameTypeName(String gameTypeName) { this.gameTypeName = gameTypeName; }
    public void setAccessType(String accessType) { this.accessType = accessType; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setOwner(boolean owner) { this.owner = owner; }
    public void setCurrentMembersCount(Integer currentMembersCount) { this.currentMembersCount = currentMembersCount; }
    public void setMaxMembersCount(Integer maxMembersCount) { this.maxMembersCount = maxMembersCount; }
    public void setMembers(List<TeamMemberDTO> members) { this.members = members; }
}