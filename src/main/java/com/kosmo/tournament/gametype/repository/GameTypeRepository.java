package com.kosmo.tournament.gametype.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.kosmo.tournament.gametype.entity.GameType;

public interface GameTypeRepository extends JpaRepository<GameType, Long> {
    Optional<GameType> findByCode(String code);
    List<GameType> findByIsActiveTrue();
    boolean existsByCode(String code);
    boolean existsByName(String name);
}