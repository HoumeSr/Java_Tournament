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

    public UserService(UserRepository userRepository,
                       JdbcTemplate jdbcTemplate) {
        this.userRepository = userRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    public UserDFH getUserProfile(Long requestedUserId, String currentUsername) {
        User requestedUser = userRepository.findById(requestedUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean owner = currentUsername != null
                && currentUsername.equals(requestedUser.getUsername());

        Integer countMatch = getUserCountMatch(requestedUserId);

        UserDFH response = new UserDFH();
        response.setUserId(requestedUser.getId());
        response.setUsername(requestedUser.getUsername());
        response.setEmail(owner ? requestedUser.getEmail() : null);
        response.setRole(requestedUser.getRole());
        response.setCountry(requestedUser.getCountry());
        response.setEnabled(requestedUser.getEnabled());
        response.setImageUrl(requestedUser.getImageUrl());
        response.setCountMatch(countMatch);
        response.setPercentWin(percentWin);
        response.setOwner(owner);

        return response;
    }

    private Integer getUserCountMatch(Long userId) {
        String sql = """
            SELECT COALESCE(MAX(ug.rating), 0)
            FROM "UserGames" ug
            WHERE ug."userId" = ?
        """;

        Integer rating = jdbcTemplate.queryForObject(sql, Integer.class, userId);
        return rating != null ? rating : 0;
    }
}