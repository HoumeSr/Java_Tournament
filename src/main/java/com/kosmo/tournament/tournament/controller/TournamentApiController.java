package com.kosmo.tournament.tournament.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.kosmo.tournament.tournament.dfh.CreateTournamentDFH;
import com.kosmo.tournament.tournament.dfh.TournamentFullDFH;
import com.kosmo.tournament.tournament.dfh.TournamentShortDFH;
import com.kosmo.tournament.tournament.service.TournamentService;

@RestController
@RequestMapping("/api/tournaments")
public class TournamentApiController {

    private final TournamentService tournamentService;

    public TournamentApiController(TournamentService tournamentService) {
        this.tournamentService = tournamentService;
    }

    /**
     * GET /api/tournaments - список всех турниров (TournamentShortDFH)
     */
    @GetMapping
    public List<TournamentShortDFH> getAllTournaments() {
        return tournamentService.getAllTournaments();
    }

    /**
     * GET /api/tournaments/{id} - полная информация о турнире (TournamentFullDFH)
     */
    @GetMapping("/{id}")
    public TournamentFullDFH getTournament(@PathVariable Long id, Authentication authentication) {
        String currentUsername = authentication != null ? authentication.getName() : null;
        return tournamentService.getTournamentById(id, currentUsername);
    }

    /**
     * GET /api/tournaments/my - мои турниры (как организатор)
     */
    @GetMapping("/my")
    public List<TournamentShortDFH> getMyTournaments(Authentication authentication) {
        if (authentication == null) {
            return List.of();
        }
        return tournamentService.getMyTournaments(authentication.getName());
    }

    /**
     * GET /api/tournaments/status/{status} - турниры по статусу
     */
    @GetMapping("/status/{status}")
    public List<TournamentShortDFH> getTournamentsByStatus(@PathVariable String status) {
        return tournamentService.getTournamentsByStatus(status);
    }

    /**
     * GET /api/tournaments/gametype/{gameTypeId} - турниры по типу игры
     */
    @GetMapping("/gametype/{gameTypeId}")
    public List<TournamentShortDFH> getTournamentsByGameType(@PathVariable Long gameTypeId) {
        return tournamentService.getTournamentsByGameType(gameTypeId);
    }

    /**
     * GET /api/tournaments/search - поиск по названию
     */
    @GetMapping("/search")
    public List<TournamentShortDFH> searchTournaments(@RequestParam String title) {
        return tournamentService.searchByTitle(title);
    }

    /**
     * POST /api/tournaments - создание турнира (принимает CreateTournamentDFH)
     */
    @PostMapping
    public ResponseEntity<?> createTournament(@RequestBody CreateTournamentDFH createDFH, 
                                               Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Необходимо авторизоваться"));
        }

        try {
            TournamentFullDFH created = tournamentService.createTournament(createDFH, authentication.getName());
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of("success", true, "tournament", created, "message", "Турнир успешно создан"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}