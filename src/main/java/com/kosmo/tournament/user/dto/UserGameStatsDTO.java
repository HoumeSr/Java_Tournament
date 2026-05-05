package com.kosmo.tournament.user.dto;

public class UserGameStatsDTO {

    private Long gameTypeId;
    private String gameName;
    private Integer totalMatches;
    private Integer totalWins;
    private Integer winRate;

    public UserGameStatsDTO() {
    }

    public UserGameStatsDTO(Long gameTypeId, String gameName, Integer totalMatches, Integer totalWins, Integer winRate) {
        this.gameTypeId = gameTypeId;
        this.gameName = gameName;
        this.totalMatches = totalMatches;
        this.totalWins = totalWins;
        this.winRate = winRate;
    }

    public Long getGameTypeId() {
        return gameTypeId;
    }

    public void setGameTypeId(Long gameTypeId) {
        this.gameTypeId = gameTypeId;
    }

    public String getGameName() {
        return gameName;
    }

    public void setGameName(String gameName) {
        this.gameName = gameName;
    }

    public Integer getTotalMatches() {
        return totalMatches;
    }

    public void setTotalMatches(Integer totalMatches) {
        this.totalMatches = totalMatches;
    }

    public Integer getTotalWins() {
        return totalWins;
    }

    public void setTotalWins(Integer totalWins) {
        this.totalWins = totalWins;
    }

    public Integer getWinRate() {
        return winRate;
    }

    public void setWinRate(Integer winRate) {
        this.winRate = winRate;
    }

    
    public Integer getMatchCount() {
        return totalMatches;
    }

    public void setMatchCount(Integer matchCount) {
        this.totalMatches = matchCount;
    }

    public Integer getWinPercent() {
        return winRate;
    }

    public void setWinPercent(Integer winPercent) {
        this.winRate = winPercent;
    }
}
