package com.kosmo.tournament.team.repository;

import com.kosmo.tournament.team.entity.TeamMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TeamMemberRepository extends JpaRepository<TeamMember, Long> {
    List<TeamMember> findByTeamId(Long teamId);
    List<TeamMember> findByPlayerId(Long playerId);
    Optional<TeamMember> findByTeamIdAndPlayerId(Long teamId, Long playerId);

    boolean existsByTeamIdAndPlayerId(Long teamId, Long playerId);
}