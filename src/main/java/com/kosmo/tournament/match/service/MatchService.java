package com.kosmo.tournament.match.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kosmo.tournament.match.dto.MatchDTO;
import com.kosmo.tournament.match.dto.UpdateSoloMatchResultDTO;
import com.kosmo.tournament.match.dto.UpdateTeamMatchResultDTO;
import com.kosmo.tournament.match.entity.MatchSolo;
import com.kosmo.tournament.match.entity.MatchTeam;
import com.kosmo.tournament.match.repository.MatchSoloRepository;
import com.kosmo.tournament.match.repository.MatchTeamRepository;
import com.kosmo.tournament.team.entity.Team;
import com.kosmo.tournament.team.entity.TeamMember;
import com.kosmo.tournament.team.repository.TeamMemberRepository;
import com.kosmo.tournament.team.repository.TeamRepository;
import com.kosmo.tournament.tournament.entity.Tournament;
import com.kosmo.tournament.tournament.repository.TournamentRepository;
import com.kosmo.tournament.user.entity.User;
import com.kosmo.tournament.user.repository.UserRepository;

@Service
public class MatchService {

    private final MatchSoloRepository matchSoloRepository;
    private final MatchTeamRepository matchTeamRepository;
    private final TournamentRepository tournamentRepository;
    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;

    public MatchService(MatchSoloRepository matchSoloRepository,
                        MatchTeamRepository matchTeamRepository,
                        TournamentRepository tournamentRepository,
                        UserRepository userRepository,
                        TeamRepository teamRepository,
                        TeamMemberRepository teamMemberRepository) {
        this.matchSoloRepository = matchSoloRepository;
        this.matchTeamRepository = matchTeamRepository;
        this.tournamentRepository = tournamentRepository;
        this.userRepository = userRepository;
        this.teamRepository = teamRepository;
        this.teamMemberRepository = teamMemberRepository;
    }

    public List<MatchDTO> getTournamentMatches(Long tournamentId, String currentUsername) {
        List<MatchDTO> result = new ArrayList<>();
        result.addAll(matchSoloRepository.findByTournamentIdOrderByRoundNumberAscIdAsc(tournamentId)
                .stream().map(match -> toSoloDTO(match, currentUsername)).toList());
        result.addAll(matchTeamRepository.findByTournamentIdOrderByRoundNumberAscIdAsc(tournamentId)
                .stream().map(match -> toTeamDTO(match, currentUsername)).toList());
        return result;
    }

    public List<MatchDTO> getMyMatches(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<MatchDTO> result = new ArrayList<>();

        result.addAll(matchSoloRepository.findByPlayer1IdOrPlayer2Id(user.getId(), user.getId())
                .stream()
                .map(match -> toSoloDTO(match, username))
                .toList());

        List<TeamMember> memberships = teamMemberRepository.findByPlayerId(user.getId());
        List<Long> teamIds = memberships.stream().map(tm -> tm.getTeam().getId()).distinct().toList();

        for (Long teamId : teamIds) {
            result.addAll(matchTeamRepository.findByTeam1IdOrTeam2Id(teamId, teamId)
                    .stream()
                    .map(match -> toTeamDTO(match, username))
                    .toList());
        }

        return result;
    }

    public MatchDTO getSoloMatch(Long matchId, String currentUsername) {
        MatchSolo match = matchSoloRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Solo match not found"));
        return toSoloDTO(match, currentUsername);
    }

    public MatchDTO getTeamMatch(Long matchId, String currentUsername) {
        MatchTeam match = matchTeamRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Team match not found"));
        return toTeamDTO(match, currentUsername);
    }

    @Transactional
    public MatchDTO updateSoloMatchResult(Long matchId,
                                          UpdateSoloMatchResultDTO dto,
                                          String currentUsername) {
        MatchSolo match = matchSoloRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Solo match not found"));

        validateMatchOwnershipAndState(match.getTournament(), currentUsername, match.getStatus(),
                match.getPlayer1() != null && match.getPlayer2() != null);

        User winner = userRepository.findById(dto.getWinnerUserId())
                .orElseThrow(() -> new RuntimeException("Winner user not found"));

        boolean validWinner = (match.getPlayer1() != null && match.getPlayer1().getId().equals(winner.getId()))
                || (match.getPlayer2() != null && match.getPlayer2().getId().equals(winner.getId()));
        if (!validWinner) {
            throw new RuntimeException("Winner is not a participant of this match");
        }

        match.setWinnerPlayer(winner);
        match.setStatus(dto.getStatus() != null && !dto.getStatus().isBlank()
                ? dto.getStatus().toUpperCase()
                : "FINISHED");
        MatchSolo saved = matchSoloRepository.save(match);

        propagateSoloWinner(saved, winner);
        finishTournamentIfNeeded(saved.getTournament());

        return toSoloDTO(saved, currentUsername);
    }

    @Transactional
    public MatchDTO updateTeamMatchResult(Long matchId,
                                          UpdateTeamMatchResultDTO dto,
                                          String currentUsername) {
        MatchTeam match = matchTeamRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Team match not found"));

        validateMatchOwnershipAndState(match.getTournament(), currentUsername, match.getStatus(),
                match.getTeam1() != null && match.getTeam2() != null);

        Team winner = teamRepository.findById(dto.getWinnerTeamId())
                .orElseThrow(() -> new RuntimeException("Winner team not found"));

        boolean validWinner = (match.getTeam1() != null && match.getTeam1().getId().equals(winner.getId()))
                || (match.getTeam2() != null && match.getTeam2().getId().equals(winner.getId()));
        if (!validWinner) {
            throw new RuntimeException("Winner is not a participant of this match");
        }

        match.setWinnerTeam(winner);
        match.setStatus(dto.getStatus() != null && !dto.getStatus().isBlank()
                ? dto.getStatus().toUpperCase()
                : "FINISHED");
        MatchTeam saved = matchTeamRepository.save(match);

        propagateTeamWinner(saved, winner);
        finishTournamentIfNeeded(saved.getTournament());

        return toTeamDTO(saved, currentUsername);
    }

    private void validateMatchOwnershipAndState(Tournament tournament,
                                                String currentUsername,
                                                String matchStatus,
                                                boolean hasTwoParticipants) {
        if (currentUsername == null
                || tournament.getOrganizer() == null
                || !currentUsername.equals(tournament.getOrganizer().getUsername())) {
            throw new RuntimeException("Only tournament organizer can update match result");
        }

        if (!"IN_PROGRESS".equalsIgnoreCase(tournament.getStatus())) {
            throw new RuntimeException("Tournament is not in progress");
        }

        if (!"IN_PROGRESS".equalsIgnoreCase(matchStatus)) {
            throw new RuntimeException("Only IN_PROGRESS match can be updated");
        }

        if (!hasTwoParticipants) {
            throw new RuntimeException("Match does not have two participants");
        }
    }

    private void propagateSoloWinner(MatchSolo finishedMatch, User winner) {
        MatchSolo next = finishedMatch.getNextMatch();
        if (next == null) {
            return;
        }

        if (next.getPlayer1() == null) {
            next.setPlayer1(winner);
        } else if (next.getPlayer2() == null) {
            next.setPlayer2(winner);
        }

        if (next.getPlayer1() != null && next.getPlayer2() != null
                && !"FINISHED".equalsIgnoreCase(next.getStatus())) {
            next.setStatus("IN_PROGRESS");
        }

        matchSoloRepository.save(next);
    }

    private void propagateTeamWinner(MatchTeam finishedMatch, Team winner) {
        MatchTeam next = finishedMatch.getNextMatch();
        if (next == null) {
            return;
        }

        if (next.getTeam1() == null) {
            next.setTeam1(winner);
        } else if (next.getTeam2() == null) {
            next.setTeam2(winner);
        }

        if (next.getTeam1() != null && next.getTeam2() != null
                && !"FINISHED".equalsIgnoreCase(next.getStatus())) {
            next.setStatus("IN_PROGRESS");
        }

        matchTeamRepository.save(next);
    }

    private void finishTournamentIfNeeded(Tournament tournament) {
        if ("SOLO".equalsIgnoreCase(tournament.getParticipantType())) {
            boolean allFinished = matchSoloRepository.findByTournamentId(tournament.getId())
                    .stream()
                    .allMatch(match -> "FINISHED".equalsIgnoreCase(match.getStatus()));
            if (allFinished) {
                tournament.setStatus("FINISHED");
                tournamentRepository.save(tournament);
            }
            return;
        }

        boolean allFinished = matchTeamRepository.findByTournamentId(tournament.getId())
                .stream()
                .allMatch(match -> "FINISHED".equalsIgnoreCase(match.getStatus()));
        if (allFinished) {
            tournament.setStatus("FINISHED");
            tournamentRepository.save(tournament);
        }
    }

    private MatchDTO toSoloDTO(MatchSolo match, String currentUsername) {
        MatchDTO dto = new MatchDTO();
        dto.setId(match.getId());
        dto.setMatchType("SOLO");
        dto.setTournamentId(match.getTournament().getId());
        dto.setTournamentTitle(match.getTournament().getTitle());
        dto.setRoundNumber(match.getRoundNumber());
        dto.setStatus(match.getStatus());
        dto.setScheduledAt(match.getScheduledAt());
        dto.setNextMatchId(match.getNextMatch() != null ? match.getNextMatch().getId() : null);
        dto.setParticipant1Id(match.getPlayer1() != null ? match.getPlayer1().getId() : null);
        dto.setParticipant1Name(match.getPlayer1() != null ? match.getPlayer1().getUsername() : null);
        dto.setParticipant2Id(match.getPlayer2() != null ? match.getPlayer2().getId() : null);
        dto.setParticipant2Name(match.getPlayer2() != null ? match.getPlayer2().getUsername() : null);
        dto.setWinnerId(match.getWinnerPlayer() != null ? match.getWinnerPlayer().getId() : null);
        dto.setWinnerName(match.getWinnerPlayer() != null ? match.getWinnerPlayer().getUsername() : null);
        dto.setOwner(currentUsername != null
                && match.getTournament().getOrganizer() != null
                && currentUsername.equals(match.getTournament().getOrganizer().getUsername()));
        return dto;
    }

    private MatchDTO toTeamDTO(MatchTeam match, String currentUsername) {
        MatchDTO dto = new MatchDTO();
        dto.setId(match.getId());
        dto.setMatchType("TEAM");
        dto.setTournamentId(match.getTournament().getId());
        dto.setTournamentTitle(match.getTournament().getTitle());
        dto.setRoundNumber(match.getRoundNumber());
        dto.setStatus(match.getStatus());
        dto.setScheduledAt(match.getScheduledAt());
        dto.setNextMatchId(match.getNextMatch() != null ? match.getNextMatch().getId() : null);
        dto.setParticipant1Id(match.getTeam1() != null ? match.getTeam1().getId() : null);
        dto.setParticipant1Name(match.getTeam1() != null ? match.getTeam1().getName() : null);
        dto.setParticipant2Id(match.getTeam2() != null ? match.getTeam2().getId() : null);
        dto.setParticipant2Name(match.getTeam2() != null ? match.getTeam2().getName() : null);
        dto.setWinnerId(match.getWinnerTeam() != null ? match.getWinnerTeam().getId() : null);
        dto.setWinnerName(match.getWinnerTeam() != null ? match.getWinnerTeam().getName() : null);
        dto.setOwner(currentUsername != null
                && match.getTournament().getOrganizer() != null
                && currentUsername.equals(match.getTournament().getOrganizer().getUsername()));
        return dto;
    }
}

