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
        Long userId = (Long) session.getAttribute("userId");

        if (userId == null) {
            return "redirect:/login";
        }

        User user = userRepository.findById(userId).orElse(null);

        if (user == null) {
            return "redirect:/login";
        }

        model.addAttribute("pageTitle", "Мой профиль");
        model.addAttribute("user", user);

        String roleDisplay = getRoleDisplay(user.getRole());
        model.addAttribute("roleDisplay", roleDisplay);

        return "profile/person_profile";
    }

    @GetMapping("/my/tournaments")
    public String myTournaments(Model model, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return "redirect:/login";
        }
        model.addAttribute("pageTitle", "Мои турниры");
        return "profile/my-tournaments";
    }

    @GetMapping("/my/matches")
    public String myMatches(Model model, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return "redirect:/login";
        }
        model.addAttribute("pageTitle", "Мои матчи");
        return "profile/my-matches";
    }

    @GetMapping("/notifications")
    public String notifications(Model model, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return "redirect:/login";
        }
        model.addAttribute("pageTitle", "Мои уведомления");
        return "profile/notifications";
    }

    private String getRoleDisplay(String role) {
        switch (role) {
            case "ADMIN": return "Администратор";
            case "ORGANIZER": return "Организатор";
            case "PLAYER": return "Игрок";
            default: return "Пользователь";
        }
    }
}