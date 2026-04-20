package com.kosmo.tournament.match.dto;

public class UpdateTeamMatchResultDTO {

    private Long winnerTeamId;
    private String status;

    public UpdateTeamMatchResultDTO() {
    }

    public Long getWinnerTeamId() { return winnerTeamId; }
    public String getStatus() { return status; }

    public void setWinnerTeamId(Long winnerTeamId) { this.winnerTeamId = winnerTeamId; }
    public void setStatus(String status) { this.status = status; }
}