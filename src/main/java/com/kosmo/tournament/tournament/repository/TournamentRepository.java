package com.kosmo.tournament.tournament.repository;

import com.kosmo.tournament.tournament.entity.Tournament;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TournamentRepository extends JpaRepository<Tournament, Long> {
    boolean existsByTitle(String title);

    List<Tournament> findByStatus(String status);
    List<Tournament> findByOrganizerId(Long organizerId);
    List<Tournament> findByParticipantType(String participantType);
    List<Tournament> findByGameTypeId(Long gameTypeId);
}