package com.kosmo.tournament.match.controller;

import com.kosmo.tournament.match.dfh.MatchDFH;
import com.kosmo.tournament.match.dfh.UpdateSoloMatchResultDFH;
import com.kosmo.tournament.match.dfh.UpdateTeamMatchResultDFH;
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
    public List<MatchDFH> getMyMatches(Authentication authentication) {
        return matchService.getMyMatches(authentication.getName());
    }

    @GetMapping("/tournament/{tournamentId}")
    public List<MatchDFH> getTournamentMatches(@PathVariable Long tournamentId,
                                               Authentication authentication) {
        String currentUsername = authentication != null ? authentication.getName() : null;
        return matchService.getTournamentMatches(tournamentId, currentUsername);
    }

    @GetMapping("/solo/{matchId}")
    public MatchDFH getSoloMatch(@PathVariable Long matchId,
                                 Authentication authentication) {
        String currentUsername = authentication != null ? authentication.getName() : null;
        return matchService.getSoloMatch(matchId, currentUsername);
    }

    @GetMapping("/team/{matchId}")
    public MatchDFH getTeamMatch(@PathVariable Long matchId,
                                 Authentication authentication) {
        String currentUsername = authentication != null ? authentication.getName() : null;
        return matchService.getTeamMatch(matchId, currentUsername);
    }

    @PostMapping("/solo/{matchId}/result")
    public MatchDFH updateSoloMatchResult(@PathVariable Long matchId,
                                          @RequestBody UpdateSoloMatchResultDFH dfh,
                                          Authentication authentication) {
        return matchService.updateSoloMatchResult(matchId, dfh, authentication.getName());
    }

    @PostMapping("/team/{matchId}/result")
    public MatchDFH updateTeamMatchResult(@PathVariable Long matchId,
                                          @RequestBody UpdateTeamMatchResultDFH dfh,
                                          Authentication authentication) {
        return matchService.updateTeamMatchResult(matchId, dfh, authentication.getName());
    }
}