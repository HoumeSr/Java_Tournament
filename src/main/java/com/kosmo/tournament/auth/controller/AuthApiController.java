package com.kosmo.tournament.auth.controller;

import com.kosmo.tournament.auth.dto.AuthResult;
import com.kosmo.tournament.auth.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthApiController {

    private final AuthService authService;

    public AuthApiController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public Map<String, Object> registerAjax(@RequestParam String username,
                                            @RequestParam String email,
                                            @RequestParam String password,
                                            @RequestParam String confirmPassword) {

        AuthResult result = authService.register(username, email, password, confirmPassword);

        if (!result.success()) {
            return Map.of(
                    "success", false,
                    "message", result.message()
            );
        }

        return Map.of(
                "success", true,
                "message", "Регистрация успешна!",
                "redirectUrl", "/login"
        );
    }

    @PostMapping("/login")
    public Map<String, Object> loginAjax(@RequestParam String login,
                                         @RequestParam String password,
                                         HttpServletRequest request) {

        AuthResult result = authService.login(login, password, request);

        if (!result.success()) {
            return Map.of(
                    "success", false,
                    "message", result.message()
            );
        }

        return Map.of(
                "success", true,
                "message", "Вход выполнен успешно",
                "redirectUrl", "/profile",
                "user", result.user()
        );
    }

    @PostMapping("/logout")
    public Map<String, Object> logout(HttpServletRequest request) {
        authService.logout(request);

        return Map.of(
                "success", true,
                "redirectUrl", "/"
        );
    }

    @GetMapping("/check")
    public Map<String, Object> checkAuth(HttpServletRequest request) {
        return authService.checkAuth(request);
    }
}