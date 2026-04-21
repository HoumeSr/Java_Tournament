package com.kosmo.tournament.tournament.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import com.kosmo.tournament.tournament.dto.TournamentFullDTO;
import com.kosmo.tournament.tournament.service.TournamentService;

@Controller
@RequestMapping("/tournaments")
public class TournamentController {

    private final TournamentService tournamentService;

    public TournamentController(TournamentService tournamentService) {
        this.tournamentService = tournamentService;
    }

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
    public String detailsPage(@PathVariable Long id, Model model, 
                              org.springframework.security.core.Authentication authentication) {
        try {
            String currentUsername = authentication != null ? authentication.getName() : null;
            TournamentFullDTO tournament = tournamentService.getTournamentById(id, currentUsername);
            
            if (tournament == null) {
                model.addAttribute("error", "Турнир не найден");
                model.addAttribute("pageTitle", "Турнир не найден");
                return "tournament/details";
            }
            
            // Проверяем, является ли текущий пользователь организатором
            boolean isOwner = false;
            if (authentication != null && tournament.getOrganizerUsername() != null) {
                isOwner = tournament.getOrganizerUsername().equals(currentUsername);
            }
            
            model.addAttribute("tournament", tournament);
            model.addAttribute("isOwner", isOwner);
            model.addAttribute("pageTitle", tournament.getTitle());
            
            return "tournament/details";
            
        } catch (Exception e) {
            model.addAttribute("error", "Ошибка загрузки турнира: " + e.getMessage());
            model.addAttribute("pageTitle", "Ошибка");
            return "tournament/details";
        }
    }

    @GetMapping("/{id}/manage")
    public String managePage(@PathVariable Long id, Model model,
                            org.springframework.security.core.Authentication authentication) {
        try {
            if (authentication == null) {
                return "redirect:/login";
            }
            
            String currentUsername = authentication.getName();
            TournamentFullDTO tournament = tournamentService.getTournamentById(id, currentUsername);
            
            if (tournament == null) {
                return "redirect:/tournaments?notFound";
            }
            
            // Проверяем права доступа (только организатор)
            if (tournament.getOrganizerUsername() == null || 
                !tournament.getOrganizerUsername().equals(currentUsername)) {
                return "redirect:/tournaments/" + id + "?accessDenied";
            }
            
            model.addAttribute("tournament", tournament);
            model.addAttribute("pageTitle", "Управление: " + tournament.getTitle());
            
            return "tournament/manage";
            
        } catch (Exception e) {
            return "redirect:/tournaments/" + id + "?error";
        }
    }

    @GetMapping("/{id}/participants")
    public String participantsPage(@PathVariable Long id, Model model,
                                  org.springframework.security.core.Authentication authentication) {
        try {
            String currentUsername = authentication != null ? authentication.getName() : null;
            TournamentFullDTO tournament = tournamentService.getTournamentById(id, currentUsername);
            
            if (tournament == null) {
                return "redirect:/tournaments?notFound";
            }
            
            model.addAttribute("tournament", tournament);
            model.addAttribute("pageTitle", "Участники: " + tournament.getTitle());
            
            return "tournament/participants";
            
        } catch (Exception e) {
            return "redirect:/tournaments/" + id + "?error";
        }
    }

    @GetMapping("/{id}/matches")
    public String matchesPage(@PathVariable Long id, Model model,
                             org.springframework.security.core.Authentication authentication) {
        try {
            String currentUsername = authentication != null ? authentication.getName() : null;
            TournamentFullDTO tournament = tournamentService.getTournamentById(id, currentUsername);
            
            if (tournament == null) {
                return "redirect:/tournaments?notFound";
            }
            
            model.addAttribute("tournament", tournament);
            model.addAttribute("pageTitle", "Матчи: " + tournament.getTitle());
            
            return "tournament/matches";
            
        } catch (Exception e) {
            return "redirect:/tournaments/" + id + "?error";
        }
    }
}