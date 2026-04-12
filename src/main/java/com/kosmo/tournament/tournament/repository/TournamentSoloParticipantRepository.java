package com.kosmo.tournament.tournament.repository;

import com.kosmo.tournament.tournament.entity.TournamentSoloParticipant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TournamentSoloParticipantRepository extends JpaRepository<TournamentSoloParticipant, Long> {
    List<TournamentSoloParticipant> findByTournamentId(Long tournamentId);
    List<TournamentSoloParticipant> findByPlayerProfileId(Long playerProfileId);
    Optional<TournamentSoloParticipant> findByTournamentIdAndPlayerProfileId(Long tournamentId, Long playerProfileId);

    boolean existsByTournamentIdAndPlayerProfileId(Long tournamentId, Long playerProfileId);
}