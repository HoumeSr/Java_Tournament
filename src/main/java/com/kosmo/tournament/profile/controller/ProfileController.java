package com.kosmo.tournament.profile.controller;

import com.kosmo.tournament.user.entity.User;
import com.kosmo.tournament.user.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class ProfileController {

    private final UserRepository userRepository;

    public ProfileController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/profile")
    public String myProfile(Model model, HttpSession session) {
        if (session == null || session.getAttribute("userId") == null) {
            return "redirect:/login";
        }

        Long userId = (Long) session.getAttribute("userId");
        User user = userRepository.findById(userId).orElse(null);

        if (user == null) {
            return "redirect:/login";
        }

        model.addAttribute("pageTitle", "Мой профиль");
        model.addAttribute("user", user);
        model.addAttribute("roleDisplay", getRoleDisplay(user.getRole()));
        return "profile/person_profile";
    }

    @GetMapping("/my/tournaments")
    public String myTournaments(HttpSession session) {
        return (session != null && session.getAttribute("userId") != null) ? "redirect:/tournaments" : "redirect:/login";
    }

    @GetMapping("/my/matches")
    public String myMatches(HttpSession session) {
        return (session != null && session.getAttribute("userId") != null) ? "redirect:/profile" : "redirect:/login";
    }

    @GetMapping("/notifications")
    public String notifications(HttpSession session) {
        return (session != null && session.getAttribute("userId") != null) ? "redirect:/profile" : "redirect:/login";
    }

    private String getRoleDisplay(String role) {
        return switch (role) {
            case "ADMIN" -> "Администратор";
            case "ORGANIZER" -> "Организатор";
            case "PLAYER" -> "Игрок";
            default -> "Пользователь";
        };
    }
}
