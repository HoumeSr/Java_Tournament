package com.kosmo.tournament.gametype.repository;

import com.kosmo.tournament.gametype.entity.GameType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GameTypeRepository extends JpaRepository<GameType, Long> {
    Optional<GameType> findByCode(String code);
    List<GameType> findByIsActiveTrue();
    boolean existsByCode(String code);
}