package com.kosmo.tournament.rating.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kosmo.tournament.rating.dto.RatingDTO;
import com.kosmo.tournament.rating.entity.RatingStats;
import com.kosmo.tournament.rating.repository.RatingStatsRepository;
import com.kosmo.tournament.user.entity.User;
import com.kosmo.tournament.user.repository.UserRepository;

@Service
public class RatingService {

    private final RatingStatsRepository ratingStatsRepository;
    private final UserRepository userRepository;

    public RatingService(RatingStatsRepository ratingStatsRepository,
                         UserRepository userRepository) {
        this.ratingStatsRepository = ratingStatsRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void ensureUserStatsExists(Long userId, Long gameTypeId, String gameTypeName) {
        if (ratingStatsRepository.findByUserIdAndGameTypeId(userId, gameTypeId).isEmpty()) {
            RatingStats stats = new RatingStats(userId, gameTypeId, gameTypeName);
            ratingStatsRepository.save(stats);
        }
    }

    @Transactional
    public void incrementMatches(Long userId, Long gameTypeId) {
        ratingStatsRepository.incrementMatches(userId, gameTypeId);
        ratingStatsRepository.recalculateWinRate(userId, gameTypeId);
    }

    @Transactional
    public void incrementWins(Long userId, Long gameTypeId) {
        ratingStatsRepository.incrementWins(userId, gameTypeId);
        ratingStatsRepository.recalculateWinRate(userId, gameTypeId);
    }

    public List<RatingDTO> getGlobalRating(Long gameTypeId, int limit) {
        List<RatingStats> statsList;

        if (gameTypeId == null) {
            statsList = ratingStatsRepository.findAll();
        } else {
            statsList = ratingStatsRepository.getTopPlayersByGameType(gameTypeId, limit);
        }

        List<RatingDTO> result = new ArrayList<>();
        int rank = 1;

        for (RatingStats stats : statsList) {
            User user = userRepository.findById(stats.getUserId()).orElse(null);
            if (user == null) continue;

            RatingDTO dto = new RatingDTO();
            dto.setUserId(stats.getUserId());
            dto.setUsername(user.getUsername());
            dto.setCountry(user.getCountry());
            dto.setImageUrl(user.getImageUrl());
            dto.setGameTypeId(stats.getGameTypeId());
            dto.setGameTypeName(stats.getGameTypeName());
            dto.setTotalMatches(stats.getTotalMatches());
            dto.setTotalWins(stats.getTotalWins());
            dto.setWinRate(stats.getWinRate());
            dto.setRank(rank++);

            result.add(dto);
        }

        return result;
    }

    public List<RatingDTO> getRatingByGameType(Long gameTypeId) {
        List<RatingStats> statsList = ratingStatsRepository.findByGameTypeIdOrderByWinRateDesc(gameTypeId);
        List<RatingDTO> result = new ArrayList<>();
        int rank = 1;

        for (RatingStats stats : statsList) {
            User user = userRepository.findById(stats.getUserId()).orElse(null);
            if (user == null) continue;

            RatingDTO dto = new RatingDTO();
            dto.setUserId(stats.getUserId());
            dto.setUsername(user.getUsername());
            dto.setCountry(user.getCountry());
            dto.setImageUrl(user.getImageUrl());
            dto.setGameTypeId(stats.getGameTypeId());
            dto.setGameTypeName(stats.getGameTypeName());
            dto.setTotalMatches(stats.getTotalMatches());
            dto.setTotalWins(stats.getTotalWins());
            dto.setWinRate(stats.getWinRate());
            dto.setRank(rank++);

            result.add(dto);
        }

        return result;
    }

    public List<RatingDTO> getUserRating(Long userId) {
        List<RatingStats> statsList = ratingStatsRepository.findByUserIdOrderByWinRateDesc(userId);
        List<RatingDTO> result = new ArrayList<>();

        User user = userRepository.findById(userId).orElse(null);

        for (RatingStats stats : statsList) {
            RatingDTO dto = new RatingDTO();
            dto.setUserId(stats.getUserId());
            dto.setUsername(user != null ? user.getUsername() : null);
            dto.setCountry(user != null ? user.getCountry() : null);
            dto.setImageUrl(user != null ? user.getImageUrl() : null);
            dto.setGameTypeId(stats.getGameTypeId());
            dto.setGameTypeName(stats.getGameTypeName());
            dto.setTotalMatches(stats.getTotalMatches());
            dto.setTotalWins(stats.getTotalWins());
            dto.setWinRate(stats.getWinRate());

            result.add(dto);
        }

        return result;
    }
}