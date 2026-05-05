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
    private String imageUrl;
    private LocalDateTime createdAt;
    private boolean owner;
    private boolean member;
    private Integer currentMembersCount;
    private Integer maxMembersCount;
    private List<TeamMemberDTO> members;

    
    private boolean rosterLocked;
    private String rosterLockReason;
    private boolean canLeaveTeam;
    private boolean canKickMembers;
    private boolean canInviteMembers;
    private boolean canAddMembers;

    public TeamFullDTO() {
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getCaptainUsername() { return captainUsername; }
    public Long getCaptainId() { return captainId; }
    public Long getGameTypeId() { return gameTypeId; }
    public String getGameTypeName() { return gameTypeName; }
    public String getImageUrl() { return imageUrl; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public boolean isOwner() { return owner; }
    public boolean isMember() { return member; }
    public Integer getCurrentMembersCount() { return currentMembersCount; }
    public Integer getMaxMembersCount() { return maxMembersCount; }
    public List<TeamMemberDTO> getMembers() { return members; }

    public boolean isRosterLocked() { return rosterLocked; }
    public String getRosterLockReason() { return rosterLockReason; }
    public boolean isCanLeaveTeam() { return canLeaveTeam; }
    public boolean isCanKickMembers() { return canKickMembers; }
    public boolean isCanInviteMembers() { return canInviteMembers; }
    public boolean isCanAddMembers() { return canAddMembers; }

    public void setId(Long id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setCaptainUsername(String captainUsername) { this.captainUsername = captainUsername; }
    public void setCaptainId(Long captainId) { this.captainId = captainId; }
    public void setGameTypeId(Long gameTypeId) { this.gameTypeId = gameTypeId; }
    public void setGameTypeName(String gameTypeName) { this.gameTypeName = gameTypeName; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setOwner(boolean owner) { this.owner = owner; }
    public void setMember(boolean member) { this.member = member; }
    public void setCurrentMembersCount(Integer currentMembersCount) { this.currentMembersCount = currentMembersCount; }
    public void setMaxMembersCount(Integer maxMembersCount) { this.maxMembersCount = maxMembersCount; }
    public void setMembers(List<TeamMemberDTO> members) { this.members = members; }

    public void setRosterLocked(boolean rosterLocked) { this.rosterLocked = rosterLocked; }
    public void setRosterLockReason(String rosterLockReason) { this.rosterLockReason = rosterLockReason; }
    public void setCanLeaveTeam(boolean canLeaveTeam) { this.canLeaveTeam = canLeaveTeam; }
    public void setCanKickMembers(boolean canKickMembers) { this.canKickMembers = canKickMembers; }
    public void setCanInviteMembers(boolean canInviteMembers) { this.canInviteMembers = canInviteMembers; }
    public void setCanAddMembers(boolean canAddMembers) { this.canAddMembers = canAddMembers; }
}