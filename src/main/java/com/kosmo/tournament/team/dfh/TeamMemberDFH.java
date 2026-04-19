package com.kosmo.tournament.team.dfh;

import java.time.LocalDateTime;

public class TeamMemberDFH {

    private Long userId;
    private String username;
    private String role;
    private String country;
    private String imageUrl;
    private LocalDateTime joinedAt;

    public TeamMemberDFH() {
    }

    public Long getUserId() { return userId; }
    public String getUsername() { return username; }
    public String getRole() { return role; }
    public String getCountry() { return country; }
    public String getImageUrl() { return imageUrl; }
    public LocalDateTime getJoinedAt() { return joinedAt; }

    public void setUserId(Long userId) { this.userId = userId; }
    public void setUsername(String username) { this.username = username; }
    public void setRole(String role) { this.role = role; }
    public void setCountry(String country) { this.country = country; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public void setJoinedAt(LocalDateTime joinedAt) { this.joinedAt = joinedAt; }
}