package com.kosmo.tournament.tournament.controller;

import com.kosmo.tournament.tournament.dto.CreateTournamentDTO;
import com.kosmo.tournament.tournament.dto.TournamentFullDTO;
import com.kosmo.tournament.tournament.dto.TournamentShortDTO;
import com.kosmo.tournament.tournament.service.TournamentService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tournaments")
public class TournamentApiController {

    private final TournamentService tournamentService;

    public TournamentApiController(TournamentService tournamentService) {
        this.tournamentService = tournamentService;
    }

    @GetMapping
    public List<TournamentShortDTO> getAllTournaments() {
        return tournamentService.getAllTournaments();
    }

    @GetMapping("/{id}")
    public TournamentFullDTO getTournamentById(@PathVariable Long id,
                                               Authentication authentication) {
        String currentUsername = authentication != null ? authentication.getName() : null;
        return tournamentService.getTournamentById(id, currentUsername);
    }

    @GetMapping("/my")
    public List<TournamentShortDTO> getMyTournaments(Authentication authentication) {
        return tournamentService.getMyTournaments(authentication.getName());
    }

    @GetMapping("/status/{status}")
    public List<TournamentShortDTO> getByStatus(@PathVariable String status) {
        return tournamentService.getTournamentsByStatus(status);
    }

    @GetMapping("/game/{gameTypeId}")
    public List<TournamentShortDTO> getByGameType(@PathVariable Long gameTypeId) {
        return tournamentService.getTournamentsByGameType(gameTypeId);
    }

    @GetMapping("/search")
    public List<TournamentShortDTO> search(@RequestParam String title) {
        return tournamentService.searchByTitle(title);
    }

    @PostMapping
    public TournamentFullDTO createTournament(@RequestBody CreateTournamentDTO dto,
                                              Authentication authentication) {
        return tournamentService.createTournament(dto, authentication.getName());
    }
}