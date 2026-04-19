package com.kosmo.tournament.match.entity;

import java.time.LocalDateTime;
import java.util.Objects;

import com.kosmo.tournament.tournament.entity.Tournament;
import com.kosmo.tournament.user.entity.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "\"MatchSolo\"")
public class MatchSolo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "\"tournamentId\"", nullable = false)
    private Tournament tournament;

    @Column(name = "\"roundNumber\"")
    private Integer roundNumber;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "\"player1Id\"", nullable = false)
    private User player1;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "\"player2Id\"", nullable = false)
    private User player2;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"winnerPlayerId\"")
    private User winnerPlayer;

    @Column(name = "\"status\"", nullable = false)
    private String status;

    @Column(name = "\"scheduledAt\"")
    private LocalDateTime scheduledAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"nextMatchId\"")
    private MatchSolo nextMatch;

    public MatchSolo() {
    }

    public Long getId() { return id; }
    public Tournament getTournament() { return tournament; }
    public Integer getRoundNumber() { return roundNumber; }
    public User getPlayer1() { return player1; }
    public User getPlayer2() { return player2; }
    public User getWinnerPlayer() { return winnerPlayer; }
    public String getStatus() { return status; }
    public LocalDateTime getScheduledAt() { return scheduledAt; }
    public MatchSolo getNextMatch() { return nextMatch; }

    public void setId(Long id) { this.id = id; }
    public void setTournament(Tournament tournament) { this.tournament = tournament; }
    public void setRoundNumber(Integer roundNumber) { this.roundNumber = roundNumber; }
    public void setPlayer1(User player1) { this.player1 = player1; }
    public void setPlayer2(User player2) { this.player2 = player2; }
    public void setWinnerPlayer(User winnerPlayer) { this.winnerPlayer = winnerPlayer; }
    public void setStatus(String status) { this.status = status; }
    public void setScheduledAt(LocalDateTime scheduledAt) { this.scheduledAt = scheduledAt; }
    public void setNextMatch(MatchSolo nextMatch) { this.nextMatch = nextMatch; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof MatchSolo that)) return false;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}