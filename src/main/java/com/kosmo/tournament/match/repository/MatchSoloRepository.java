package com.kosmo.tournament.match.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.kosmo.tournament.match.entity.MatchSolo;

public interface MatchSoloRepository extends JpaRepository<MatchSolo, Long> {
    List<MatchSolo> findByTournamentId(Long tournamentId);
    List<MatchSolo> findByTournamentIdOrderByRoundNumberAscIdAsc(Long tournamentId);
    List<MatchSolo> findByTournamentIdAndRoundNumber(Long tournamentId, Integer roundNumber);
    List<MatchSolo> findByStatus(String status);
    List<MatchSolo> findByPlayer1IdOrPlayer2Id(Long player1Id, Long player2Id);
}
