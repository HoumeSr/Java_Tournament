package com.kosmo.tournament.match.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.kosmo.tournament.match.entity.MatchTeam;

public interface MatchTeamRepository extends JpaRepository<MatchTeam, Long> {
    List<MatchTeam> findByTournamentId(Long tournamentId);
    List<MatchTeam> findByTournamentIdAndRoundNumber(Long tournamentId, Integer roundNumber);
    List<MatchTeam> findByStatus(String status);
    List<MatchTeam> findByTeam1IdOrTeam2Id(Long team1Id, Long team2Id);
}