package com.kosmo.tournament.gametype.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kosmo.tournament.gametype.dto.CreateGameTypeDTO;
import com.kosmo.tournament.gametype.dto.GameTypeDTO;
import com.kosmo.tournament.gametype.dto.UpdateGameTypeDTO;
import com.kosmo.tournament.gametype.entity.GameType;
import com.kosmo.tournament.gametype.repository.GameTypeRepository;

@Service
public class GameTypeService {

    private final GameTypeRepository gameTypeRepository;

    public GameTypeService(GameTypeRepository gameTypeRepository) {
        this.gameTypeRepository = gameTypeRepository;
    }

    public List<GameTypeDTO> getAllGameTypes() {
        return gameTypeRepository.findAll()
                .stream()
                .map(this::toDTO)
                .toList();
    }

    public List<GameTypeDTO> getActiveGameTypes() {
        return gameTypeRepository.findByIsActiveTrue()
                .stream()
                .map(this::toDTO)
                .toList();
    }

    public GameTypeDTO getGameTypeById(Long id) {
        GameType gameType = gameTypeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Game type not found"));

        return toDTO(gameType);
    }

    @Transactional
    public GameTypeDTO createGameType(CreateGameTypeDTO dfh) {
        validateCreate(dfh);

        if (gameTypeRepository.existsByCode(dfh.getCode())) {
            throw new RuntimeException("Game type with this code already exists");
        }

        GameType gameType = new GameType();
        gameType.setName(dfh.getName());
        gameType.setCode(dfh.getCode().toUpperCase());
        gameType.setDescription(dfh.getDescription());
        gameType.setIsActive(dfh.getIsActive());
        gameType.setImageUrl(dfh.getImageUrl());
        gameType.setMaxPlayers(dfh.getMaxPlayers());

        GameType saved = gameTypeRepository.save(gameType);
        return toDTO(saved);
    }

    @Transactional
    public GameTypeDTO updateGameType(Long id, UpdateGameTypeDTO dfh) {
        GameType gameType = gameTypeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Game type not found"));

        if (dfh.getName() != null && !dfh.getName().isBlank()) {
            gameType.setName(dfh.getName());
        }

        if (dfh.getDescription() != null) {
            gameType.setDescription(dfh.getDescription());
        }

        if (dfh.getIsActive() != null) {
            gameType.setIsActive(dfh.getIsActive());
        }

        if (dfh.getImageUrl() != null) {
            gameType.setImageUrl(dfh.getImageUrl());
        }

        if (dfh.getMaxPlayers() != null) {
            if (dfh.getMaxPlayers() < 1) {
                throw new RuntimeException("maxPlayers must be at least 1");
            }
            gameType.setMaxPlayers(dfh.getMaxPlayers());
        }

        GameType saved = gameTypeRepository.save(gameType);
        return toDTO(saved);
    }

    @Transactional
    public GameTypeDTO activateGameType(Long id) {
        GameType gameType = gameTypeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Game type not found"));

        gameType.setIsActive(true);
        return toDTO(gameTypeRepository.save(gameType));
    }

    @Transactional
    public GameTypeDTO deactivateGameType(Long id) {
        GameType gameType = gameTypeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Game type not found"));

        gameType.setIsActive(false);
        return toDTO(gameTypeRepository.save(gameType));
    }

    private void validateCreate(CreateGameTypeDTO dfh) {
        if (dfh.getName() == null || dfh.getName().isBlank()) {
            throw new RuntimeException("Game name is required");
        }
        if (dfh.getCode() == null || dfh.getCode().isBlank()) {
            throw new RuntimeException("Game code is required");
        }
        if (dfh.getMaxPlayers() != null && dfh.getMaxPlayers() < 1) {
            throw new RuntimeException("maxPlayers must be at least 1");
        }
    }

    private GameTypeDTO toDTO(GameType gameType) {
        GameTypeDTO dfh = new GameTypeDTO();
        dfh.setId(gameType.getId());
        dfh.setName(gameType.getName());
        dfh.setCode(gameType.getCode());
        dfh.setDescription(gameType.getDescription());
        dfh.setIsActive(gameType.getIsActive());
        dfh.setImageUrl(gameType.getImageUrl());
        dfh.setMaxPlayers(gameType.getMaxPlayers());
        return dfh;
    }
}