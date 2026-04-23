package com.kosmo.tournament.user.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kosmo.tournament.user.dto.ChangePasswordDTO;
import com.kosmo.tournament.user.dto.CreateUserDTO;
import com.kosmo.tournament.user.dto.ShortUserDTO;
import com.kosmo.tournament.user.dto.UpdateUserDTO;
import com.kosmo.tournament.user.dto.UserGameStatsDTO;
import com.kosmo.tournament.user.dto.UserProfileDTO;
import com.kosmo.tournament.user.entity.User;
import com.kosmo.tournament.user.repository.UserRepository;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final JdbcTemplate jdbcTemplate;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository,
                       JdbcTemplate jdbcTemplate,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.jdbcTemplate = jdbcTemplate;
        this.passwordEncoder = passwordEncoder;
    }

    public UserProfileDTO getUserProfile(Long requestedUserId, String currentUsername) {
        User requestedUser = userRepository.findById(requestedUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean owner = currentUsername != null
                && currentUsername.equals(requestedUser.getUsername());

        return buildUserProfileDTO(requestedUser, owner);
    }

    @Transactional
    public UserProfileDTO createUser(CreateUserDTO dto) {
        if (dto.getUsername() == null || dto.getUsername().trim().isBlank()) {
            throw new RuntimeException("Username is required");
        }
        if (dto.getEmail() == null || dto.getEmail().trim().isBlank()) {
            throw new RuntimeException("Email is required");
        }
        if (dto.getPassword() == null || dto.getPassword().isBlank()) {
            throw new RuntimeException("Password is required");
        }
        if (dto.getPassword().length() < 6) {
            throw new RuntimeException("Password must be at least 6 characters");
        }

        String username = dto.getUsername().trim();
        String email = dto.getEmail().trim();
        String country = dto.getCountry() != null && !dto.getCountry().trim().isBlank()
                ? dto.getCountry().trim()
                : "Не указана";

        if (!isValidEmail(email)) {
            throw new RuntimeException("Invalid email format");
        }
        if (userRepository.existsByUsername(username)) {
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already exists");
        }

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(dto.getPassword()));
        user.setRole("PLAYER");
        user.setCountry(country);
        user.setEnabled(true);
        user.setCreatedAt(LocalDateTime.now());
        user.setImageUrl(
                dto.getImageUrl() != null && !dto.getImageUrl().trim().isBlank()
                        ? dto.getImageUrl().trim()
                        : "DEFAULT_USER_IMAGE.jpg"
        );

        User saved = userRepository.save(user);
        return buildUserProfileDTO(saved, true);
    }

    @Transactional
    public UserProfileDTO updateUser(Long userId, UpdateUserDTO dto, String currentUsername) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        validateOwner(user, currentUsername);
        applyUserUpdate(user, dto);

        User saved = userRepository.save(user);
        return buildUserProfileDTO(saved, true);
    }

    @Transactional
    public UserProfileDTO updateCurrentUser(UpdateUserDTO dto, String currentUsername) {
        User user = getCurrentUser(currentUsername);
        applyUserUpdate(user, dto);
        User saved = userRepository.save(user);
        return buildUserProfileDTO(saved, true);
    }

    @Transactional
    public UserProfileDTO updateCurrentUserAvatar(String imageUrl, String currentUsername) {
        User user = getCurrentUser(currentUsername);
        user.setImageUrl(imageUrl != null && !imageUrl.trim().isBlank() ? imageUrl.trim() : "DEFAULT_USER_IMAGE.jpg");
        User saved = userRepository.save(user);
        return buildUserProfileDTO(saved, true);
    }

    @Transactional
    public UserProfileDTO resetCurrentUserAvatar(String currentUsername) {
        User user = getCurrentUser(currentUsername);
        user.setImageUrl("DEFAULT_USER_IMAGE.jpg");
        User saved = userRepository.save(user);
        return buildUserProfileDTO(saved, true);
    }

    @Transactional
    public void changePassword(ChangePasswordDTO dto, String currentUsername) {
        User user = getCurrentUser(currentUsername);

        if (dto.getCurrentPassword() == null || dto.getCurrentPassword().isBlank()) {
            throw new RuntimeException("Current password is required");
        }
        if (dto.getNewPassword() == null || dto.getNewPassword().isBlank()) {
            throw new RuntimeException("New password is required");
        }
        if (dto.getNewPassword().length() < 6) {
            throw new RuntimeException("New password must be at least 6 characters");
        }
        if (!passwordEncoder.matches(dto.getCurrentPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Current password is incorrect");
        }
        if (passwordEncoder.matches(dto.getNewPassword(), user.getPasswordHash())) {
            throw new RuntimeException("New password must be different from current password");
        }

        user.setPasswordHash(passwordEncoder.encode(dto.getNewPassword()));
        userRepository.save(user);
    }

    public List<UserGameStatsDTO> getUserGamesStats(Long userId) {
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
                (rs, rowNum) -> new UserGameStatsDTO(
                        rs.getString("game_name"),
                        rs.getInt("match_count"),
                        rs.getInt("win_percent")
                ),
                userId, userId, userId, userId
        );
    }

    private void applyUserUpdate(User user, UpdateUserDTO dto) {
        if (dto.getUsername() != null) {
            String newUsername = dto.getUsername().trim();
            if (newUsername.isBlank()) {
                throw new RuntimeException("Username cannot be empty");
            }
            if (!newUsername.equals(user.getUsername()) && userRepository.existsByUsername(newUsername)) {
                throw new RuntimeException("Username already exists");
            }
            user.setUsername(newUsername);
        }

        if (dto.getEmail() != null) {
            String newEmail = dto.getEmail().trim();
            if (newEmail.isBlank()) {
                throw new RuntimeException("Email cannot be empty");
            }
            if (!isValidEmail(newEmail)) {
                throw new RuntimeException("Invalid email format");
            }
            if (!newEmail.equals(user.getEmail()) && userRepository.existsByEmail(newEmail)) {
                throw new RuntimeException("Email already exists");
            }
            user.setEmail(newEmail);
        }

        if (dto.getCountry() != null) {
            String newCountry = dto.getCountry().trim();
            user.setCountry(newCountry.isBlank() ? "Не указана" : newCountry);
        }

        if (dto.getImageUrl() != null) {
            String newImageUrl = dto.getImageUrl().trim();
            user.setImageUrl(newImageUrl.isBlank() ? "DEFAULT_USER_IMAGE.jpg" : newImageUrl);
        }
    }

    private User getCurrentUser(String currentUsername) {
        if (currentUsername == null || currentUsername.isBlank()) {
            throw new RuntimeException("Authentication required");
        }
        return userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private void validateOwner(User user, String currentUsername) {
        if (currentUsername == null || !currentUsername.equals(user.getUsername())) {
            throw new RuntimeException("You can update only your own profile");
        }
    }

    private UserProfileDTO buildUserProfileDTO(User user, boolean owner) {
        UserProfileDTO dto = new UserProfileDTO();
        dto.setUserId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(owner ? user.getEmail() : null);
        dto.setRole(user.getRole());
        dto.setCountry(user.getCountry());
        dto.setEnabled(user.getEnabled());
        dto.setImageUrl(user.getImageUrl());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setOwner(owner);
        dto.setGames(getUserGamesStats(user.getId()));
        return dto;
    }

    public ShortUserDTO toShortUserDTO(User user) {
        ShortUserDTO dto = new ShortUserDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setRole(user.getRole());
        dto.setCountry(user.getCountry());
        dto.setImageUrl(user.getImageUrl());
        return dto;
    }

    private boolean isValidEmail(String email) {
        if (email == null || email.isBlank()) return false;
    
        String emailRegex = "^[a-zA-Z0-9_+&*-]+(?:\\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,}$";
        
        return email.matches(emailRegex);
    }

    public List<ShortUserDTO> searchUsers(String query) {
        if (query == null || query.trim().isEmpty()) {
            return List.of();
        }
        
        return userRepository.searchByUsernameOrEmail(query.trim())
                .stream()
                .map(this::toShortUserDTO)
                .limit(10)
                .toList();
    }
}
