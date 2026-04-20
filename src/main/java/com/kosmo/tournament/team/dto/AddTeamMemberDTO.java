package com.kosmo.tournament.team.dto;

public class AddTeamMemberDTO {

    private Long userId;

    public AddTeamMemberDTO() {
    }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
}