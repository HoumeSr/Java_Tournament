package com.kosmo.tournament.user.service;

import com.kosmo.tournament.user.dfh.UserProfileDFH;
import com.kosmo.tournament.user.entity.User;
import com.kosmo.tournament.user.repository.UserRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final JdbcTemplate jdbcTemplate;

    public UserService(UserRepository userRepository, JdbcTemplate jdbcTemplate) {
        this.userRepository = userRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    public UserProfileDFH getUserProfile(Long requestedUserId, String currentUsername) {
        User requestedUser = userRepository.findById(requestedUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean owner = currentUsername != null && currentUsername.equals(requestedUser.getUsername());

        UserProfileDFH response = new UserProfileDFH();
        response.setUserId(requestedUser.getId());
        response.setUsername(requestedUser.getUsername());
        response.setEmail(owner ? requestedUser.getEmail() : null);
        response.setRole(requestedUser.getRole());
        response.setCountry(requestedUser.getCountry());
        response.setEnabled(requestedUser.getEnabled());
        response.setImageUrl(requestedUser.getImageUrl());
        response.setCountMatch(getUserCountMatch(requestedUserId));
        response.setPercentWin(getUserPercentWin(requestedUserId));
        response.setOwner(owner);

        return response;
    }

    private Integer getUserCountMatch(Long userId) {
        try {
            String sql = "SELECT COUNT(*) FROM \"UserGames\" WHERE \"userId\" = ?";
            Integer count = jdbcTemplate.queryForObject(sql, Integer.class, userId);
            return count != null ? count : 0;
        } catch (Exception e) {
            return 0;
        }
    }

    private Integer getUserPercentWin(Long userId) {
        try {
            String sql = """
                SELECT 
                    CASE 
                        WHEN COUNT(*) = 0 THEN 0
                        ELSE ROUND(100.0 * SUM(CASE WHEN "isWin" = true THEN 1 ELSE 0 END) / COUNT(*))
                    END
                FROM "UserGames"
                WHERE "userId" = ?
            """;
            Integer percent = jdbcTemplate.queryForObject(sql, Integer.class, userId);
            return percent != null ? percent : 0;
        } catch (Exception e) {
            return 0;
        }
    }
}