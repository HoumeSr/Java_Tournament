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
}