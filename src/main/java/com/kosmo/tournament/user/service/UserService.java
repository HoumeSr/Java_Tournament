package com.kosmo.tournament.user.service;

import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import com.kosmo.tournament.user.dfh.UserGameStatsDFH;
import com.kosmo.tournament.user.dfh.UserProfileDFH;
import com.kosmo.tournament.user.entity.User;
import com.kosmo.tournament.user.repository.UserRepository;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final JdbcTemplate jdbcTemplate;

    public UserService(UserRepository userRepository,
                       JdbcTemplate jdbcTemplate) {
        this.userRepository = userRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    public UserProfileDFH getUserDFH(Long requestedUserId, String currentUsername) {
        User requestedUser = userRepository.findById(requestedUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean owner = currentUsername != null
                && currentUsername.equals(requestedUser.getUsername());

        UserProfileDFH dfh = new UserProfileDFH();
        dfh.setUserId(requestedUser.getId());
        dfh.setUsername(requestedUser.getUsername());
        dfh.setEmail(owner ? requestedUser.getEmail() : null);
        dfh.setRole(requestedUser.getRole());
        dfh.setCountry(requestedUser.getCountry());
        dfh.setEnabled(requestedUser.getEnabled());
        dfh.setImageUrl(requestedUser.getImageUrl());
        dfh.setOwner(owner);
        dfh.setGames(getUserGamesStats(requestedUser.getId()));

        return dfh;
    }

    public List<UserGameStatsDFH> getUserGamesStats(Long userId) {
        String sql = """
            SELECT
                gt."name" AS game_name,
                COUNT(ms."id") AS match_count,
                COALESCE(
                    ROUND(
                        100.0 * SUM(
                            CASE
                                WHEN ms."winnerPlayerId" = ? THEN 1
                                ELSE 0
                            END
                        ) / NULLIF(COUNT(ms."id"), 0)
                    ),
                    0
                ) AS win_percent
            FROM "UserGames" ug
            JOIN "GameTypes" gt
                ON gt."id" = ug."gameId"
            LEFT JOIN "Tournament" t
                ON t."gameType" = gt."id"
            LEFT JOIN "MatchSolo" ms
                ON ms."tournamentId" = t."id"
               AND (ms."player1Id" = ? OR ms."player2Id" = ?)
            WHERE ug."userId" = ?
            GROUP BY gt."id", gt."name"
            ORDER BY gt."name"
        """;

        return jdbcTemplate.query(
                sql,
                (rs, rowNum) -> new UserGameStatsDFH(
                        rs.getString("game_name"),
                        rs.getInt("match_count"),
                        rs.getInt("win_percent")
                ),
                userId, userId, userId, userId
        );
    }
}