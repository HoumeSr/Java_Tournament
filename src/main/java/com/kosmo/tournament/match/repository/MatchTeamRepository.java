package com.kosmo.tournament.match.repository;

import com.kosmo.tournament.match.entity.MatchTeam;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MatchTeamRepository extends JpaRepository<MatchTeam, Long> {
    List<MatchTeam> findByTournamentId(Long tournamentId);
    List<MatchTeam> findByTournamentIdAndRoundNumber(Long tournamentId, Integer roundNumber);
    List<MatchTeam> findByStatus(String status);
}