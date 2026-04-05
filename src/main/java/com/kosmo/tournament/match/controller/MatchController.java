package com.kosmo.tournament.match.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/matches")
public class MatchController {

    @GetMapping("/{id}")
    public String matchDetails(@PathVariable Long id, Model model) {
        model.addAttribute("pageTitle", "Матч #" + id);
        model.addAttribute("matchId", id);
        return "match/details";
    }

    @GetMapping("/{id}/result")
    public String editMatchResult(@PathVariable Long id, Model model) {
        model.addAttribute("pageTitle", "Результат матча #" + id);
        model.addAttribute("matchId", id);
        return "match/result";
    }
}