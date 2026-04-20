package com.kosmo.tournament.tournament.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kosmo.tournament.gametype.entity.GameType;
import com.kosmo.tournament.gametype.repository.GameTypeRepository;
import com.kosmo.tournament.tournament.dto.CreateTournamentDTO;
import com.kosmo.tournament.tournament.dto.TournamentFullDTO;
import com.kosmo.tournament.tournament.dto.TournamentShortDTO;
import com.kosmo.tournament.tournament.dto.UpdateTournamentDTO;
import com.kosmo.tournament.tournament.entity.Tournament;
import com.kosmo.tournament.tournament.repository.TournamentRepository;
import com.kosmo.tournament.user.entity.User;
import com.kosmo.tournament.user.repository.UserRepository;

@Service
public class TournamentService {

    private final TournamentRepository tournamentRepository;
    private final UserRepository userRepository;
    private final GameTypeRepository gameTypeRepository;

    public TournamentService(TournamentRepository tournamentRepository,
                             UserRepository userRepository,
                             GameTypeRepository gameTypeRepository) {
        this.tournamentRepository = tournamentRepository;
        this.userRepository = userRepository;
        this.gameTypeRepository = gameTypeRepository;
    }

    public List<TournamentShortDTO> getAllTournaments() {
        return tournamentRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toShortDTO)
                .toList();
    }

    public TournamentFullDTO getTournamentById(Long id, String currentUsername) {
        Tournament tournament = tournamentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tournament not found"));

        boolean owner = currentUsername != null
                && tournament.getOrganizer() != null
                && currentUsername.equals(tournament.getOrganizer().getUsername());

        return toFullDTO(tournament, owner);
    }

    public List<TournamentShortDTO> getMyTournaments(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return tournamentRepository.findByOrganizerId(user.getId())
                .stream()
                .map(this::toShortDTO)
                .toList();
    }

    public List<TournamentShortDTO> getTournamentsByStatus(String status) {
        return tournamentRepository.findByStatus(status.toUpperCase())
                .stream()
                .map(this::toShortDTO)
                .toList();
    }

    public List<TournamentShortDTO> getTournamentsByGameType(Long gameTypeId) {
        return tournamentRepository.findByGameTypeId(gameTypeId)
                .stream()
                .map(this::toShortDTO)
                .toList();
    }

    public List<TournamentShortDTO> searchByTitle(String title) {
        return tournamentRepository.findByTitleContainingIgnoreCase(title)
                .stream()
                .map(this::toShortDTO)
                .toList();
    }

    @Transactional
    public TournamentFullDTO createTournament(CreateTournamentDTO dfh, String username) {
        validateCreateTournament(dfh);

        User organizer = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        GameType gameType = gameTypeRepository.findById(dfh.getGameTypeId())
                .orElseThrow(() -> new RuntimeException("Game type not found"));

        if (tournamentRepository.existsByTitle(dfh.getTitle())) {
            throw new RuntimeException("Tournament title already exists");
        }

        Tournament tournament = new Tournament();
        tournament.setTitle(dfh.getTitle());
        tournament.setDescription(dfh.getDescription());
        tournament.setParticipantType(normalizeParticipantType(dfh.getParticipantType()));
        tournament.setAccess(normalizeAccess(dfh.getAccess()));
        tournament.setStatus(normalizeStatus(dfh.getStatus()));
        tournament.setGameType(gameType);
        tournament.setOrganizer(organizer);
        tournament.setStartDate(dfh.getStartDate());
        tournament.setRegistrationDeadline(dfh.getRegistrationDeadline());
        tournament.setMaxParticipants(dfh.getMaxParticipants());
        tournament.setImageUrl(dfh.getImageUrl());

        Tournament saved = tournamentRepository.save(tournament);

        return toFullDTO(saved, true);
    }

    private void validateCreateTournament(CreateTournamentDTO dfh) {
        if (dfh.getTitle() == null || dfh.getTitle().isBlank()) {
            throw new RuntimeException("Title is required");
        }
        if (dfh.getDescription() == null || dfh.getDescription().isBlank()) {
            throw new RuntimeException("Description is required");
        }
        if (dfh.getGameTypeId() == null) {
            throw new RuntimeException("Game type is required");
        }
        if (dfh.getStartDate() == null) {
            throw new RuntimeException("Start date is required");
        }
        if (dfh.getRegistrationDeadline() != null
                && dfh.getRegistrationDeadline().isAfter(dfh.getStartDate())) {
            throw new RuntimeException("Registration deadline must be before start date");
        }
        if (dfh.getMaxParticipants() != null && dfh.getMaxParticipants() < 2) {
            throw new RuntimeException("Max participants must be at least 2");
        }
    }

    private String normalizeParticipantType(String value) {
        if (value == null || value.isBlank()) return "SOLO";
        return value.toUpperCase();
    }

    private String normalizeAccess(String value) {
        if (value == null || value.isBlank()) return "OPEN";
        return value.toUpperCase();
    }

    private String normalizeStatus(String value) {
        if (value == null || value.isBlank()) return "DRAFT";
        return value.toUpperCase();
    }

    private TournamentShortDTO toShortDTO(Tournament tournament) {
        TournamentShortDTO dfh = new TournamentShortDTO();
        dfh.setId(tournament.getId());
        dfh.setTitle(tournament.getTitle());
        dfh.setStatus(tournament.getStatus());
        dfh.setParticipantType(tournament.getParticipantType());
        dfh.setGameName(tournament.getGameType() != null ? tournament.getGameType().getName() : null);
        dfh.setOrganizerUsername(tournament.getOrganizer() != null ? tournament.getOrganizer().getUsername() : null);
        dfh.setImageUrl(tournament.getImageUrl());
        return dfh;
    }

    private TournamentFullDTO toFullDTO(Tournament tournament, boolean owner) {
        TournamentFullDTO dfh = new TournamentFullDTO();
        dfh.setId(tournament.getId());
        dfh.setTitle(tournament.getTitle());
        dfh.setDescription(tournament.getDescription());
        dfh.setParticipantType(tournament.getParticipantType());
        dfh.setAccess(tournament.getAccess());
        dfh.setStatus(tournament.getStatus());
        dfh.setGameName(tournament.getGameType() != null ? tournament.getGameType().getName() : null);
        dfh.setGameCode(tournament.getGameType() != null ? tournament.getGameType().getCode() : null);
        dfh.setOrganizerUsername(tournament.getOrganizer() != null ? tournament.getOrganizer().getUsername() : null);
        dfh.setStartDate(tournament.getStartDate());
        dfh.setRegistrationDeadline(tournament.getRegistrationDeadline());
        dfh.setMaxParticipants(tournament.getMaxParticipants());
        dfh.setCreatedAt(tournament.getCreatedAt());
        dfh.setImageUrl(tournament.getImageUrl());
        dfh.setOwner(owner);
        return dfh;
    }
    
    @Transactional
    public TournamentFullDTO updateTournament(Long tournamentId,
                                            UpdateTournamentDTO dto,
                                            String currentUsername) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("Tournament not found"));

        if (currentUsername == null
                || tournament.getOrganizer() == null
                || !currentUsername.equals(tournament.getOrganizer().getUsername())) {
            throw new RuntimeException("Only tournament organizer can update tournament");
        }

        if (dto.getTitle() != null && !dto.getTitle().isBlank()) {
            if (!dto.getTitle().equals(tournament.getTitle())
                    && tournamentRepository.existsByTitle(dto.getTitle())) {
                throw new RuntimeException("Tournament title already exists");
            }
            tournament.setTitle(dto.getTitle());
        }

        if (dto.getDescription() != null && !dto.getDescription().isBlank()) {
            tournament.setDescription(dto.getDescription());
        }

        if (dto.getParticipantType() != null && !dto.getParticipantType().isBlank()) {
            tournament.setParticipantType(dto.getParticipantType().toUpperCase());
        }

        if (dto.getAccess() != null && !dto.getAccess().isBlank()) {
            tournament.setAccess(dto.getAccess().toUpperCase());
        }

        if (dto.getStatus() != null && !dto.getStatus().isBlank()) {
            tournament.setStatus(dto.getStatus().toUpperCase());
        }

        if (dto.getGameTypeId() != null) {
            GameType gameType = gameTypeRepository.findById(dto.getGameTypeId())
                    .orElseThrow(() -> new RuntimeException("Game type not found"));
            tournament.setGameType(gameType);
        }

        if (dto.getStartDate() != null) {
            tournament.setStartDate(dto.getStartDate());
        }

        if (dto.getRegistrationDeadline() != null) {
            tournament.setRegistrationDeadline(dto.getRegistrationDeadline());
        }

        if (dto.getMaxParticipants() != null) {
            if (dto.getMaxParticipants() < 2) {
                throw new RuntimeException("Max participants must be at least 2");
            }
            tournament.setMaxParticipants(dto.getMaxParticipants());
        }

        if (dto.getMinParticipants() != null) {
            if (dto.getMinParticipants() < 2) {
                throw new RuntimeException("Min participants must be at least 2");
            }
            tournament.setMinParticipants(dto.getMinParticipants());
        }

        Integer min = tournament.getMinParticipants();
        Integer max = tournament.getMaxParticipants();

        if (min != null && max != null && min > max) {
            throw new RuntimeException("Min participants cannot be greater than max participants");
        }

        if (tournament.getRegistrationDeadline() != null
                && tournament.getStartDate() != null
                && tournament.getRegistrationDeadline().isAfter(tournament.getStartDate())) {
            throw new RuntimeException("Registration deadline must be before start date");
        }

        if (dto.getImageUrl() != null) {
            tournament.setImageUrl(dto.getImageUrl());
        }

        Tournament saved = tournamentRepository.save(tournament);
        return toFullDTO(saved, true);
    }
}