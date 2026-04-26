package com.kosmo.tournament.team.dto;

public class RemoveTeamMemberDTO {

    private Long userId;

    public RemoveTeamMemberDTO() {
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }
}