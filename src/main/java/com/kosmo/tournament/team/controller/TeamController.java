package com.kosmo.tournament.team.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/teams")
public class TeamController {

    @GetMapping
    public String teams(Model model) {
        model.addAttribute("pageTitle", "Команды");
        return "team/list";
    }

    @GetMapping("/{id}")
    public String teamDetails(@PathVariable Long id, Model model) {
        model.addAttribute("pageTitle", "Команда #" + id);
        model.addAttribute("teamId", id);
        return "team/details";
    }

    @GetMapping("/create")
    public String createTeam(Model model) {
        model.addAttribute("pageTitle", "Создание команды");
        return "team/create";
    }

    @GetMapping("/my")
    public String myTeams(Model model) {
        model.addAttribute("pageTitle", "Мои команды");
        return "team/my-teams";
    }

    @GetMapping("/{id}/manage")
    public String manageTeam(@PathVariable Long id, Model model) {
        model.addAttribute("pageTitle", "Управление командой #" + id);
        model.addAttribute("teamId", id);
        return "team/manage";
    }
}