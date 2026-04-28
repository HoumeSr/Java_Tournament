package com.kosmo.tournament.match.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
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
    public ResponseEntity<?> updateSoloMatchResult(@PathVariable Long matchId,
                                                   @RequestBody UpdateSoloMatchResultDTO dto,
                                                   Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Необходимо авторизоваться"));
        }

        try {
            return ResponseEntity.ok(matchService.updateSoloMatchResult(matchId, dto, authentication.getName()));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("success", false, "message", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @RequestMapping(value = "/team/{matchId}/result", method = {RequestMethod.POST, RequestMethod.PUT})
    public ResponseEntity<?> updateTeamMatchResult(@PathVariable Long matchId,
                                                   @RequestBody UpdateTeamMatchResultDTO dto,
                                                   Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Необходимо авторизоваться"));
        }

        try {
            return ResponseEntity.ok(matchService.updateTeamMatchResult(matchId, dto, authentication.getName()));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("success", false, "message", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/{matchType}/{matchId}/start")
    public ResponseEntity<?> startMatch(@PathVariable String matchType,
                                        @PathVariable Long matchId,
                                        Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Необходимо авторизоваться"));
        }

        try {
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Матч запущен",
                    "match", matchService.startMatch(matchType, matchId, authentication.getName())
            ));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("success", false, "message", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/{matchType}/{matchId}/cancel")
    public ResponseEntity<?> cancelMatch(@PathVariable String matchType,
                                         @PathVariable Long matchId,
                                         Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Необходимо авторизоваться"));
        }

        try {
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Матч отменён",
                    "match", matchService.cancelMatch(matchType, matchId, authentication.getName())
            ));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("success", false, "message", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/{matchType}/{matchId}/reset-result")
    public ResponseEntity<?> resetMatchResult(@PathVariable String matchType,
                                              @PathVariable Long matchId,
                                              Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Необходимо авторизоваться"));
        }

        try {
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Результат матча сброшен",
                    "match", matchService.resetMatchResult(matchType, matchId, authentication.getName())
            ));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("success", false, "message", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}