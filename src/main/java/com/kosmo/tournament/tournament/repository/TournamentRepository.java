package com.kosmo.tournament.tournament.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.kosmo.tournament.tournament.entity.Tournament;

public interface TournamentRepository extends JpaRepository<Tournament, Long> {
    boolean existsByTitle(String title);

    List<Tournament> findByStatus(String status);
    List<Tournament> findByOrganizerId(Long organizerId);
    List<Tournament> findByParticipantType(String participantType);
    List<Tournament> findByGameTypeId(Long gameTypeId);
}