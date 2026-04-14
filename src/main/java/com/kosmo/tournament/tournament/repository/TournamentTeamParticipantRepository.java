package com.kosmo.tournament.tournament.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.kosmo.tournament.tournament.entity.TournamentTeamParticipant;

public interface TournamentTeamParticipantRepository extends JpaRepository<TournamentTeamParticipant, Long> {
    List<TournamentTeamParticipant> findByTournamentId(Long tournamentId);
    List<TournamentTeamParticipant> findByTeamId(Long teamId);
    Optional<TournamentTeamParticipant> findByTournamentIdAndTeamId(Long tournamentId, Long teamId);
}