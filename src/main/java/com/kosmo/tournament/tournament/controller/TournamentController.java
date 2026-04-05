package com.kosmo.tournament.tournament.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/tournaments")
public class TournamentController {

    @GetMapping
    public String listTournaments(Model model) {
        model.addAttribute("pageTitle", "Список турниров");
        return "tournament/list";
    }

    @GetMapping("/{id}")
    public String tournamentDetails(@PathVariable Long id, Model model) {
        model.addAttribute("pageTitle", "Турнир #" + id);
        model.addAttribute("tournamentId", id);
        return "tournament/details";
    }

    @GetMapping("/create")
    public String createTournamentForm(Model model) {
        model.addAttribute("pageTitle", "Создание турнира");
        return "tournament/create";
    }

    @GetMapping("/{id}/manage")
    public String manageTournament(@PathVariable Long id, Model model) {
        model.addAttribute("pageTitle", "Управление турниром #" + id);
        model.addAttribute("tournamentId", id);
        return "tournament/manage";
    }

    @GetMapping("/{id}/participants")
    public String tournamentParticipants(@PathVariable Long id, Model model) {
        model.addAttribute("pageTitle", "Участники турнира #" + id);
        model.addAttribute("tournamentId", id);
        return "tournament/participants";
    }

    @GetMapping("/{id}/matches")
    public String tournamentMatches(@PathVariable Long id, Model model) {
        model.addAttribute("pageTitle", "Матчи турнира #" + id);
        model.addAttribute("tournamentId", id);
        return "tournament/matches";
    }
}
