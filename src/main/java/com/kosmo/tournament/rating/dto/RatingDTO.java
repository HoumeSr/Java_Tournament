package com.kosmo.tournament.rating.dto;

public class RatingDTO {

    private Long userId;
    private String username;
    private String country;
    private String imageUrl;
    private Long gameTypeId;
    private String gameTypeName;
    private Integer totalMatches;
    private Integer totalWins;
    private Integer winRate;
    private Integer rank;

    public RatingDTO() {
    }

    public Long getUserId() { return userId; }
    public String getUsername() { return username; }
    public String getCountry() { return country; }
    public String getImageUrl() { return imageUrl; }
    public Long getGameTypeId() { return gameTypeId; }
    public String getGameTypeName() { return gameTypeName; }
    public Integer getTotalMatches() { return totalMatches; }
    public Integer getTotalWins() { return totalWins; }
    public Integer getWinRate() { return winRate; }
    public Integer getRank() { return rank; }

    public void setUserId(Long userId) { this.userId = userId; }
    public void setUsername(String username) { this.username = username; }
    public void setCountry(String country) { this.country = country; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public void setGameTypeId(Long gameTypeId) { this.gameTypeId = gameTypeId; }
    public void setGameTypeName(String gameTypeName) { this.gameTypeName = gameTypeName; }
    public void setTotalMatches(Integer totalMatches) { this.totalMatches = totalMatches; }
    public void setTotalWins(Integer totalWins) { this.totalWins = totalWins; }
    public void setWinRate(Integer winRate) { this.winRate = winRate; }
    public void setRank(Integer rank) { this.rank = rank; }
}