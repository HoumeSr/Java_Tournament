package com.kosmo.tournament.user.dfh;

public class UserDFH {
    private Long userId;
    private String username;
    private String email;
    private String role;
    private String country;
    private Boolean enabled;
    private String imageUrl;
    private Integer countMatch;
    private boolean owner;
    private Integer percentWin;

    public UserDFH() {
    }

    public Long getUserId() { return userId; }
    public String getUsername() { return username; }
    public String getEmail() { return email; }
    public String getRole() { return role; }
    public String getCountry() { return country; }
    public Boolean getEnabled() { return enabled; }
    public String getImageUrl() { return imageUrl; }
    public Integer getCountMatch() { return countMatch; }
    public Integer getPercentWin() { return percentWin; }
    public boolean isOwner() { return owner; }

    public void setUserId(Long userId) { this.userId = userId; }
    public void setUsername(String username) { this.username = username; }
    public void setEmail(String email) { this.email = email; }
    public void setRole(String role) { this.role = role; }
    public void setCountry(String country) { this.country = country; }
    public void setEnabled(Boolean enabled) { this.enabled = enabled; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public void setCountMatch(Integer countMatch) { this.countMatch = countMatch; }
    public void setPercentWin(Integer percentWin) { this.percentWin = percentWin; }
    public void setOwner(boolean owner) { this.owner = owner; }
}