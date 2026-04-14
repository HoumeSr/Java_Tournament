package com.kosmo.tournament.team.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.kosmo.tournament.team.entity.Team;

public interface TeamRepository extends JpaRepository<Team, Long> {
    boolean existsByName(String name);
    List<Team> findByCaptainId(Long captainId);
}