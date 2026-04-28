package com.kosmo.tournament.gametype.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kosmo.tournament.gametype.dto.CreateGameTypeDTO;
import com.kosmo.tournament.gametype.dto.GameTypeDTO;
import com.kosmo.tournament.gametype.dto.UpdateGameTypeDTO;
import com.kosmo.tournament.gametype.service.GameTypeService;

@RestController
@RequestMapping({"/api/gametypes", "/api/game-types"})
public class GameTypeApiController {

    private final GameTypeService gameTypeService;

    public GameTypeApiController(GameTypeService gameTypeService) {
        this.gameTypeService = gameTypeService;
    }

    @GetMapping
    public List<GameTypeDTO> getAllGameTypes() {
        return gameTypeService.getAllGameTypes();
    }

    @GetMapping("/active")
    public List<GameTypeDTO> getActiveGameTypes() {
        return gameTypeService.getActiveGameTypes();
    }

    @GetMapping("/{id}")
    public GameTypeDTO getGameTypeById(@PathVariable Long id) {
        return gameTypeService.getGameTypeById(id);
    }

    @PostMapping
    public ResponseEntity<?> createGameType(@RequestBody CreateGameTypeDTO dto,
                                            Authentication authentication) {
        if (!isAdmin(authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "message", "Только ADMIN может создавать типы игр"));
        }

        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "success", true,
                    "message", "Тип игры создан",
                    "gameType", gameTypeService.createGameType(dto)
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateGameType(@PathVariable Long id,
                                            @RequestBody UpdateGameTypeDTO dto,
                                            Authentication authentication) {
        if (!isAdmin(authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "message", "Только ADMIN может редактировать типы игр"));
        }

        try {
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Тип игры обновлён",
                    "gameType", gameTypeService.updateGameType(id, dto)
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/activate")
    public ResponseEntity<?> activate(@PathVariable Long id, Authentication authentication) {
        if (!isAdmin(authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "message", "Только ADMIN может активировать типы игр"));
        }

        try {
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Тип игры активирован",
                    "gameType", gameTypeService.activateGameType(id)
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/deactivate")
    public ResponseEntity<?> deactivate(@PathVariable Long id, Authentication authentication) {
        if (!isAdmin(authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "message", "Только ADMIN может деактивировать типы игр"));
        }

        try {
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Тип игры деактивирован",
                    "gameType", gameTypeService.deactivateGameType(id)
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    private boolean isAdmin(Authentication authentication) {
        return authentication != null
                && authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
    }
}