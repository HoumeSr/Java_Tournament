package com.kosmo.tournament.gametype.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kosmo.tournament.gametype.dfh.CreateGameTypeDFH;
import com.kosmo.tournament.gametype.dfh.GameTypeDFH;
import com.kosmo.tournament.gametype.dfh.UpdateGameTypeDFH;
import com.kosmo.tournament.gametype.service.GameTypeService;

@RestController
@RequestMapping("/api/gametypes")
public class GameTypeApiController {

    private final GameTypeService gameTypeService;

    public GameTypeApiController(GameTypeService gameTypeService) {
        this.gameTypeService = gameTypeService;
    }

    @GetMapping
    public List<GameTypeDFH> getAllGameTypes() {
        return gameTypeService.getAllGameTypes();
    }

    @GetMapping("/active")
    public List<GameTypeDFH> getActiveGameTypes() {
        return gameTypeService.getActiveGameTypes();
    }

    @GetMapping("/{id}")
    public GameTypeDFH getGameTypeById(@PathVariable Long id) {
        return gameTypeService.getGameTypeById(id);
    }

    @PostMapping
    public GameTypeDFH createGameType(@RequestBody CreateGameTypeDFH dfh) {
        return gameTypeService.createGameType(dfh);
    }

    @PutMapping("/{id}")
    public GameTypeDFH updateGameType(@PathVariable Long id,
                                      @RequestBody UpdateGameTypeDFH dfh) {
        return gameTypeService.updateGameType(id, dfh);
    }

    @PostMapping("/{id}/activate")
    public GameTypeDFH activate(@PathVariable Long id) {
        return gameTypeService.activateGameType(id);
    }

    @PostMapping("/{id}/deactivate")
    public GameTypeDFH deactivate(@PathVariable Long id) {
        return gameTypeService.deactivateGameType(id);
    }
}