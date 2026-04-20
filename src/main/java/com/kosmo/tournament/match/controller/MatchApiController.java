package com.kosmo.tournament.match.controller;

import com.kosmo.tournament.match.dto.MatchDTO;
import com.kosmo.tournament.match.dto.UpdateSoloMatchResultDTO;
import com.kosmo.tournament.match.dto.UpdateTeamMatchResultDTO;
import com.kosmo.tournament.match.service.MatchService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/matches")
public class MatchApiController {

    private final MatchService matchService;

    public MatchApiController(MatchService matchService) {
        this.matchService = matchService;
    }

    @GetMapping("/my")
    public List<MatchDTO> getMyMatches(Authentication authentication) {
        return matchService.getMyMatches(authentication.getName());
    }

    @GetMapping("/tournament/{tournamentId}")
    public List<MatchDTO> getTournamentMatches(@PathVariable Long tournamentId,
                                               Authentication authentication) {
        String currentUsername = authentication != null ? authentication.getName() : null;
        return matchService.getTournamentMatches(tournamentId, currentUsername);
    }

    @GetMapping("/solo/{matchId}")
    public MatchDTO getSoloMatch(@PathVariable Long matchId,
                                 Authentication authentication) {
        String currentUsername = authentication != null ? authentication.getName() : null;
        return matchService.getSoloMatch(matchId, currentUsername);
    }

    @GetMapping("/team/{matchId}")
    public MatchDTO getTeamMatch(@PathVariable Long matchId,
                                 Authentication authentication) {
        String currentUsername = authentication != null ? authentication.getName() : null;
        return matchService.getTeamMatch(matchId, currentUsername);
    }

    @PostMapping("/solo/{matchId}/result")
    public MatchDTO updateSoloMatchResult(@PathVariable Long matchId,
                                          @RequestBody UpdateSoloMatchResultDTO dfh,
                                          Authentication authentication) {
        return matchService.updateSoloMatchResult(matchId, dfh, authentication.getName());
    }

    @PostMapping("/team/{matchId}/result")
    public MatchDTO updateTeamMatchResult(@PathVariable Long matchId,
                                          @RequestBody UpdateTeamMatchResultDTO dfh,
                                          Authentication authentication) {
        return matchService.updateTeamMatchResult(matchId, dfh, authentication.getName());
    }
}