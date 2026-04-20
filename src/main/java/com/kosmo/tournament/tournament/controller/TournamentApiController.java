package com.kosmo.tournament.tournament.controller;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.PutMapping;
import com.kosmo.tournament.tournament.dto.UpdateTournamentDTO;
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

import com.kosmo.tournament.tournament.dto.CreateTournamentDTO;
import com.kosmo.tournament.tournament.dto.TournamentFullDTO;
import com.kosmo.tournament.tournament.dto.TournamentShortDTO;
import com.kosmo.tournament.tournament.service.TournamentService;

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
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "success", false,
                            "message", e.getMessage()
                    ));
        }
    }
}