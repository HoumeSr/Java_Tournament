package com.kosmo.tournament.match.entity;

import com.kosmo.tournament.team.entity.Team;
import com.kosmo.tournament.tournament.entity.Tournament;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "MatchTeam")
public class MatchTeam {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "tournamentId", nullable = false)
    private Tournament tournament;

    private Integer roundNumber;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "team1Id", nullable = false)
    private Team team1;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "team2Id", nullable = false)
    private Team team2;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "winnerTeamId")
    private Team winnerTeam;

    @Column(nullable = false)
    private String status;

    private LocalDateTime scheduledAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "nextMatchId")
    private MatchTeam nextMatch;

    public MatchTeam() {
    }

    public Long getId() { return id; }
    public Tournament getTournament() { return tournament; }
    public Integer getRoundNumber() { return roundNumber; }
    public Team getTeam1() { return team1; }
    public Team getTeam2() { return team2; }
    public Team getWinnerTeam() { return winnerTeam; }
    public String getStatus() { return status; }
    public LocalDateTime getScheduledAt() { return scheduledAt; }
    public MatchTeam getNextMatch() { return nextMatch; }

    public void setId(Long id) { this.id = id; }
    public void setTournament(Tournament tournament) { this.tournament = tournament; }
    public void setRoundNumber(Integer roundNumber) { this.roundNumber = roundNumber; }
    public void setTeam1(Team team1) { this.team1 = team1; }
    public void setTeam2(Team team2) { this.team2 = team2; }
    public void setWinnerTeam(Team winnerTeam) { this.winnerTeam = winnerTeam; }
    public void setStatus(String status) { this.status = status; }
    public void setScheduledAt(LocalDateTime scheduledAt) { this.scheduledAt = scheduledAt; }
    public void setNextMatch(MatchTeam nextMatch) { this.nextMatch = nextMatch; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof MatchTeam matchTeam)) return false;
        return Objects.equals(id, matchTeam.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}