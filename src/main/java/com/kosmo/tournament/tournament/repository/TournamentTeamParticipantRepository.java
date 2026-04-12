package com.kosmo.tournament.tournament.repository;

import com.kosmo.tournament.tournament.entity.TournamentTeamParticipant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TournamentTeamParticipantRepository extends JpaRepository<TournamentTeamParticipant, Long> {
    List<TournamentTeamParticipant> findByTournamentId(Long tournamentId);
    List<TournamentTeamParticipant> findByTeamId(Long teamId);
    Optional<TournamentTeamParticipant> findByTournamentIdAndTeamId(Long tournamentId, Long teamId);

    boolean existsByTournamentIdAndTeamId(Long tournamentId, Long teamId);
}