package com.kosmo.tournament.user.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.kosmo.tournament.rating.entity.RatingStats;
import com.kosmo.tournament.rating.repository.RatingStatsRepository;
import com.kosmo.tournament.storage.service.FileStorageService;
import com.kosmo.tournament.storage.service.RandomImageService;
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

    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");

    private final UserRepository userRepository;
    private final JdbcTemplate jdbcTemplate;
    private final PasswordEncoder passwordEncoder;
    private final FileStorageService fileStorageService;
    private final RatingStatsRepository ratingStatsRepository;
    
    private final RandomImageService randomImageService;

    // private static final String DEFAULT_IMAGE_URL = "http://localhost:9000/images/profiles/DEFAULT_IMAGE.png";

    public UserService(UserRepository userRepository,
                       JdbcTemplate jdbcTemplate,
                       PasswordEncoder passwordEncoder,
                       FileStorageService fileStorageService,
                       RatingStatsRepository ratingStatsRepository,
                       RandomImageService randomImageService) {
        this.userRepository = userRepository;
        this.jdbcTemplate = jdbcTemplate;
        this.passwordEncoder = passwordEncoder;
        this.fileStorageService = fileStorageService;
        this.ratingStatsRepository = ratingStatsRepository;
        this.randomImageService = randomImageService;
    }

    public UserProfileDTO getUserProfile(Long requestedUserId, String currentUsername) {
        User requestedUser = userRepository.findById(requestedUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean owner = currentUsername != null && currentUsername.equals(requestedUser.getUsername());
        return buildUserProfileDTO(requestedUser, owner);
    }

    public List<ShortUserDTO> searchUsers(String query) {
        if (query == null || query.trim().isBlank()) {
            return List.of();
        }

        return userRepository.findTop20ByUsernameContainingIgnoreCaseOrderByUsernameAsc(query.trim())
                .stream()
                .map(this::toShortUserDTO)
                .toList();
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
        if (dto.getCountry() == null || dto.getCountry().trim().isBlank()) {
            throw new RuntimeException("Country is required");
        }

        String username = dto.getUsername().trim();
        String email = dto.getEmail().trim();
        String country = dto.getCountry().trim();

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
        user.setImageUrl(dto.getImageUrl() != null && !dto.getImageUrl().trim().isBlank()
                ? dto.getImageUrl().trim()
                : randomImageService.getRandomProfileImage());

        User saved = userRepository.save(user);
        return buildUserProfileDTO(saved, true);
    }

    @Transactional
    public UserProfileDTO updateUser(Long userId, UpdateUserDTO dto, String currentUsername) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (currentUsername == null) {
            throw new RuntimeException("Authentication required");
        }

        boolean owner = currentUsername.equals(user.getUsername());
        boolean admin = userRepository.findByUsername(currentUsername)
                .map(currentUser -> "ADMIN".equalsIgnoreCase(currentUser.getRole()))
                .orElse(false);

        if (!owner && !admin) {
            throw new RuntimeException("You can update only your own profile");
        }

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
            if (newCountry.isBlank()) {
                throw new RuntimeException("Country cannot be empty");
            }
            user.setCountry(newCountry);
        }

        if (dto.getImageUrl() != null) {
            String newImageUrl = dto.getImageUrl().trim();
            user.setImageUrl(newImageUrl.isBlank() ? DEFAULT_IMAGE_URL : newImageUrl);
        }

        User saved = userRepository.save(user);
        return buildUserProfileDTO(saved, true);
    }

    @Transactional
    public UserProfileDTO updateCurrentUser(UpdateUserDTO dto, String currentUsername) {
        User user = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return updateUser(user.getId(), dto, currentUsername);
    }

    @Transactional
    public String updateAvatar(String currentUsername, MultipartFile file) {
        User user = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String imageUrl = fileStorageService.uploadProfileImage(file, user.getId());
        user.setImageUrl(imageUrl);
        userRepository.save(user);

        return imageUrl;
    }

    @Transactional
    public void resetAvatar(String currentUsername) {
        User user = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setImageUrl(randomImageService.getRandomProfileImage());
        userRepository.save(user);
    }

    @Transactional
    public void changePassword(String currentUsername, ChangePasswordDTO dto) {
        User user = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("User not found"));

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

        user.setPasswordHash(passwordEncoder.encode(dto.getNewPassword()));
        userRepository.save(user);
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

    public List<UserGameStatsDTO> getUserGamesStats(Long userId) {
        List<RatingStats> statsList = ratingStatsRepository.findByUserIdOrderByWinRateDesc(userId);

        if (statsList.isEmpty()) {
            return new ArrayList<>();
        }

        return statsList.stream()
                .map(stats -> new UserGameStatsDTO(
                        stats.getGameTypeId(),
                        stats.getGameTypeName(),
                        stats.getTotalMatches(),
                        stats.getTotalWins(),
                        stats.getWinRate()
                ))
                .collect(Collectors.toList());
    }

    private ShortUserDTO toShortUserDTO(User user) {
        ShortUserDTO dto = new ShortUserDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setCountry(user.getCountry());
        dto.setImageUrl(user.getImageUrl());
        return dto;
    }

    private boolean isValidEmail(String email) {
        return EMAIL_PATTERN.matcher(email).matches();
    }
}