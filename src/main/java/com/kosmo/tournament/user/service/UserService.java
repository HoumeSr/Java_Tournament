package com.kosmo.tournament.user.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import com.kosmo.tournament.user.dfh.UserDFH;
import com.kosmo.tournament.user.entity.User;
import com.kosmo.tournament.user.repository.UserRepository;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final JdbcTemplate jdbcTemplate;

    public UserService(UserRepository userRepository, JdbcTemplate jdbcTemplate) {
        this.userRepository = userRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    public UserDFH getUserDFH(Long requestedUserId, String currentUsername) {
        User requestedUser = userRepository.findById(requestedUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean owner = currentUsername != null
                && currentUsername.equals(requestedUser.getUsername());

        UserDFH dfh = new UserDFH();
        dfh.setUserId(requestedUser.getId());
        dfh.setUsername(requestedUser.getUsername());
        dfh.setEmail(owner ? requestedUser.getEmail() : null);
        dfh.setRole(requestedUser.getRole());
        dfh.setCountry(requestedUser.getCountry());
        dfh.setEnabled(requestedUser.getEnabled());
        dfh.setImageUrl(requestedUser.getImageUrl());
        dfh.setMatchCount(getMatchCount(requestedUser.getId()));
        dfh.setWinPercent(getWinPercent(requestedUser.getId()));
        dfh.setOwner(owner);

        return dfh;
    }

    private Integer getMatchCount(Long userId) {
        String sql = """
            SELECT COUNT(*)
            FROM "MatchSolo"
            WHERE "player1Id" = ? OR "player2Id" = ?
        """;

        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, userId, userId);
        return count != null ? count : 0;
    }

    
    private Integer getWinPercent(Long userId) {
        String sql = """
            SELECT COALESCE(
                ROUND(
                    100.0 * SUM(CASE WHEN "winnerPlayerId" = ? THEN 1 ELSE 0 END)
                    / NULLIF(COUNT(*), 0)
                ),
                0
            )
            FROM "MatchSolo"
            WHERE "player1Id" = ? OR "player2Id" = ?
        """;

        Integer winPercent = jdbcTemplate.queryForObject(sql, Integer.class, userId, userId, userId);
        return winPercent != null ? winPercent : 0;
    }
}