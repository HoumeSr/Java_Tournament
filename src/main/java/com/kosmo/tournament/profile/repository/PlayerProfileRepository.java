package com.kosmo.tournament.profile.repository;

import com.kosmo.tournament.profile.entity.PlayerProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PlayerProfileRepository extends JpaRepository<PlayerProfile, Long> {
    Optional<PlayerProfile> findByUserId(Long userId);
    List<PlayerProfile> findByGameId(Long gameId);
    Optional<PlayerProfile> findByNickname(String nickname);

    boolean existsByUserId(Long userId);
    boolean existsByNickname(String nickname);
}