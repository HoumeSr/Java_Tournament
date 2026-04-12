package com.kosmo.tournament.match.repository;

import com.kosmo.tournament.match.entity.MatchSolo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MatchSoloRepository extends JpaRepository<MatchSolo, Long> {
    List<MatchSolo> findByTournamentId(Long tournamentId);
    List<MatchSolo> findByTournamentIdAndRoundNumber(Long tournamentId, Integer roundNumber);
    List<MatchSolo> findByStatus(String status);
}