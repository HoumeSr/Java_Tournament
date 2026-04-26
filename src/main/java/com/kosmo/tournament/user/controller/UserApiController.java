package com.kosmo.tournament.user.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.kosmo.tournament.user.dto.ChangePasswordDTO;
import com.kosmo.tournament.user.dto.CreateUserDTO;
import com.kosmo.tournament.user.dto.ShortUserDTO;
import com.kosmo.tournament.user.dto.UpdateUserDTO;
import com.kosmo.tournament.user.dto.UserProfileDTO;
import com.kosmo.tournament.user.service.UserService;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/users")
public class UserApiController {

    private final UserService userService;

    public UserApiController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/{id}")
    public UserProfileDTO getUser(@PathVariable Long id, Authentication authentication) {
        String currentUsername = authentication != null ? authentication.getName() : null;
        return userService.getUserProfile(id, currentUsername);
    }

    @GetMapping("/search")
    public List<ShortUserDTO> searchUsers(@RequestParam String query) {
        return userService.searchUsers(query);
    }

    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody CreateUserDTO dto) {
        try {
            UserProfileDTO created = userService.createUser(dto);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of(
                            "success", true,
                            "message", "Пользователь успешно создан",
                            "user", created
                    ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "success", false,
                            "message", e.getMessage()
                    ));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id,
                                        @RequestBody UpdateUserDTO dto,
                                        Authentication authentication,
                                        HttpServletRequest request) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Необходимо авторизоваться"));
        }

        try {
            UserProfileDTO updated = userService.updateUser(id, dto, authentication.getName());
            request.getSession().setAttribute("username", updated.getUsername());
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Профиль успешно обновлён",
                    "user", updated
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    @PutMapping("/update")
    public ResponseEntity<?> updateCurrentUser(@RequestBody UpdateUserDTO dto,
                                               Authentication authentication,
                                               HttpServletRequest request) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Необходимо авторизоваться"));
        }

        try {
            UserProfileDTO updated = userService.updateCurrentUser(dto, authentication.getName());
            request.getSession().setAttribute("username", updated.getUsername());
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    @PostMapping("/avatar")
    public ResponseEntity<?> updateAvatar(@RequestBody UpdateUserDTO dto,
                                          Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Необходимо авторизоваться"));
        }

        try {
            userService.updateAvatar(authentication.getName(), dto.getImageUrl());
            return ResponseEntity.ok(Map.of("success", true, "message", "Аватар обновлён"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @DeleteMapping("/avatar")
    public ResponseEntity<?> resetAvatar(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Необходимо авторизоваться"));
        }

        try {
            userService.resetAvatar(authentication.getName());
            return ResponseEntity.ok(Map.of("success", true, "message", "Аватар сброшен"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordDTO dto,
                                            Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Необходимо авторизоваться"));
        }

        try {
            userService.changePassword(authentication.getName(), dto);
            return ResponseEntity.ok(Map.of("success", true, "message", "Пароль успешно изменён"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}
