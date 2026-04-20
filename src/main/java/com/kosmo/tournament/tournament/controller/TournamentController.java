package com.kosmo.tournament.tournament.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/tournaments")
public class TournamentController {

    @GetMapping
    public String listPage(Model model) {
        model.addAttribute("pageTitle", "Список турниров");
        return "tournament/list";
    }

    @GetMapping("/create")
    public String createPage(Model model) {
        model.addAttribute("pageTitle", "Создание турнира");
        return "tournament/create";
    }

    @GetMapping("/{id}")
    public String detailsPage(@PathVariable Long id, Model model) {
        model.addAttribute("pageTitle", "Турнир #" + id);
        model.addAttribute("tournamentId", id);
        return "tournament/details";
    }

    @GetMapping("/{id}/manage")
    public String managePage(@PathVariable Long id, Model model) {
        model.addAttribute("pageTitle", "Управление турниром #" + id);
        model.addAttribute("tournamentId", id);
        return "tournament/manage";
    }

    @GetMapping("/{id}/participants")
    public String participantsPage(@PathVariable Long id, Model model) {
        model.addAttribute("pageTitle", "Участники турнира #" + id);
        model.addAttribute("tournamentId", id);
        return "tournament/participants";
    }

    @GetMapping("/{id}/matches")
    public String matchesPage(@PathVariable Long id, Model model) {
        model.addAttribute("pageTitle", "Матчи турнира #" + id);
        model.addAttribute("tournamentId", id);
        return "tournament/matches";
    }
}