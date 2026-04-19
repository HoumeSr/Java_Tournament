package com.kosmo.tournament.team.dfh;

import java.time.LocalDateTime;
import java.util.List;

public class TeamFullDFH {

    private Long id;
    private String name;
    private String captainUsername;
    private Long captainId;
    private String imageUrl;
    private LocalDateTime createdAt;
    private boolean owner;
    private List<TeamMemberDFH> members;

    public TeamFullDFH() {
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getCaptainUsername() { return captainUsername; }
    public Long getCaptainId() { return captainId; }
    public String getImageUrl() { return imageUrl; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public boolean isOwner() { return owner; }
    public List<TeamMemberDFH> getMembers() { return members; }

    public void setId(Long id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setCaptainUsername(String captainUsername) { this.captainUsername = captainUsername; }
    public void setCaptainId(Long captainId) { this.captainId = captainId; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setOwner(boolean owner) { this.owner = owner; }
    public void setMembers(List<TeamMemberDFH> members) { this.members = members; }
}