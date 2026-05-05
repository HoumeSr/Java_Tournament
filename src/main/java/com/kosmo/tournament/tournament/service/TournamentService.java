package com.kosmo.tournament.tournament.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kosmo.tournament.common.dto.PageResponseDTO;
import com.kosmo.tournament.gametype.entity.GameType;
import com.kosmo.tournament.gametype.repository.GameTypeRepository;
import com.kosmo.tournament.match.entity.MatchSolo;
import com.kosmo.tournament.match.entity.MatchTeam;
import com.kosmo.tournament.match.repository.MatchSoloRepository;
import com.kosmo.tournament.match.repository.MatchTeamRepository;
import com.kosmo.tournament.rating.service.RatingService;
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
import com.kosmo.tournament.tournament.model.TournamentStatus;
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
    private final RatingService ratingService;

    public TournamentService(TournamentRepository tournamentRepository,
                             UserRepository userRepository,
                             GameTypeRepository gameTypeRepository,
                             TeamRepository teamRepository,
                             TeamMemberRepository teamMemberRepository,
                             TournamentSoloParticipantRepository soloParticipantRepository,
                             TournamentTeamParticipantRepository teamParticipantRepository,
                             MatchSoloRepository matchSoloRepository,
                             MatchTeamRepository matchTeamRepository,
                             RatingService ratingService) {
        this.tournamentRepository = tournamentRepository;
        this.userRepository = userRepository;
        this.gameTypeRepository = gameTypeRepository;
        this.teamRepository = teamRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.soloParticipantRepository = soloParticipantRepository;
        this.teamParticipantRepository = teamParticipantRepository;
        this.matchSoloRepository = matchSoloRepository;
        this.matchTeamRepository = matchTeamRepository;
        this.ratingService = ratingService;
    }

    public List<TournamentShortDTO> getAllTournaments() {
        return tournamentRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toShortDTO)
                .toList();
    }

    public PageResponseDTO<TournamentShortDTO> getTournamentsPage(Long gameTypeId,
                                                                  String status,
                                                                  int page,
                                                                  int size) {
        int safePage = normalizePage(page);
        int safeSize = normalizePageSize(size);

        List<TournamentShortDTO> items = tournamentRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .filter(tournament -> gameTypeId == null
                        || (tournament.getGameType() != null && gameTypeId.equals(tournament.getGameType().getId())))
                .filter(tournament -> status == null
                        || status.isBlank()
                        || tournament.getStatus().equalsIgnoreCase(status))
                .sorted(Comparator.comparing(Tournament::getCreatedAt).reversed())
                .map(this::toShortDTO)
                .toList();

        return paginate(items, safePage, safeSize);
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
        return tournamentRepository.findByStatus(TournamentStatus.from(status).value())
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
        tournament.setStatus(TournamentStatus.DRAFT.value());
        tournament.setGameType(gameType);
        tournament.setOrganizer(organizer);
        tournament.setStartDate(dto.getStartDate());
        tournament.setRegistrationDeadline(dto.getRegistrationDeadline());
        tournament.setMaxParticipants(dto.getMaxParticipants());
        tournament.setMinParticipants(dto.getMinParticipants());
        tournament.setImageUrl(resolveTournamentImageUrl(dto.getImageUrl(), gameType));

        Tournament saved = tournamentRepository.save(tournament);
        return toFullDTO(saved, true);
    }

    @Transactional
    public TournamentFullDTO updateTournament(Long tournamentId,
                                              UpdateTournamentDTO dto,
                                              String currentUsername) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("Tournament not found"));

        User currentUser = getUserByUsername(currentUsername);
        assertCanManageTournament(tournament, currentUser);

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
            tournament.setImageUrl(resolveTournamentImageUrl(dto.getImageUrl(), tournament.getGameType()));
        }
        if (dto.getGameTypeId() != null) {
            GameType gameType = gameTypeRepository.findById(dto.getGameTypeId())
                    .orElseThrow(() -> new RuntimeException("Game type not found"));
            tournament.setGameType(gameType);

            if (tournament.getImageUrl() == null || tournament.getImageUrl().isBlank()) {
                tournament.setImageUrl(gameType.getImageUrl());
            }
        }

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

    @Transactional
    public void joinTeamTournament(JoinTeamTournamentDTO dto, String currentUsername) {
        Tournament tournament = tournamentRepository.findById(dto.getTournamentId())
                .orElseThrow(() -> new RuntimeException("Tournament not found"));

        validateTournamentJoinCommon(tournament);

        if (!"TEAM".equalsIgnoreCase(tournament.getParticipantType())) {
            throw new RuntimeException("Tournament is not team-based");
        }

        Team team = teamRepository.findById(dto.getTeamId())
                .orElseThrow(() -> new RuntimeException("Team not found"));

        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean isCaptain = team.getCaptain() != null
                && team.getCaptain().getId().equals(currentUser.getId());

        if (!isCaptain) {
            throw new RuntimeException("Only team captain can register a team");
        }

        if (team.getGameType() == null || tournament.getGameType() == null
                || !team.getGameType().getId().equals(tournament.getGameType().getId())) {
            throw new RuntimeException("Team game type does not match tournament game type");
        }

        long currentMembersCount = teamMemberRepository.countByTeamId(team.getId());
        int requiredMembersCount = team.getGameType() != null && team.getGameType().getMaxPlayers() != null
                ? team.getGameType().getMaxPlayers()
                : 1;

        if (currentMembersCount <= 0) {
            throw new RuntimeException("Team has no members");
        }

        if (currentMembersCount < requiredMembersCount) {
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

        User currentUser = getUserByUsername(currentUsername);
        assertCanManageTournament(tournament, currentUser);
        assertStatusTransitionAllowed(tournament, TournamentStatus.IN_PROGRESS);

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

        tournament.setStatus(TournamentStatus.IN_PROGRESS.value());
        Tournament saved = tournamentRepository.save(tournament);
        return toFullDTO(saved, true);
    }

    public List<Map<String, Object>> getTournamentParticipants(Long tournamentId) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("Tournament not found"));

        if ("TEAM".equalsIgnoreCase(tournament.getParticipantType())) {
            return teamParticipantRepository.findByTournamentIdOrderBySeedAsc(tournamentId)
                    .stream()
                    .map(participant -> {
                        Map<String, Object> item = new LinkedHashMap<>();
                        Team team = participant.getTeam();
                        item.put("id", participant.getId());
                        item.put("participantType", "TEAM");
                        item.put("teamId", team != null ? team.getId() : null);
                        item.put("name", team != null ? team.getName() : null);
                        item.put("seed", participant.getSeed());
                        item.put("status", participant.getStatus());
                        return item;
                    })
                    .toList();
        }

        return soloParticipantRepository.findByTournamentIdOrderBySeedAsc(tournamentId)
                .stream()
                .map(participant -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    User player = participant.getPlayer();
                    item.put("id", participant.getId());
                    item.put("participantType", "SOLO");
                    item.put("userId", player != null ? player.getId() : null);
                    item.put("name", player != null ? player.getUsername() : null);
                    item.put("seed", participant.getSeed());
                    item.put("status", participant.getStatus());
                    return item;
                })
                .toList();
    }

    @Transactional
    public TournamentFullDTO openRegistration(Long tournamentId, String currentUsername) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("Tournament not found"));

        User currentUser = getUserByUsername(currentUsername);
        assertCanManageTournament(tournament, currentUser);
        assertStatusTransitionAllowed(tournament, TournamentStatus.REGISTRATION_OPEN);

        tournament.setStatus(TournamentStatus.REGISTRATION_OPEN.value());
        Tournament saved = tournamentRepository.save(tournament);
        return toFullDTO(saved, true);
    }

    @Transactional
    public TournamentFullDTO cancelTournament(Long tournamentId, String currentUsername) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("Tournament not found"));

        User currentUser = getUserByUsername(currentUsername);
        assertCanManageTournament(tournament, currentUser);
        assertStatusTransitionAllowed(tournament, TournamentStatus.CANCELLED);

        tournament.setStatus(TournamentStatus.CANCELLED.value());
        Tournament saved = tournamentRepository.save(tournament);
        return toFullDTO(saved, true);
    }

    @Transactional
    public TournamentFullDTO finishTournament(Long tournamentId, String currentUsername) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("Tournament not found"));

        User currentUser = getUserByUsername(currentUsername);
        assertCanManageTournament(tournament, currentUser);
        assertStatusTransitionAllowed(tournament, TournamentStatus.FINISHED);

        tournament.setStatus(TournamentStatus.FINISHED.value());
        Tournament saved = tournamentRepository.save(tournament);
        return toFullDTO(saved, true);
    }

    private void startSoloTournament(Tournament tournament) {
        List<TournamentSoloParticipant> participants = soloParticipantRepository.findByTournamentIdOrderBySeedAsc(tournament.getId());
        validateParticipantsForStart(tournament, participants.size());

        int actualCount = participants.size();
        int bracketSize = nextPowerOfTwo(actualCount);
        int firstRoundMatches = bracketSize / 2;

        List<MatchSolo> matches = createSoloBracketSkeleton(tournament, bracketSize);
        MatchSolo[] firstRound = matches.subList(0, firstRoundMatches).toArray(new MatchSolo[0]);

        int pointer = 0;
        for (int i = 0; i < firstRoundMatches; i++) {
            MatchSolo match = firstRound[i];
            if (pointer < actualCount) {
                User player1 = participants.get(pointer++).getPlayer();
                match.setPlayer1(player1);

                if (pointer < actualCount) {
                    User player2 = participants.get(pointer++).getPlayer();
                    match.setPlayer2(player2);
                    match.setStatus("IN_PROGRESS");
                } else {
                    match.setPlayer2(null);
                    match.setWinnerPlayer(player1);
                    match.setStatus("FINISHED");
                }
            } else {
                match.setStatus("SCHEDULED");
            }
            match.setScheduledAt(tournament.getStartDate());
        }

        matchSoloRepository.saveAll(matches);

        for (int i = 0; i < firstRoundMatches; i++) {
            MatchSolo match = firstRound[i];
            if (match.getWinnerPlayer() != null) {
                propagateSoloWinner(match, match.getWinnerPlayer());
            }
        }

        List<User> players = participants.stream()
                .map(TournamentSoloParticipant::getPlayer)
                .collect(Collectors.toList());
        initializeSoloPlayerRatings(tournament, players);
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

        List<Team> teams = participants.stream()
                .map(TournamentTeamParticipant::getTeam)
                .collect(Collectors.toList());
        initializeTeamPlayerRatings(tournament, teams);
    }

    private void initializeSoloPlayerRatings(Tournament tournament, List<User> players) {
        Long gameTypeId = tournament.getGameType().getId();
        String gameTypeName = tournament.getGameType().getName();

        for (User player : players) {
            ratingService.ensureUserStatsExists(player.getId(), gameTypeId, gameTypeName);
        }
    }

    private void initializeTeamPlayerRatings(Tournament tournament, List<Team> teams) {
        Long gameTypeId = tournament.getGameType().getId();
        String gameTypeName = tournament.getGameType().getName();

        for (Team team : teams) {
            List<TeamMember> members = teamMemberRepository.findByTeamId(team.getId());
            for (TeamMember member : members) {
                ratingService.ensureUserStatsExists(member.getPlayer().getId(), gameTypeId, gameTypeName);
            }
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
                // Не устанавливаем player1 и player2 здесь
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

    private User getUserByUsername(String currentUsername) {
        if (currentUsername == null || currentUsername.isBlank()) {
            throw new AccessDeniedException("Authentication required");
        }

        return userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new AccessDeniedException("Authentication required"));
    }

    private void assertCanManageTournament(Tournament tournament, User currentUser) {
        boolean isAdmin = currentUser != null && "ADMIN".equalsIgnoreCase(currentUser.getRole());
        boolean isOrganizer = tournament.getOrganizer() != null
                && currentUser != null
                && tournament.getOrganizer().getId().equals(currentUser.getId());

        if (!isAdmin && !isOrganizer) {
            throw new AccessDeniedException("Only organizer or admin can manage this tournament");
        }
    }

    private void assertStatusTransitionAllowed(Tournament tournament, TournamentStatus targetStatus) {
        TournamentStatus currentStatus = TournamentStatus.from(tournament.getStatus());

        boolean allowed = switch (currentStatus) {
            case DRAFT -> targetStatus == TournamentStatus.REGISTRATION_OPEN;
            case REGISTRATION_OPEN -> targetStatus == TournamentStatus.IN_PROGRESS
                    || targetStatus == TournamentStatus.CANCELLED;
            case IN_PROGRESS -> targetStatus == TournamentStatus.FINISHED
                    || targetStatus == TournamentStatus.CANCELLED;
            case FINISHED, CANCELLED -> false;
        };

        if (!allowed) {
            throw new IllegalStateException("Tournament status transition "
                    + currentStatus.value() + " -> " + targetStatus.value() + " is not allowed");
        }
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
        if (tournament.getStatus() == null || !TournamentStatus.REGISTRATION_OPEN.value().equalsIgnoreCase(tournament.getStatus())) {
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

    private int getCurrentParticipantsCount(Tournament tournament) {
        if ("TEAM".equalsIgnoreCase(tournament.getParticipantType())) {
            return (int) teamParticipantRepository.countByTournamentId(tournament.getId());
        }
        return (int) soloParticipantRepository.countByTournamentId(tournament.getId());
    }

    private int normalizePage(int page) {
        return Math.max(page, 0);
    }

    private int normalizePageSize(int size) {
        int safeSize = size <= 0 ? 9 : size;
        safeSize = Math.max(3, Math.min(safeSize, 60));
        int remainder = safeSize % 3;
        if (remainder != 0) {
            safeSize += (3 - remainder);
            if (safeSize > 60) {
                safeSize = 60;
            }
        }
        return safeSize;
    }

    private PageResponseDTO<TournamentShortDTO> paginate(List<TournamentShortDTO> items, int page, int size) {
        long totalElements = items.size();
        int totalPages = totalElements == 0 ? 0 : (int) Math.ceil((double) totalElements / size);
        int fromIndex = Math.min(page * size, items.size());
        int toIndex = Math.min(fromIndex + size, items.size());

        List<TournamentShortDTO> content = fromIndex >= toIndex
                ? List.of()
                : items.subList(fromIndex, toIndex);

        boolean first = page == 0;
        boolean last = totalPages == 0 || page >= totalPages - 1;

        return new PageResponseDTO<>(
                content,
                page,
                size,
                totalElements,
                totalPages,
                first,
                last,
                content.isEmpty()
        );
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
        dto.setImageUrl(resolveTournamentImageUrl(tournament.getImageUrl(), tournament.getGameType()));
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
        dto.setImageUrl(resolveTournamentImageUrl(tournament.getImageUrl(), tournament.getGameType()));
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
    private String resolveTournamentImageUrl(String imageUrl, GameType gameType) {
        if (imageUrl != null && !imageUrl.isBlank()) {
            return imageUrl.trim();
        }

        if (gameType != null && gameType.getImageUrl() != null && !gameType.getImageUrl().isBlank()) {
            return gameType.getImageUrl().trim();
        }

        return null;
    }
}