package com.kosmo.tournament.gametype.controller;

import java.util.List;

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
@RequestMapping("/api/gametypes")
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
    public GameTypeDTO createGameType(@RequestBody CreateGameTypeDTO dfh) {
        return gameTypeService.createGameType(dfh);
    }

    @PutMapping("/{id}")
    public GameTypeDTO updateGameType(@PathVariable Long id,
                                      @RequestBody UpdateGameTypeDTO dfh) {
        return gameTypeService.updateGameType(id, dfh);
    }

    @PostMapping("/{id}/activate")
    public GameTypeDTO activate(@PathVariable Long id) {
        return gameTypeService.activateGameType(id);
    }

    @PostMapping("/{id}/deactivate")
    public GameTypeDTO deactivate(@PathVariable Long id) {
        return gameTypeService.deactivateGameType(id);
    }
}