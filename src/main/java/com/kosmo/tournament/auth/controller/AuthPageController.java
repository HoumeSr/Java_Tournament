package com.kosmo.tournament.auth.controller;

import com.kosmo.tournament.auth.service.AuthService;
import com.kosmo.tournament.auth.dto.AuthResult;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
public class AuthPageController {

    private final AuthService authService;

    public AuthPageController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping("/login")
    public String login(Model model) {
        model.addAttribute("pageTitle", "Авторизация");
        return "auth/login";
    }

    @GetMapping("/register")
    public String register(Model model) {
        model.addAttribute("pageTitle", "Регистрация");
        return "auth/register";
    }

    @PostMapping("/register")
    public String registerSubmit(@RequestParam String username,
                                 @RequestParam String email,
                                 @RequestParam String password,
                                 @RequestParam String confirmPassword,
                                 Model model) {

        AuthResult result = authService.register(username, email, password, confirmPassword);

        if (!result.success()) {
            model.addAttribute("error", result.message());
            return "auth/register";
        }

        return "redirect:/login?success=true";
    }

    @PostMapping("/signin")
    public String loginSubmit(@RequestParam String login,
                              @RequestParam String password,
                              HttpServletRequest request,
                              Model model) {

        AuthResult result = authService.login(login, password, request);

        if (!result.success()) {
            model.addAttribute("error", result.message());
            return "auth/login";
        }

        return "redirect:/profile";
    }
}