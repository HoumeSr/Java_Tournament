package com.kosmo.tournament.tournament.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.kosmo.tournament.tournament.entity.TournamentSoloParticipant;

public interface TournamentSoloParticipantRepository extends JpaRepository<TournamentSoloParticipant, Long> {
    List<TournamentSoloParticipant> findByTournamentId(Long tournamentId);
    List<TournamentSoloParticipant> findByTournamentIdOrderBySeedAsc(Long tournamentId);
    List<TournamentSoloParticipant> findByPlayerId(Long playerId);
    Optional<TournamentSoloParticipant> findByTournamentIdAndPlayerId(Long tournamentId, Long playerId);
    boolean existsByTournamentIdAndPlayerId(Long tournamentId, Long playerId);
    long countByTournamentId(Long tournamentId);
}
