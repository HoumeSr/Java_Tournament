package com.kosmo.tournament.match.dfh;

public class UpdateTeamMatchResultDFH {

    private Long winnerTeamId;
    private String status;

    public UpdateTeamMatchResultDFH() {
    }

    public Long getWinnerTeamId() { return winnerTeamId; }
    public String getStatus() { return status; }

    public void setWinnerTeamId(Long winnerTeamId) { this.winnerTeamId = winnerTeamId; }
    public void setStatus(String status) { this.status = status; }
}