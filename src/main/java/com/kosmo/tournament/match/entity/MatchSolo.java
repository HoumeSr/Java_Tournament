package com.kosmo.tournament.match.entity;

import com.kosmo.tournament.profile.entity.PlayerProfile;
import com.kosmo.tournament.tournament.entity.Tournament;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "MatchSolo")
public class MatchSolo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "tournamentId", nullable = false)
    private Tournament tournament;

    private Integer roundNumber;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "player1Id", nullable = false)
    private PlayerProfile player1;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "player2Id", nullable = false)
    private PlayerProfile player2;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "winnerPlayerId")
    private PlayerProfile winnerPlayer;

    @Column(nullable = false)
    private String status;

    private LocalDateTime scheduledAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "nextMatchId")
    private MatchSolo nextMatch;

    public MatchSolo() {
    }

    public Long getId() { return id; }
    public Tournament getTournament() { return tournament; }
    public Integer getRoundNumber() { return roundNumber; }
    public PlayerProfile getPlayer1() { return player1; }
    public PlayerProfile getPlayer2() { return player2; }
    public PlayerProfile getWinnerPlayer() { return winnerPlayer; }
    public String getStatus() { return status; }
    public LocalDateTime getScheduledAt() { return scheduledAt; }
    public MatchSolo getNextMatch() { return nextMatch; }

    public void setId(Long id) { this.id = id; }
    public void setTournament(Tournament tournament) { this.tournament = tournament; }
    public void setRoundNumber(Integer roundNumber) { this.roundNumber = roundNumber; }
    public void setPlayer1(PlayerProfile player1) { this.player1 = player1; }
    public void setPlayer2(PlayerProfile player2) { this.player2 = player2; }
    public void setWinnerPlayer(PlayerProfile winnerPlayer) { this.winnerPlayer = winnerPlayer; }
    public void setStatus(String status) { this.status = status; }
    public void setScheduledAt(LocalDateTime scheduledAt) { this.scheduledAt = scheduledAt; }
    public void setNextMatch(MatchSolo nextMatch) { this.nextMatch = nextMatch; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof MatchSolo matchSolo)) return false;
        return Objects.equals(id, matchSolo.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}