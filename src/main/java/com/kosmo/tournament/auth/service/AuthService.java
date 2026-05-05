package com.kosmo.tournament.auth.service;

import com.kosmo.tournament.auth.dto.AuthResult;
import com.kosmo.tournament.storage.service.RandomImageService;
import com.kosmo.tournament.user.entity.User;
import com.kosmo.tournament.user.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RandomImageService randomImageService;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       RandomImageService randomImageService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.randomImageService = randomImageService;
    }

    public AuthResult register(String username,
                               String email,
                               String password,
                               String confirmPassword) {

        if (username == null || username.isBlank()) {
            return AuthResult.fail("Никнейм обязателен");
        }

        if (email == null || email.isBlank()) {
            return AuthResult.fail("Email обязателен");
        }

        if (password == null || password.isBlank()) {
            return AuthResult.fail("Пароль обязателен");
        }

        if (!password.equals(confirmPassword)) {
            return AuthResult.fail("Пароли не совпадают");
        }

        if (userRepository.existsByUsername(username)) {
            return AuthResult.fail("Имя пользователя уже занято");
        }

        if (userRepository.existsByEmail(email)) {
            return AuthResult.fail("Email уже используется");
        }

        String passwordHash = passwordEncoder.encode(password);

        User newUser = new User(username, email, passwordHash);
        newUser.setImageUrl(randomImageService.getRandomProfileImage());

        userRepository.save(newUser);

        return AuthResult.ok(null);
    }

    public AuthResult login(String login,
                            String password,
                            HttpServletRequest request) {

        User user = findUserByLogin(login);

        if (user == null || !passwordEncoder.matches(password, user.getPasswordHash())) {
            return AuthResult.fail("Неверный логин/email или пароль");
        }

        if (!Boolean.TRUE.equals(user.getEnabled())) {
            return AuthResult.fail("Аккаунт отключен");
        }

        HttpSession session = request.getSession(true);
        session.setAttribute("userId", user.getId());
        session.setAttribute("username", user.getUsername());
        session.setAttribute("userRole", user.getRole());

        Map<String, Object> userMap = Map.of(
                "id", user.getId(),
                "username", user.getUsername(),
                "role", user.getRole(),
                "imageUrl", user.getImageUrl() != null
                        ? user.getImageUrl()
                        : randomImageService.getRandomProfileImage()
        );

        return AuthResult.ok(userMap);
    }

    public void logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);

        if (session != null) {
            session.invalidate();
        }
    }

    public Map<String, Object> checkAuth(HttpServletRequest request) {
        HttpSession session = request.getSession(false);

        if (session == null || session.getAttribute("userId") == null) {
            return Map.of("authenticated", false);
        }

        Object userIdObj = session.getAttribute("userId");

        if (!(userIdObj instanceof Long userId)) {
            return Map.of("authenticated", false);
        }

        User user = userRepository.findById(userId).orElse(null);

        if (user == null) {
            return Map.of("authenticated", false);
        }

        Map<String, Object> userMap = Map.of(
                "id", user.getId(),
                "username", user.getUsername(),
                "role", user.getRole(),
                "imageUrl", user.getImageUrl()
        );

        return Map.of(
                "authenticated", true,
                "user", userMap
        );
    }

    private User findUserByLogin(String login) {
        if (login == null || login.isBlank()) {
            return null;
        }

        if (login.contains("@")) {
            return userRepository.findByEmail(login).orElse(null);
        }

        User byUsername = userRepository.findByUsername(login).orElse(null);

        if (byUsername != null) {
            return byUsername;
        }

        return userRepository.findByEmail(login).orElse(null);
    }
}