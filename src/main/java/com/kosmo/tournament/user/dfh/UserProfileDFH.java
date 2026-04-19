package com.kosmo.tournament.user.dfh;

public class UserProfileDFH {
    private Long userId;
    private String username;
    private String email;
    private String role;
    private String country;
    private Boolean enabled;
    private String imageUrl;
    private Integer countMatch;
    private Integer percentWin;
    private boolean owner;

    public UserProfileDFH() {}

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
    public Boolean getEnabled() { return enabled; }
    public void setEnabled(Boolean enabled) { this.enabled = enabled; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public Integer getCountMatch() { return countMatch; }
    public void setCountMatch(Integer countMatch) { this.countMatch = countMatch; }
    public Integer getPercentWin() { return percentWin; }
    public void setPercentWin(Integer percentWin) { this.percentWin = percentWin; }
    public boolean isOwner() { return owner; }
    public void setOwner(boolean owner) { this.owner = owner; }
}