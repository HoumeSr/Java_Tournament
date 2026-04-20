package com.kosmo.tournament.user.dto;

public class UserGameStatsDTO {

    private String gameName;
    private Integer matchCount;
    private Integer winPercent;

    public UserGameStatsDTO() {
    }

    public UserGameStatsDTO(String gameName, Integer matchCount, Integer winPercent) {
        this.gameName = gameName;
        this.matchCount = matchCount;
        this.winPercent = winPercent;
    }

    public String getGameName() { return gameName; }
    public Integer getMatchCount() { return matchCount; }
    public Integer getWinPercent() { return winPercent; }

    public void setGameName(String gameName) { this.gameName = gameName; }
    public void setMatchCount(Integer matchCount) { this.matchCount = matchCount; }
    public void setWinPercent(Integer winPercent) { this.winPercent = winPercent; }
}