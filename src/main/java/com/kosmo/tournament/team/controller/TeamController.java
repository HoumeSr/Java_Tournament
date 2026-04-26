package com.kosmo.tournament.team.controller;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

import com.kosmo.tournament.team.dto.TeamFullDTO;
import com.kosmo.tournament.team.service.TeamService;

@Controller
@RequestMapping("/teams")
public class TeamController {

    private final TeamService teamService;

    public TeamController(TeamService teamService) {
        this.teamService = teamService;
    }

    @GetMapping
    public String listPage(Model model, Authentication authentication) {
        model.addAttribute("pageTitle", "Команды");
        model.addAttribute("isAuthenticated", authentication != null);
        return "team/list";
    }

    @GetMapping("/create")
    public String createPage(Model model, Authentication authentication) {
        model.addAttribute("pageTitle", "Создание команды");
        model.addAttribute("isAuthenticated", authentication != null);
        return "team/create";
    }

    @GetMapping("/{id}")
    public String detailsPage(@PathVariable Long id, Model model, Authentication authentication) {
        try {
            String currentUsername = authentication != null ? authentication.getName() : null;
            TeamFullDTO team = teamService.getTeamById(id, currentUsername);

            if (team == null) {
                model.addAttribute("error", "Команда не найдена");
                model.addAttribute("pageTitle", "Команда не найдена");
                model.addAttribute("isAuthenticated", authentication != null);
                return "team/details";
            }

            boolean isCaptain = false;
            boolean isMember = false;

            if (authentication != null && team.getCaptainUsername() != null) {
                isCaptain = team.getCaptainUsername().equals(currentUsername);

                if (team.getMembers() != null) {
                    isMember = team.getMembers().stream()
                            .anyMatch(member -> member.getUsername().equals(currentUsername));
                }
            }

            model.addAttribute("team", team);
            model.addAttribute("isCaptain", isCaptain);
            model.addAttribute("isMember", isMember);
            model.addAttribute("isAuthenticated", authentication != null);
            model.addAttribute("pageTitle", team.getName());

            return "team/details";

        } catch (Exception e) {
            model.addAttribute("error", "Ошибка загрузки команды: " + e.getMessage());
            model.addAttribute("pageTitle", "Ошибка");
            model.addAttribute("isAuthenticated", authentication != null);
            return "team/details";
        }
    }
}