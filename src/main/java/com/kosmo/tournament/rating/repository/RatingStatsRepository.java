package com.kosmo.tournament.rating.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.kosmo.tournament.rating.entity.RatingStats;

public interface RatingStatsRepository extends JpaRepository<RatingStats, Long> {

    Optional<RatingStats> findByUserIdAndGameTypeId(Long userId, Long gameTypeId);

    List<RatingStats> findByUserIdOrderByWinRateDesc(Long userId);

    List<RatingStats> findByGameTypeIdOrderByWinRateDesc(Long gameTypeId);

    List<RatingStats> findByGameTypeIdOrderByTotalMatchesDesc(Long gameTypeId);

    List<RatingStats> findByGameTypeIdOrderByTotalWinsDesc(Long gameTypeId);

    @Modifying
    @Query("UPDATE RatingStats rs SET rs.totalMatches = rs.totalMatches + 1, rs.lastUpdatedAt = CURRENT_TIMESTAMP WHERE rs.userId = :userId AND rs.gameTypeId = :gameTypeId")
    void incrementMatches(@Param("userId") Long userId, @Param("gameTypeId") Long gameTypeId);

    @Modifying
    @Query("UPDATE RatingStats rs SET rs.totalWins = rs.totalWins + 1, rs.lastUpdatedAt = CURRENT_TIMESTAMP WHERE rs.userId = :userId AND rs.gameTypeId = :gameTypeId")
    void incrementWins(@Param("userId") Long userId, @Param("gameTypeId") Long gameTypeId);

    @Modifying
    @Query("UPDATE RatingStats rs SET rs.winRate = (rs.totalWins * 100) / NULLIF(rs.totalMatches, 0) WHERE rs.userId = :userId AND rs.gameTypeId = :gameTypeId")
    void recalculateWinRate(@Param("userId") Long userId, @Param("gameTypeId") Long gameTypeId);

    @Query(value = """
        SELECT rs.* FROM "RatingStats" rs 
        WHERE rs."gameTypeId" = :gameTypeId 
        ORDER BY rs."winRate" DESC, rs."totalMatches" DESC 
        LIMIT :limit
        """, nativeQuery = true)
    List<RatingStats> getTopPlayersByGameType(@Param("gameTypeId") Long gameTypeId, @Param("limit") int limit);
}