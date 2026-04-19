package com.kosmo.tournament.match.dfh;

import java.time.LocalDateTime;

public class MatchDFH {

    private Long id;
    private String matchType; // SOLO / TEAM
    private Long tournamentId;
    private String tournamentTitle;
    private Integer roundNumber;
    private String status;
    private LocalDateTime scheduledAt;

    private Long participant1Id;
    private String participant1Name;

    private Long participant2Id;
    private String participant2Name;

    private Long winnerId;
    private String winnerName;

    private boolean owner;

    public MatchDFH() {
    }

    public Long getId() { return id; }
    public String getMatchType() { return matchType; }
    public Long getTournamentId() { return tournamentId; }
    public String getTournamentTitle() { return tournamentTitle; }
    public Integer getRoundNumber() { return roundNumber; }
    public String getStatus() { return status; }
    public LocalDateTime getScheduledAt() { return scheduledAt; }
    public Long getParticipant1Id() { return participant1Id; }
    public String getParticipant1Name() { return participant1Name; }
    public Long getParticipant2Id() { return participant2Id; }
    public String getParticipant2Name() { return participant2Name; }
    public Long getWinnerId() { return winnerId; }
    public String getWinnerName() { return winnerName; }
    public boolean isOwner() { return owner; }

    public void setId(Long id) { this.id = id; }
    public void setMatchType(String matchType) { this.matchType = matchType; }
    public void setTournamentId(Long tournamentId) { this.tournamentId = tournamentId; }
    public void setTournamentTitle(String tournamentTitle) { this.tournamentTitle = tournamentTitle; }
    public void setRoundNumber(Integer roundNumber) { this.roundNumber = roundNumber; }
    public void setStatus(String status) { this.status = status; }
    public void setScheduledAt(LocalDateTime scheduledAt) { this.scheduledAt = scheduledAt; }
    public void setParticipant1Id(Long participant1Id) { this.participant1Id = participant1Id; }
    public void setParticipant1Name(String participant1Name) { this.participant1Name = participant1Name; }
    public void setParticipant2Id(Long participant2Id) { this.participant2Id = participant2Id; }
    public void setParticipant2Name(String participant2Name) { this.participant2Name = participant2Name; }
    public void setWinnerId(Long winnerId) { this.winnerId = winnerId; }
    public void setWinnerName(String winnerName) { this.winnerName = winnerName; }
    public void setOwner(boolean owner) { this.owner = owner; }
}