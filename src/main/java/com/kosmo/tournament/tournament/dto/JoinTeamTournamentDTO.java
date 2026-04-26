package com.kosmo.tournament.tournament.dto;

public class JoinTeamTournamentDTO {

    private Long tournamentId;
    private Long teamId;

    public JoinTeamTournamentDTO() {
    }

    public Long getTournamentId() {
        return tournamentId;
    }

    public void setTournamentId(Long tournamentId) {
        this.tournamentId = tournamentId;
    }

    public Long getTeamId() {
        return teamId;
    }

    public void setTeamId(Long teamId) {
        this.teamId = teamId;
    }
}