package com.kosmo.tournament.team.repository;

import com.kosmo.tournament.team.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TeamRepository extends JpaRepository<Team, Long> {
    boolean existsByName(String name);
    List<Team> findByCaptainId(Long captainId);
}