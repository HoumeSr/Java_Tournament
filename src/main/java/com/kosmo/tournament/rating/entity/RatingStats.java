package com.kosmo.tournament.rating.entity;

import java.time.LocalDateTime;
import java.util.Objects;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "\"RatingStats\"",
        uniqueConstraints = {
                @UniqueConstraint(name = "\"unique_user_game_rating\"",
                                  columnNames = {"userId", "gameTypeId"})
        },
        indexes = {
                @Index(name = "idx_rating_winrate", columnList = "\"gameTypeId\", \"winRate\" DESC"),
                @Index(name = "idx_rating_matches", columnList = "\"gameTypeId\", \"totalMatches\" DESC"),
                @Index(name = "idx_rating_user", columnList = "\"userId\"")
        }
)
public class RatingStats {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "\"userId\"", nullable = false)
    private Long userId;

    @Column(name = "\"gameTypeId\"", nullable = false)
    private Long gameTypeId;

    @Column(name = "\"gameTypeName\"")
    private String gameTypeName;

    @Column(name = "\"totalMatches\"", nullable = false)
    private Integer totalMatches = 0;

    @Column(name = "\"totalWins\"", nullable = false)
    private Integer totalWins = 0;

    @Column(name = "\"winRate\"", nullable = false)
    private Integer winRate = 0;

    @Column(name = "\"lastUpdatedAt\"", nullable = false)
    private LocalDateTime lastUpdatedAt;

    public RatingStats() {
    }

    public RatingStats(Long userId, Long gameTypeId, String gameTypeName) {
        this.userId = userId;
        this.gameTypeId = gameTypeId;
        this.gameTypeName = gameTypeName;
        this.totalMatches = 0;
        this.totalWins = 0;
        this.winRate = 0;
    }

    @PrePersist
    public void prePersist() {
        if (lastUpdatedAt == null) lastUpdatedAt = LocalDateTime.now();
        if (totalMatches == null) totalMatches = 0;
        if (totalWins == null) totalWins = 0;
        if (winRate == null) winRate = 0;
    }

    public void recalculateWinRate() {
        if (totalMatches == null || totalMatches == 0) {
            winRate = 0;
        } else {
            winRate = (int) Math.round((totalWins * 100.0) / totalMatches);
        }
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public Long getGameTypeId() { return gameTypeId; }
    public String getGameTypeName() { return gameTypeName; }
    public Integer getTotalMatches() { return totalMatches; }
    public Integer getTotalWins() { return totalWins; }
    public Integer getWinRate() { return winRate; }
    public LocalDateTime getLastUpdatedAt() { return lastUpdatedAt; }

    public void setId(Long id) { this.id = id; }
    public void setUserId(Long userId) { this.userId = userId; }
    public void setGameTypeId(Long gameTypeId) { this.gameTypeId = gameTypeId; }
    public void setGameTypeName(String gameTypeName) { this.gameTypeName = gameTypeName; }
    public void setTotalMatches(Integer totalMatches) { this.totalMatches = totalMatches; }
    public void setTotalWins(Integer totalWins) { this.totalWins = totalWins; }
    public void setWinRate(Integer winRate) { this.winRate = winRate; }
    public void setLastUpdatedAt(LocalDateTime lastUpdatedAt) { this.lastUpdatedAt = lastUpdatedAt; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof RatingStats that)) return false;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}