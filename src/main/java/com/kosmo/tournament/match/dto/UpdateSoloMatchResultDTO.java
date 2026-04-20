package com.kosmo.tournament.match.dto;

public class UpdateSoloMatchResultDTO {

    private Long winnerUserId;
    private String status;

    public UpdateSoloMatchResultDTO() {
    }

    public Long getWinnerUserId() { return winnerUserId; }
    public String getStatus() { return status; }

    public void setWinnerUserId(Long winnerUserId) { this.winnerUserId = winnerUserId; }
    public void setStatus(String status) { this.status = status; }
}