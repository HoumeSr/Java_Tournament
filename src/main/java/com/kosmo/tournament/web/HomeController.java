package com.kosmo.tournament.web;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {

    @GetMapping("/")
    public String home(Model model) {
        model.addAttribute("pageTitle", "Главная");
        return "home";
    }

    @GetMapping("/rating")
    public String rating(Model model) {
        model.addAttribute("pageTitle", "Рейтинг игроков");
        return "rating";
    }

    @GetMapping("/forgot-password")
    public String forgotPassword() {
        return "redirect:/login";
    }
}