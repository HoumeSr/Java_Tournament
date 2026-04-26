package com.kosmo.tournament.tournament.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kosmo.tournament.gametype.entity.GameType;
import com.kosmo.tournament.gametype.repository.GameTypeRepository;
import com.kosmo.tournament.match.entity.MatchSolo;
import com.kosmo.tournament.match.entity.MatchTeam;
import com.kosmo.tournament.match.repository.MatchSoloRepository;
import com.kosmo.tournament.match.repository.MatchTeamRepository;
import com.kosmo.tournament.team.dto.TeamShortDTO;
import com.kosmo.tournament.team.entity.Team;
import com.kosmo.tournament.team.entity.TeamMember;
import com.kosmo.tournament.team.repository.TeamMemberRepository;
import com.kosmo.tournament.team.repository.TeamRepository;
import com.kosmo.tournament.tournament.dto.CreateTournamentDTO;
import com.kosmo.tournament.tournament.dto.JoinSoloTournamentDTO;
import com.kosmo.tournament.tournament.dto.JoinTeamTournamentDTO;
import com.kosmo.tournament.tournament.dto.TournamentFullDTO;
import com.kosmo.tournament.tournament.dto.TournamentShortDTO;
import com.kosmo.tournament.tournament.dto.UpdateTournamentDTO;
import com.kosmo.tournament.tournament.entity.Tournament;
import com.kosmo.tournament.tournament.entity.TournamentSoloParticipant;
import com.kosmo.tournament.tournament.entity.TournamentTeamParticipant;
import com.kosmo.tournament.tournament.repository.TournamentRepository;
import com.kosmo.tournament.tournament.repository.TournamentSoloParticipantRepository;
import com.kosmo.tournament.tournament.repository.TournamentTeamParticipantRepository;
import com.kosmo.tournament.user.entity.User;
import com.kosmo.tournament.user.repository.UserRepository;

@Service
public class TournamentService {

    private final TournamentRepository tournamentRepository;
    private final UserRepository userRepository;
    private final GameTypeRepository gameTypeRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final TournamentSoloParticipantRepository soloParticipantRepository;
    private final TournamentTeamParticipantRepository teamParticipantRepository;
    private final MatchSoloRepository matchSoloRepository;
    private final MatchTeamRepository matchTeamRepository;

    public TournamentService(TournamentRepository tournamentRepository,
                             UserRepository userRepository,
                             GameTypeRepository gameTypeRepository,
                             TeamRepository teamRepository,
                             TeamMemberRepository teamMemberRepository,
                             TournamentSoloParticipantRepository soloParticipantRepository,
                             TournamentTeamParticipantRepository teamParticipantRepository,
                             MatchSoloRepository matchSoloRepository,
                             MatchTeamRepository matchTeamRepository) {
        this.tournamentRepository = tournamentRepository;
        this.userRepository = userRepository;
        this.gameTypeRepository = gameTypeRepository;
        this.teamRepository = teamRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.soloParticipantRepository = soloParticipantRepository;
        this.teamParticipantRepository = teamParticipantRepository;
        this.matchSoloRepository = matchSoloRepository;
        this.matchTeamRepository = matchTeamRepository;
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

    public List<TeamShortDTO> getMyEligibleTeams(Long tournamentId, String username) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("Tournament not found"));

        if (!"TEAM".equalsIgnoreCase(tournament.getParticipantType())) {
            throw new RuntimeException("Tournament is not team-based");
        }

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return teamMemberRepository.findByPlayerId(user.getId())
                .stream()
                .map(TeamMember::getTeam)
                .distinct()
                .filter(team -> team.getGameType() != null
                        && tournament.getGameType() != null
                        && team.getGameType().getId().equals(tournament.getGameType().getId()))
                .filter(team -> team.getCaptain() != null && team.getCaptain().getId().equals(user.getId()))
                .filter(team -> !teamParticipantRepository.existsByTournamentIdAndTeamId(tournamentId, team.getId()))
                .filter(this::isTeamFull)
                .map(this::toTeamShortDTO)
                .toList();
    }

    @Transactional
    public TournamentFullDTO createTournament(CreateTournamentDTO dto, String username) {
        validateCreateTournament(dto);

        User organizer = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        GameType gameType = gameTypeRepository.findById(dto.getGameTypeId())
                .orElseThrow(() -> new RuntimeException("Game type not found"));

        if (tournamentRepository.existsByTitle(dto.getTitle())) {
            throw new RuntimeException("Tournament title already exists");
        }

        Tournament tournament = new Tournament();
        tournament.setTitle(dto.getTitle());
        tournament.setDescription(dto.getDescription());
        tournament.setParticipantType(normalizeParticipantType(dto.getParticipantType()));
        tournament.setAccess(normalizeAccess(dto.getAccess()));
        tournament.setStatus(normalizeStatus(dto.getStatus()));
        tournament.setGameType(gameType);
        tournament.setOrganizer(organizer);
        tournament.setStartDate(dto.getStartDate());
        tournament.setRegistrationDeadline(dto.getRegistrationDeadline());
        tournament.setMaxParticipants(dto.getMaxParticipants());
        tournament.setMinParticipants(dto.getMinParticipants());
        tournament.setImageUrl(dto.getImageUrl());

        Tournament saved = tournamentRepository.save(tournament);
        return toFullDTO(saved, true);
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

    @Transactional
    public TournamentFullDTO openRegistration(Long tournamentId, String currentUsername) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("Tournament not found"));
        
        if (currentUsername == null
                || tournament.getOrganizer() == null
                || !currentUsername.equals(tournament.getOrganizer().getUsername())) {
            throw new RuntimeException("Only tournament organizer can open registration");
        }
        
        if (!"DRAFT".equalsIgnoreCase(tournament.getStatus())) {
            throw new RuntimeException("Tournament must be in DRAFT status to open registration");
        }
        
        tournament.setStatus("REGISTRATION_OPEN");
        Tournament saved = tournamentRepository.save(tournament);
        return toFullDTO(saved, true);
    }

    @Transactional
    public void joinSoloTournament(JoinSoloTournamentDTO dto, String username) {
        Tournament tournament = tournamentRepository.findById(dto.getTournamentId())
                .orElseThrow(() -> new RuntimeException("Tournament not found"));

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        validateTournamentJoinCommon(tournament);

        if (!"SOLO".equalsIgnoreCase(tournament.getParticipantType())) {
            throw new RuntimeException("This tournament is not solo");
        }

        if (soloParticipantRepository.existsByTournamentIdAndPlayerId(tournament.getId(), user.getId())) {
            throw new RuntimeException("User already joined this tournament");
        }

        long currentCount = soloParticipantRepository.countByTournamentId(tournament.getId());
        if (tournament.getMaxParticipants() != null && currentCount >= tournament.getMaxParticipants()) {
            throw new RuntimeException("Tournament is full");
        }

        TournamentSoloParticipant participant = new TournamentSoloParticipant();
        participant.setTournament(tournament);
        participant.setPlayer(user);
        participant.setStatus("REGISTERED");
        participant.setSeed((int) currentCount + 1);
        participant.setParallel(0);
        soloParticipantRepository.save(participant);
    }

    public boolean isUserRegistered(Long tournamentId, String username) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("Tournament not found"));
        
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if ("SOLO".equalsIgnoreCase(tournament.getParticipantType())) {
            return soloParticipantRepository.existsByTournamentIdAndPlayerId(tournamentId, user.getId());
        } else if ("TEAM".equalsIgnoreCase(tournament.getParticipantType())) {
            // Проверяем, зарегистрирована ли любая команда пользователя
            List<Team> userTeams = teamMemberRepository.findByPlayerId(user.getId())
                    .stream()
                    .map(TeamMember::getTeam)
                    .toList();
            
            for (Team team : userTeams) {
                if (teamParticipantRepository.existsByTournamentIdAndTeamId(tournamentId, team.getId())) {
                    return true;
                }
            }
        }
        
        return false;
    }

    public int getParticipantsCount(Long tournamentId) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("Tournament not found"));
        
        if ("SOLO".equalsIgnoreCase(tournament.getParticipantType())) {
            return (int) soloParticipantRepository.countByTournamentId(tournamentId);
        } else {
            return (int) teamParticipantRepository.countByTournamentId(tournamentId);
        }
    }

    public List<?> getTournamentParticipants(Long tournamentId, String currentUsername) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("Tournament not found"));
        
        // Проверяем права: только организатор может видеть участников
        boolean isOwner = currentUsername != null 
                && tournament.getOrganizer() != null 
                && currentUsername.equals(tournament.getOrganizer().getUsername());
        
        if (!isOwner && !"IN_PROGRESS".equalsIgnoreCase(tournament.getStatus()) 
                && !"COMPLETED".equalsIgnoreCase(tournament.getStatus())) {
            throw new RuntimeException("Participants list is only available to tournament organizer before tournament starts");
        }
        
        if ("SOLO".equalsIgnoreCase(tournament.getParticipantType())) {
            List<TournamentSoloParticipant> participants = soloParticipantRepository
                    .findByTournamentIdOrderBySeedAsc(tournamentId);
            
            return participants.stream()
                    .map(p -> {
                        Map<String, Object> dto = new HashMap<>();
                        dto.put("id", p.getId());
                        dto.put("playerId", p.getPlayer().getId());
                        dto.put("playerUsername", p.getPlayer().getUsername());
                        dto.put("playerImageUrl", p.getPlayer().getImageUrl());
                        dto.put("seed", p.getSeed());
                        dto.put("status", p.getStatus());
                        return dto;
                    })
                    .toList();
        } else {
            List<TournamentTeamParticipant> participants = teamParticipantRepository
                    .findByTournamentIdOrderBySeedAsc(tournamentId);
            
            return participants.stream()
                    .map(p -> {
                        Map<String, Object> dto = new HashMap<>();
                        dto.put("id", p.getId());
                        dto.put("teamId", p.getTeam().getId());
                        dto.put("teamName", p.getTeam().getName());
                        dto.put("teamImageUrl", p.getTeam().getImageUrl());
                        dto.put("captainUsername", p.getTeam().getCaptain() != null ? p.getTeam().getCaptain().getUsername() : null);
                        dto.put("seed", p.getSeed());
                        dto.put("status", p.getStatus());
                        return dto;
                    })
                    .toList();
        }
    }

    @Transactional
    public void joinTeamTournament(JoinTeamTournamentDTO dto, String username) {
        Tournament tournament = tournamentRepository.findById(dto.getTournamentId())
                .orElseThrow(() -> new RuntimeException("Tournament not found"));

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Team team = teamRepository.findById(dto.getTeamId())
                .orElseThrow(() -> new RuntimeException("Team not found"));

        validateTournamentJoinCommon(tournament);

        if (!"TEAM".equalsIgnoreCase(tournament.getParticipantType())) {
            throw new RuntimeException("This tournament is not team-based");
        }

        if (team.getCaptain() == null || !team.getCaptain().getId().equals(user.getId())) {
            throw new RuntimeException("Only team captain can register team in tournament");
        }

        if (team.getGameType() == null || tournament.getGameType() == null
                || !team.getGameType().getId().equals(tournament.getGameType().getId())) {
            throw new RuntimeException("Team game type does not match tournament game type");
        }

        if (!isTeamFull(team)) {
            throw new RuntimeException("Team is not full");
        }

        if (teamParticipantRepository.existsByTournamentIdAndTeamId(tournament.getId(), team.getId())) {
            throw new RuntimeException("Team already joined this tournament");
        }

        long currentCount = teamParticipantRepository.countByTournamentId(tournament.getId());
        if (tournament.getMaxParticipants() != null && currentCount >= tournament.getMaxParticipants()) {
            throw new RuntimeException("Tournament is full");
        }

        TournamentTeamParticipant participant = new TournamentTeamParticipant();
        participant.setTournament(tournament);
        participant.setTeam(team);
        participant.setStatus("REGISTERED");
        participant.setSeed((int) currentCount + 1);
        participant.setParallel(0);
        teamParticipantRepository.save(participant);
    }

    @Transactional
    public TournamentFullDTO startTournament(Long tournamentId, String currentUsername) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("Tournament not found"));

        if (currentUsername == null
                || tournament.getOrganizer() == null
                || !currentUsername.equals(tournament.getOrganizer().getUsername())) {
            throw new RuntimeException("Only tournament organizer can start tournament");
        }

        if (!"REGISTRATION_OPEN".equalsIgnoreCase(tournament.getStatus())) {
            throw new RuntimeException("Tournament cannot be started");
        }

    

        if ("SOLO".equalsIgnoreCase(tournament.getParticipantType()) && !matchSoloRepository.findByTournamentId(tournamentId).isEmpty()) {
            throw new RuntimeException("Tournament bracket has already been generated");
        }
        if ("TEAM".equalsIgnoreCase(tournament.getParticipantType()) && !matchTeamRepository.findByTournamentId(tournamentId).isEmpty()) {
            throw new RuntimeException("Tournament bracket has already been generated");
        }

        if ("SOLO".equalsIgnoreCase(tournament.getParticipantType())) {
            startSoloTournament(tournament);
        } else {
            startTeamTournament(tournament);
        }

        tournament.setStatus("IN_PROGRESS");
        Tournament saved = tournamentRepository.save(tournament);
        return toFullDTO(saved, true);
    }

    private void startSoloTournament(Tournament tournament) {
        List<TournamentSoloParticipant> participants = soloParticipantRepository.findByTournamentIdOrderBySeedAsc(tournament.getId());
        validateParticipantsForStart(tournament, participants.size());

        int actualCount = participants.size();
        int bracketSize = nextPowerOfTwo(actualCount);
        int firstRoundMatches = bracketSize / 2;
        int activeMatches = actualCount - bracketSize / 2;
        int byeMatches = firstRoundMatches - activeMatches;

        List<MatchSolo> matches = createSoloBracketSkeleton(tournament, bracketSize);
        MatchSolo[] firstRound = matches.subList(0, firstRoundMatches).toArray(new MatchSolo[0]);

        int pointer = 0;
        for (int i = 0; i < byeMatches; i++) {
            MatchSolo match = firstRound[i];
            User player = participants.get(pointer++).getPlayer();
            match.setPlayer1(player);
            match.setPlayer2(null);
            match.setWinnerPlayer(player);
            match.setStatus("FINISHED");
            match.setScheduledAt(tournament.getStartDate());
        }

        for (int i = byeMatches; i < firstRoundMatches; i++) {
            MatchSolo match = firstRound[i];
            User player1 = participants.get(pointer++).getPlayer();
            User player2 = participants.get(pointer++).getPlayer();
            match.setPlayer1(player1);
            match.setPlayer2(player2);
            match.setStatus("IN_PROGRESS");
            match.setScheduledAt(tournament.getStartDate());
        }

        matchSoloRepository.saveAll(matches);

        for (int i = 0; i < byeMatches; i++) {
            MatchSolo match = firstRound[i];
            propagateSoloWinner(match, match.getWinnerPlayer());
        }
    }

    private void startTeamTournament(Tournament tournament) {
        List<TournamentTeamParticipant> participants = teamParticipantRepository.findByTournamentIdOrderBySeedAsc(tournament.getId());
        validateParticipantsForStart(tournament, participants.size());

        int actualCount = participants.size();
        int bracketSize = nextPowerOfTwo(actualCount);
        int firstRoundMatches = bracketSize / 2;
        int activeMatches = actualCount - bracketSize / 2;
        int byeMatches = firstRoundMatches - activeMatches;

        List<MatchTeam> matches = createTeamBracketSkeleton(tournament, bracketSize);
        MatchTeam[] firstRound = matches.subList(0, firstRoundMatches).toArray(new MatchTeam[0]);

        int pointer = 0;
        for (int i = 0; i < byeMatches; i++) {
            MatchTeam match = firstRound[i];
            Team team = participants.get(pointer++).getTeam();
            match.setTeam1(team);
            match.setTeam2(null);
            match.setWinnerTeam(team);
            match.setStatus("FINISHED");
            match.setScheduledAt(tournament.getStartDate());
        }

        for (int i = byeMatches; i < firstRoundMatches; i++) {
            MatchTeam match = firstRound[i];
            Team team1 = participants.get(pointer++).getTeam();
            Team team2 = participants.get(pointer++).getTeam();
            match.setTeam1(team1);
            match.setTeam2(team2);
            match.setStatus("IN_PROGRESS");
            match.setScheduledAt(tournament.getStartDate());
        }

        matchTeamRepository.saveAll(matches);

        for (int i = 0; i < byeMatches; i++) {
            MatchTeam match = firstRound[i];
            propagateTeamWinner(match, match.getWinnerTeam());
        }
    }

    private List<MatchSolo> createSoloBracketSkeleton(Tournament tournament, int bracketSize) {
        int firstRoundMatches = bracketSize / 2;
        List<MatchSolo> allMatches = new ArrayList<>();

        int roundMatches = firstRoundMatches;
        int roundNumber = 1;
        while (roundMatches >= 1) {
            for (int i = 0; i < roundMatches; i++) {
                MatchSolo match = new MatchSolo();
                match.setTournament(tournament);
                match.setRoundNumber(roundNumber);
                match.setStatus("SCHEDULED");
                allMatches.add(match);
            }
            roundMatches /= 2;
            roundNumber++;
        }

        allMatches = matchSoloRepository.saveAll(allMatches);

        int offset = 0;
        int currentRoundCount = firstRoundMatches;
        while (currentRoundCount > 1) {
            int nextOffset = offset + currentRoundCount;
            for (int i = 0; i < currentRoundCount; i++) {
                MatchSolo current = allMatches.get(offset + i);
                MatchSolo next = allMatches.get(nextOffset + i / 2);
                current.setNextMatch(next);
            }
            offset += currentRoundCount;
            currentRoundCount /= 2;
        }

        return matchSoloRepository.saveAll(allMatches);
    }

    private List<MatchTeam> createTeamBracketSkeleton(Tournament tournament, int bracketSize) {
        int firstRoundMatches = bracketSize / 2;
        List<MatchTeam> allMatches = new ArrayList<>();

        int roundMatches = firstRoundMatches;
        int roundNumber = 1;
        while (roundMatches >= 1) {
            for (int i = 0; i < roundMatches; i++) {
                MatchTeam match = new MatchTeam();
                match.setTournament(tournament);
                match.setRoundNumber(roundNumber);
                match.setStatus("SCHEDULED");
                allMatches.add(match);
            }
            roundMatches /= 2;
            roundNumber++;
        }

        allMatches = matchTeamRepository.saveAll(allMatches);

        int offset = 0;
        int currentRoundCount = firstRoundMatches;
        while (currentRoundCount > 1) {
            int nextOffset = offset + currentRoundCount;
            for (int i = 0; i < currentRoundCount; i++) {
                MatchTeam current = allMatches.get(offset + i);
                MatchTeam next = allMatches.get(nextOffset + i / 2);
                current.setNextMatch(next);
            }
            offset += currentRoundCount;
            currentRoundCount /= 2;
        }

        return matchTeamRepository.saveAll(allMatches);
    }

    private void propagateSoloWinner(MatchSolo finishedMatch, User winner) {
        MatchSolo nextMatch = finishedMatch.getNextMatch();
        if (nextMatch == null || winner == null) {
            return;
        }

        if (nextMatch.getPlayer1() == null) {
            nextMatch.setPlayer1(winner);
        } else if (nextMatch.getPlayer2() == null) {
            nextMatch.setPlayer2(winner);
        }

        if (nextMatch.getPlayer1() != null && nextMatch.getPlayer2() != null) {
            nextMatch.setStatus("IN_PROGRESS");
        }

        matchSoloRepository.save(nextMatch);
    }

    private void propagateTeamWinner(MatchTeam finishedMatch, Team winner) {
        MatchTeam nextMatch = finishedMatch.getNextMatch();
        if (nextMatch == null || winner == null) {
            return;
        }

        if (nextMatch.getTeam1() == null) {
            nextMatch.setTeam1(winner);
        } else if (nextMatch.getTeam2() == null) {
            nextMatch.setTeam2(winner);
        }

        if (nextMatch.getTeam1() != null && nextMatch.getTeam2() != null) {
            nextMatch.setStatus("IN_PROGRESS");
        }

        matchTeamRepository.save(nextMatch);
    }

    private void validateCreateTournament(CreateTournamentDTO dto) {
        if (dto.getTitle() == null || dto.getTitle().isBlank()) {
            throw new RuntimeException("Title is required");
        }
        if (dto.getDescription() == null || dto.getDescription().isBlank()) {
            throw new RuntimeException("Description is required");
        }
        if (dto.getGameTypeId() == null) {
            throw new RuntimeException("Game type is required");
        }
        if (dto.getStartDate() == null) {
            throw new RuntimeException("Start date is required");
        }
        if (dto.getRegistrationDeadline() != null
                && dto.getRegistrationDeadline().isAfter(dto.getStartDate())) {
            throw new RuntimeException("Registration deadline must be before start date");
        }
        if (dto.getMaxParticipants() != null && dto.getMaxParticipants() < 2) {
            throw new RuntimeException("Max participants must be at least 2");
        }
        if (dto.getMinParticipants() != null && dto.getMinParticipants() < 2) {
            throw new RuntimeException("Min participants must be at least 2");
        }
        if (dto.getMinParticipants() != null && dto.getMaxParticipants() != null && dto.getMinParticipants() > dto.getMaxParticipants()) {
            throw new RuntimeException("Min participants cannot be greater than max participants");
        }
    }

    private void validateTournamentJoinCommon(Tournament tournament) {
        if (tournament.getStatus() == null || !"REGISTRATION_OPEN".equalsIgnoreCase(tournament.getStatus())) {
            throw new RuntimeException("Tournament registration is closed");
        }
        if (tournament.getAccess() != null && !"OPEN".equalsIgnoreCase(tournament.getAccess())) {
            throw new RuntimeException("This tournament is available by invitation only");
        }
        if (tournament.getRegistrationDeadline() != null
                && tournament.getRegistrationDeadline().isBefore(java.time.LocalDateTime.now())) {
            throw new RuntimeException("Registration deadline is over");
        }
    }

    private void validateParticipantsForStart(Tournament tournament, int participantCount) {
        if (participantCount < 2) {
            throw new RuntimeException("Not enough participants to start the tournament");
        }
        if (tournament.getMinParticipants() != null && participantCount < tournament.getMinParticipants()) {
            throw new RuntimeException("Minimum participants count has not been reached");
        }
    }

    private boolean isTeamFull(Team team) {
        int maxPlayers = team.getGameType() != null && team.getGameType().getMaxPlayers() != null
                ? team.getGameType().getMaxPlayers()
                : 1;
        return teamMemberRepository.countByTeamId(team.getId()) >= maxPlayers;
    }

    private int nextPowerOfTwo(int value) {
        int result = 1;
        while (result < value) {
            result *= 2;
        }
        return result;
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

    private int getCurrentParticipantsCount(Tournament tournament) {
        if ("TEAM".equalsIgnoreCase(tournament.getParticipantType())) {
            return (int) teamParticipantRepository.countByTournamentId(tournament.getId());
        }
        return (int) soloParticipantRepository.countByTournamentId(tournament.getId());
    }

    private TournamentShortDTO toShortDTO(Tournament tournament) {
        TournamentShortDTO dto = new TournamentShortDTO();
        dto.setId(tournament.getId());
        dto.setTitle(tournament.getTitle());
        dto.setStatus(tournament.getStatus());
        dto.setParticipantType(tournament.getParticipantType());
        dto.setAccess(tournament.getAccess());
        dto.setGameTypeId(tournament.getGameType() != null ? tournament.getGameType().getId() : null);
        dto.setGameName(tournament.getGameType() != null ? tournament.getGameType().getName() : null);
        dto.setOrganizerUsername(tournament.getOrganizer() != null ? tournament.getOrganizer().getUsername() : null);
        dto.setCurrentParticipantsCount(getCurrentParticipantsCount(tournament));
        dto.setMaxParticipants(tournament.getMaxParticipants());
        dto.setImageUrl(tournament.getImageUrl());
        return dto;
    }

    private TournamentFullDTO toFullDTO(Tournament tournament, boolean owner) {
        TournamentFullDTO dto = new TournamentFullDTO();
        dto.setId(tournament.getId());
        dto.setTitle(tournament.getTitle());
        dto.setDescription(tournament.getDescription());
        dto.setParticipantType(tournament.getParticipantType());
        dto.setAccess(tournament.getAccess());
        dto.setStatus(tournament.getStatus());
        dto.setGameTypeId(tournament.getGameType() != null ? tournament.getGameType().getId() : null);
        dto.setGameName(tournament.getGameType() != null ? tournament.getGameType().getName() : null);
        dto.setGameCode(tournament.getGameType() != null ? tournament.getGameType().getCode() : null);
        dto.setOrganizerUsername(tournament.getOrganizer() != null ? tournament.getOrganizer().getUsername() : null);
        dto.setStartDate(tournament.getStartDate());
        dto.setRegistrationDeadline(tournament.getRegistrationDeadline());
        dto.setMaxParticipants(tournament.getMaxParticipants());
        dto.setMinParticipants(tournament.getMinParticipants());
        dto.setCurrentParticipantsCount(getCurrentParticipantsCount(tournament));
        dto.setCreatedAt(tournament.getCreatedAt());
        dto.setImageUrl(tournament.getImageUrl());
        dto.setOwner(owner);
        return dto;
    }

    private TeamShortDTO toTeamShortDTO(Team team) {
        TeamShortDTO dto = new TeamShortDTO();
        dto.setId(team.getId());
        dto.setName(team.getName());
        dto.setCaptainUsername(team.getCaptain() != null ? team.getCaptain().getUsername() : null);
        dto.setGameTypeName(team.getGameType() != null ? team.getGameType().getName() : null);
        dto.setImageUrl(team.getImageUrl());
        dto.setCurrentMembersCount((int) teamMemberRepository.countByTeamId(team.getId()));
        dto.setMaxMembersCount(team.getGameType() != null ? team.getGameType().getMaxPlayers() : 1);
        return dto;
    }
}
