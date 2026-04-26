package com.kosmo.tournament.match.controller;

import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import com.kosmo.tournament.match.dto.MatchDTO;
import com.kosmo.tournament.match.dto.UpdateSoloMatchResultDTO;
import com.kosmo.tournament.match.dto.UpdateTeamMatchResultDTO;
import com.kosmo.tournament.match.service.MatchService;

@RestController
@RequestMapping("/api/matches")
public class MatchApiController {

    private final MatchService matchService;

    public MatchApiController(MatchService matchService) {
        this.matchService = matchService;
    }

    @GetMapping("/my")
    public List<MatchDTO> getMyMatches(Authentication authentication) {
        if (authentication == null) {
            return List.of();
        }
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

    @RequestMapping(value = "/solo/{matchId}/result", method = {RequestMethod.POST, RequestMethod.PUT})
    public MatchDTO updateSoloMatchResult(@PathVariable Long matchId,
                                          @RequestBody UpdateSoloMatchResultDTO dto,
                                          Authentication authentication) {
        String currentUsername = authentication != null ? authentication.getName() : null;
        return matchService.updateSoloMatchResult(matchId, dto, currentUsername);
    }

    @RequestMapping(value = "/team/{matchId}/result", method = {RequestMethod.POST, RequestMethod.PUT})
    public MatchDTO updateTeamMatchResult(@PathVariable Long matchId,
                                          @RequestBody UpdateTeamMatchResultDTO dto,
                                          Authentication authentication) {
        String currentUsername = authentication != null ? authentication.getName() : null;
        return matchService.updateTeamMatchResult(matchId, dto, currentUsername);
    }
}
