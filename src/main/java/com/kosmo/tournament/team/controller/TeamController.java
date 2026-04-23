package com.kosmo.tournament.team.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/teams")
public class TeamController {

    @GetMapping("/create")
    public String createPage(Model model) {
        model.addAttribute("pageTitle", "Создание команды");
        return "team/create";
    }

    @GetMapping
    public String listPage(Model model) {
        model.addAttribute("pageTitle", "Команды");
        return "team/list";
    }
}

