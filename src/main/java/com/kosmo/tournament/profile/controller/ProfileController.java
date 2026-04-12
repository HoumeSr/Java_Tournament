package com.kosmo.tournament.profile.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class ProfileController {

    @GetMapping("/profile")
    public String myProfile(Model model) {
        model.addAttribute("pageTitle", "Мой профиль");
        return "profile/person_profile";
    }

    @GetMapping("/my/tournaments")
    public String myTournaments(Model model) {
        model.addAttribute("pageTitle", "Мои турниры");
        return "profile/my-tournaments";
    }

    @GetMapping("/my/matches")
    public String myMatches(Model model) {
        model.addAttribute("pageTitle", "Мои матчи");
        return "profile/my-matches";
    }

    @GetMapping("/notifications")
    public String notifications(Model model) {
        model.addAttribute("pageTitle", "Мои уведомления");
        return "profile/notifications";
    }
}