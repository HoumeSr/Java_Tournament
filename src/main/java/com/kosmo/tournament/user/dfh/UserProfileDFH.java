package com.kosmo.tournament.user.dfh;

import java.util.List;

public class UserProfileDFH {
    private Long userId;
    private String username;
    private String email;
    private String role;
    private String country;
    private Boolean enabled;
    private String imageUrl;
    private boolean owner;
    private List<UserGameStatsDFH> games;

    public UserProfileDFH() {
    }

    public Long getUserId() { return userId; }
    public String getUsername() { return username; }
    public String getEmail() { return email; }
    public String getRole() { return role; }
    public String getCountry() { return country; }
    public Boolean getEnabled() { return enabled; }
    public String getImageUrl() { return imageUrl; }
    public boolean isOwner() { return owner; }
    public List<UserGameStatsDFH> getGames() { return games; }

    public void setUserId(Long userId) { this.userId = userId; }
    public void setUsername(String username) { this.username = username; }
    public void setEmail(String email) { this.email = email; }
    public void setRole(String role) { this.role = role; }
    public void setCountry(String country) { this.country = country; }
    public void setEnabled(Boolean enabled) { this.enabled = enabled; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public void setOwner(boolean owner) { this.owner = owner; }
    public void setGames(List<UserGameStatsDFH> games) { this.games = games; }
}