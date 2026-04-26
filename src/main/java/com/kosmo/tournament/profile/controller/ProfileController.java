package com.kosmo.tournament.profile.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@Controller
public class ProfileController {

    @GetMapping("/profile")
    public String myProfile(Model model) {
        model.addAttribute("pageTitle", "Мой профиль");
        return "profile/person_profile";
    }

    @GetMapping("/profile/{id}")
    public String publicProfile(@PathVariable Long id, Model model) {
        model.addAttribute("pageTitle", "Профиль игрока");
        model.addAttribute("profileUserId", id);
        return "profile/person_profile";
    }

    @GetMapping("/my/tournaments")
    public String myTournaments() {
        return "redirect:/tournaments";
    }

    @GetMapping("/my/matches")
    public String myMatches() {
        return "redirect:/";
    }

    @GetMapping("/notifications")
    public String notifications() {
        return "redirect:/profile";
    }
}
