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
import com.kosmo.tournament.user.entity.User;
import com.kosmo.tournament.user.repository.UserRepository;

@Service
public class MatchService {

    private final MatchSoloRepository matchSoloRepository;
    private final MatchTeamRepository matchTeamRepository;
    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;

    public MatchService(MatchSoloRepository matchSoloRepository,
                        MatchTeamRepository matchTeamRepository,
                        UserRepository userRepository,
                        TeamRepository teamRepository,
                        TeamMemberRepository teamMemberRepository) {
        this.matchSoloRepository = matchSoloRepository;
        this.matchTeamRepository = matchTeamRepository;
        this.userRepository = userRepository;
        this.teamRepository = teamRepository;
        this.teamMemberRepository = teamMemberRepository;
    }

    public List<MatchDTO> getTournamentMatches(Long tournamentId, String currentUsername) {
        List<MatchDTO> result = new ArrayList<>();

        result.addAll(
                matchSoloRepository.findByTournamentId(tournamentId)
                        .stream()
                        .map(match -> toSoloDTO(match, currentUsername))
                        .toList()
        );

        result.addAll(
                matchTeamRepository.findByTournamentId(tournamentId)
                        .stream()
                        .map(match -> toTeamDTO(match, currentUsername))
                        .toList()
        );

        return result;
    }

    public List<MatchDTO> getMyMatches(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<MatchDTO> result = new ArrayList<>();

        result.addAll(
                matchSoloRepository.findByPlayer1IdOrPlayer2Id(user.getId(), user.getId())
                        .stream()
                        .map(match -> toSoloDTO(match, username))
                        .toList()
        );

        List<TeamMember> memberships = teamMemberRepository.findByPlayerId(user.getId());
        List<Long> teamIds = memberships.stream()
                .map(tm -> tm.getTeam().getId())
                .distinct()
                .toList();

        for (Long teamId : teamIds) {
            result.addAll(
                    matchTeamRepository.findByTeam1IdOrTeam2Id(teamId, teamId)
                            .stream()
                            .map(match -> toTeamDTO(match, username))
                            .toList()
            );
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
                                          UpdateSoloMatchResultDTO dfh,
                                          String currentUsername) {
        MatchSolo match = matchSoloRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Solo match not found"));

        validateMatchOwner(match.getTournament().getOrganizer().getUsername(), currentUsername);

        User winner = userRepository.findById(dfh.getWinnerUserId())
                .orElseThrow(() -> new RuntimeException("Winner user not found"));

        match.setWinnerPlayer(winner);
        match.setStatus(dfh.getStatus() != null ? dfh.getStatus().toUpperCase() : "FINISHED");

        MatchSolo saved = matchSoloRepository.save(match);
        return toSoloDTO(saved, currentUsername);
    }

    @Transactional
    public MatchDTO updateTeamMatchResult(Long matchId,
                                          UpdateTeamMatchResultDTO dfh,
                                          String currentUsername) {
        MatchTeam match = matchTeamRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Team match not found"));

        validateMatchOwner(match.getTournament().getOrganizer().getUsername(), currentUsername);

        Team winner = teamRepository.findById(dfh.getWinnerTeamId())
                .orElseThrow(() -> new RuntimeException("Winner team not found"));

        match.setWinnerTeam(winner);
        match.setStatus(dfh.getStatus() != null ? dfh.getStatus().toUpperCase() : "FINISHED");

        MatchTeam saved = matchTeamRepository.save(match);
        return toTeamDTO(saved, currentUsername);
    }

    private void validateMatchOwner(String organizerUsername, String currentUsername) {
        if (currentUsername == null || !currentUsername.equals(organizerUsername)) {
            throw new RuntimeException("Only tournament organizer can update match result");
        }
    }

    private MatchDTO toSoloDTO(MatchSolo match, String currentUsername) {
        MatchDTO dfh = new MatchDTO();
        dfh.setId(match.getId());
        dfh.setMatchType("SOLO");
        dfh.setTournamentId(match.getTournament().getId());
        dfh.setTournamentTitle(match.getTournament().getTitle());
        dfh.setRoundNumber(match.getRoundNumber());
        dfh.setStatus(match.getStatus());
        dfh.setScheduledAt(match.getScheduledAt());

        dfh.setParticipant1Id(match.getPlayer1() != null ? match.getPlayer1().getId() : null);
        dfh.setParticipant1Name(match.getPlayer1() != null ? match.getPlayer1().getUsername() : null);

        dfh.setParticipant2Id(match.getPlayer2() != null ? match.getPlayer2().getId() : null);
        dfh.setParticipant2Name(match.getPlayer2() != null ? match.getPlayer2().getUsername() : null);

        dfh.setWinnerId(match.getWinnerPlayer() != null ? match.getWinnerPlayer().getId() : null);
        dfh.setWinnerName(match.getWinnerPlayer() != null ? match.getWinnerPlayer().getUsername() : null);

        boolean owner = currentUsername != null
                && match.getTournament().getOrganizer() != null
                && currentUsername.equals(match.getTournament().getOrganizer().getUsername());

        dfh.setOwner(owner);
        return dfh;
    }

    private MatchDTO toTeamDTO(MatchTeam match, String currentUsername) {
        MatchDTO dfh = new MatchDTO();
        dfh.setId(match.getId());
        dfh.setMatchType("TEAM");
        dfh.setTournamentId(match.getTournament().getId());
        dfh.setTournamentTitle(match.getTournament().getTitle());
        dfh.setRoundNumber(match.getRoundNumber());
        dfh.setStatus(match.getStatus());
        dfh.setScheduledAt(match.getScheduledAt());

        dfh.setParticipant1Id(match.getTeam1() != null ? match.getTeam1().getId() : null);
        dfh.setParticipant1Name(match.getTeam1() != null ? match.getTeam1().getName() : null);

        dfh.setParticipant2Id(match.getTeam2() != null ? match.getTeam2().getId() : null);
        dfh.setParticipant2Name(match.getTeam2() != null ? match.getTeam2().getName() : null);

        dfh.setWinnerId(match.getWinnerTeam() != null ? match.getWinnerTeam().getId() : null);
        dfh.setWinnerName(match.getWinnerTeam() != null ? match.getWinnerTeam().getName() : null);

        boolean owner = currentUsername != null
                && match.getTournament().getOrganizer() != null
                && currentUsername.equals(match.getTournament().getOrganizer().getUsername());

        dfh.setOwner(owner);
        return dfh;
    }
}