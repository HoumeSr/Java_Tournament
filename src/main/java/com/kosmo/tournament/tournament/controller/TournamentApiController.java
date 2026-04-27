package com.kosmo.tournament.tournament.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.kosmo.tournament.match.dto.MatchDTO;
import com.kosmo.tournament.match.service.MatchService;
import com.kosmo.tournament.team.dto.TeamShortDTO;
import com.kosmo.tournament.tournament.dto.CreateTournamentDTO;
import com.kosmo.tournament.tournament.dto.JoinSoloTournamentDTO;
import com.kosmo.tournament.tournament.dto.JoinTeamTournamentDTO;
import com.kosmo.tournament.tournament.dto.TournamentFullDTO;
import com.kosmo.tournament.tournament.dto.TournamentShortDTO;
import com.kosmo.tournament.tournament.dto.UpdateTournamentDTO;
import com.kosmo.tournament.tournament.service.TournamentService;

@RestController
@RequestMapping("/api/tournaments")
public class TournamentApiController {

    private final TournamentService tournamentService;
    private final MatchService matchService;

    public TournamentApiController(TournamentService tournamentService,
                                   MatchService matchService) {
        this.tournamentService = tournamentService;
        this.matchService = matchService;
    }

    @GetMapping
    public List<TournamentShortDTO> getAllTournaments() {
        return tournamentService.getAllTournaments();
    }

    @GetMapping("/{id}")
    public TournamentFullDTO getTournamentById(@PathVariable Long id, Authentication authentication) {
        String currentUsername = authentication != null ? authentication.getName() : null;
        return tournamentService.getTournamentById(id, currentUsername);
    }

    @GetMapping("/my")
    public List<TournamentShortDTO> getMyTournaments(Authentication authentication) {
        if (authentication == null) {
            return List.of();
        }
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

    @GetMapping("/{id}/my-eligible-teams")
    public List<TeamShortDTO> getMyEligibleTeams(@PathVariable Long id, Authentication authentication) {
        if (authentication == null) {
            return List.of();
        }
        return tournamentService.getMyEligibleTeams(id, authentication.getName());
    }

    @GetMapping("/{id}/matches")
    public List<MatchDTO> getTournamentMatches(@PathVariable Long id, Authentication authentication) {
        String currentUsername = authentication != null ? authentication.getName() : null;
        return matchService.getTournamentMatches(id, currentUsername);
    }

    @GetMapping("/{id}/participants")
    public List<Map<String, Object>> getTournamentParticipants(@PathVariable Long id) {
        return tournamentService.getTournamentParticipants(id);
    }

    @GetMapping("/search")
    public List<TournamentShortDTO> search(@RequestParam String title) {
        return tournamentService.searchByTitle(title);
    }

    @PostMapping
    public ResponseEntity<?> createTournament(@RequestBody CreateTournamentDTO dto,
                                              Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "success", false,
                            "message", "Необходимо авторизоваться"
                    ));
        }

        try {
            TournamentFullDTO created = tournamentService.createTournament(dto, authentication.getName());
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of(
                            "success", true,
                            "message", "Турнир успешно создан",
                            "tournament", created
                    ));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of(
                            "success", false,
                            "message", e.getMessage()
                    ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "success", false,
                            "message", e.getMessage()
                    ));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateTournament(@PathVariable Long id,
                                              @RequestBody UpdateTournamentDTO dto,
                                              Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "success", false,
                            "message", "Необходимо авторизоваться"
                    ));
        }

        try {
            TournamentFullDTO updated = tournamentService.updateTournament(id, dto, authentication.getName());
            return ResponseEntity.ok(
                    Map.of(
                            "success", true,
                            "message", "Турнир успешно обновлён",
                            "tournament", updated
                    )
            );
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of(
                            "success", false,
                            "message", e.getMessage()
                    ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "success", false,
                            "message", e.getMessage()
                    ));
        }
    }

    @PostMapping("/join/solo")
    public ResponseEntity<?> joinSoloTournament(@RequestBody JoinSoloTournamentDTO dto,
                                                Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Необходимо авторизоваться"));
        }
        try {
            tournamentService.joinSoloTournament(dto, authentication.getName());
            return ResponseEntity.ok(Map.of("success", true, "message", "Вы успешно зарегистрированы на турнир"));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("success", false, "message", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/join/team")
    public ResponseEntity<?> joinTeamTournament(@RequestBody JoinTeamTournamentDTO dto,
                                                Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Необходимо авторизоваться"));
        }
        try {
            tournamentService.joinTeamTournament(dto, authentication.getName());
            return ResponseEntity.ok(Map.of("success", true, "message", "Команда успешно зарегистрирована на турнир"));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("success", false, "message", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/open-registration")
    public ResponseEntity<?> openRegistration(@PathVariable Long id, Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Необходимо авторизоваться"));
        }

        try {
            TournamentFullDTO updated = tournamentService.openRegistration(id, authentication.getName());
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Регистрация на турнир открыта",
                    "tournament", updated
            ));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("success", false, "message", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/start")
    public ResponseEntity<?> startTournament(@PathVariable Long id, Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Необходимо авторизоваться"));
        }
        try {
            TournamentFullDTO updated = tournamentService.startTournament(id, authentication.getName());
            return ResponseEntity.ok(Map.of("success", true, "message", "Турнир переведён в статус IN_PROGRESS", "tournament", updated));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("success", false, "message", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<?> cancelTournament(@PathVariable Long id, Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Необходимо авторизоваться"));
        }

        try {
            TournamentFullDTO updated = tournamentService.cancelTournament(id, authentication.getName());
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Турнир отменён",
                    "tournament", updated
            ));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("success", false, "message", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/finish")
    public ResponseEntity<?> finishTournament(@PathVariable Long id, Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Необходимо авторизоваться"));
        }

        try {
            TournamentFullDTO updated = tournamentService.finishTournament(id, authentication.getName());
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Турнир завершён",
                    "tournament", updated
            ));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("success", false, "message", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}