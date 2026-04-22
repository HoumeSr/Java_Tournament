package com.kosmo.tournament.team.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kosmo.tournament.gametype.entity.GameType;
import com.kosmo.tournament.gametype.repository.GameTypeRepository;
import com.kosmo.tournament.notification.entity.Notification;
import com.kosmo.tournament.notification.service.NotificationService;
import com.kosmo.tournament.team.dto.AddTeamMemberDTO;
import com.kosmo.tournament.team.dto.CreateTeamDTO;
import com.kosmo.tournament.team.dto.TeamFullDTO;
import com.kosmo.tournament.team.dto.TeamMemberDTO;
import com.kosmo.tournament.team.dto.TeamShortDTO;
import com.kosmo.tournament.team.entity.Team;
import com.kosmo.tournament.team.entity.TeamMember;
import com.kosmo.tournament.team.repository.TeamMemberRepository;
import com.kosmo.tournament.team.repository.TeamRepository;
import com.kosmo.tournament.user.entity.User;
import com.kosmo.tournament.user.repository.UserRepository;

@Service
public class TeamService {

    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final GameTypeRepository gameTypeRepository;

    public TeamService(TeamRepository teamRepository,
                       TeamMemberRepository teamMemberRepository,
                       UserRepository userRepository,
                       NotificationService notificationService,
                       GameTypeRepository gameTypeRepository) {
        this.teamRepository = teamRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.gameTypeRepository = gameTypeRepository;
    }

    public List<TeamShortDTO> getMyTeams(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return teamMemberRepository.findByPlayerId(user.getId())
                .stream()
                .map(TeamMember::getTeam)
                .distinct()
                .map(this::toShortDTO)
                .toList();
    }

    public TeamFullDTO getTeamById(Long teamId, String currentUsername) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found"));

        boolean owner = currentUsername != null
                && team.getCaptain() != null
                && currentUsername.equals(team.getCaptain().getUsername());

        return toFullDTO(team, owner);
    }

    @Transactional
    public TeamFullDTO createTeam(CreateTeamDTO dto, String username) {
        if (dto.getName() == null || dto.getName().isBlank()) {
            throw new RuntimeException("Team name is required");
        }

        if (dto.getGameTypeId() == null) {
            throw new RuntimeException("Game type is required");
        }

        if (teamRepository.existsByName(dto.getName())) {
            throw new RuntimeException("Team with this name already exists");
        }

        User captain = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        GameType gameType = gameTypeRepository.findById(dto.getGameTypeId())
                .orElseThrow(() -> new RuntimeException("Game type not found"));

        Team team = new Team();
        team.setName(dto.getName());
        team.setCaptain(captain);
        team.setGameType(gameType);
        team.setImageUrl(dto.getImageUrl());

        Team savedTeam = teamRepository.save(team);

        TeamMember captainMember = new TeamMember();
        captainMember.setTeam(savedTeam);
        captainMember.setPlayer(captain);
        captainMember.setRole("CAPTAIN");

        teamMemberRepository.save(captainMember);

        return toFullDTO(savedTeam, true);
    }

    @Transactional
    public TeamFullDTO addMember(Long teamId, AddTeamMemberDTO dto, String currentUsername) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found"));

        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("Current user not found"));

        if (team.getCaptain() == null || !team.getCaptain().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Only captain can add members");
        }

        User newMember = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new RuntimeException("User to add not found"));

        if (teamMemberRepository.existsByTeamIdAndPlayerId(teamId, newMember.getId())) {
            throw new RuntimeException("User already in team");
        }

        validateTeamCapacity(team);

        TeamMember teamMember = new TeamMember();
        teamMember.setTeam(team);
        teamMember.setPlayer(newMember);
        teamMember.setRole("MEMBER");

        teamMemberRepository.save(teamMember);

        return toFullDTO(team, true);
    }

    public List<TeamMemberDTO> getTeamMembers(Long teamId) {
        return teamMemberRepository.findByTeamId(teamId)
                .stream()
                .map(this::toMemberDTO)
                .toList();
    }

    @Transactional
    public void inviteUserToTeam(Long teamId, Long invitedUserId, String currentUsername) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found"));

        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("Current user not found"));

        if (team.getCaptain() == null || !team.getCaptain().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Only captain can invite users");
        }

        User invitedUser = userRepository.findById(invitedUserId)
                .orElseThrow(() -> new RuntimeException("Invited user not found"));

        if (teamMemberRepository.existsByTeamIdAndPlayerId(teamId, invitedUserId)) {
            throw new RuntimeException("User already in team");
        }

        validateTeamCapacity(team);

        notificationService.createTeamInvite(invitedUser, team);
    }

    @Transactional
    public TeamFullDTO acceptInvite(Long notificationId, String currentUsername) {
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Notification notification = notificationService.getById(notificationId);

        if (!notification.getUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("This notification does not belong to current user");
        }

        if (!"TEAM_INVITE".equals(notification.getType())) {
            throw new RuntimeException("Notification is not a team invite");
        }

        if (!"PENDING".equals(notification.getStatus())) {
            throw new RuntimeException("Invitation already processed");
        }

        Team team = notification.getTeam();
        if (team == null) {
            throw new RuntimeException("Team not found in notification");
        }

        if (!teamMemberRepository.existsByTeamIdAndPlayerId(team.getId(), currentUser.getId())) {
            validateTeamCapacity(team);

            TeamMember teamMember = new TeamMember();
            teamMember.setTeam(team);
            teamMember.setPlayer(currentUser);
            teamMember.setRole("MEMBER");
            teamMemberRepository.save(teamMember);
        }

        notificationService.markAccepted(notification);

        boolean owner = team.getCaptain() != null && team.getCaptain().getId().equals(currentUser.getId());
        return toFullDTO(team, owner);
    }

    @Transactional
    public void declineInvite(Long notificationId, String currentUsername) {
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Notification notification = notificationService.getById(notificationId);

        if (!notification.getUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("This notification does not belong to current user");
        }

        if (!"TEAM_INVITE".equals(notification.getType())) {
            throw new RuntimeException("Notification is not a team invite");
        }

        if (!"PENDING".equals(notification.getStatus())) {
            throw new RuntimeException("Invitation already processed");
        }

        notificationService.markDeclined(notification);
    }

    private void validateTeamCapacity(Team team) {
        long currentCount = teamMemberRepository.countByTeamId(team.getId());

        GameType gameType = team.getGameType();
        Integer maxPlayers = gameType != null ? gameType.getMaxPlayers() : null;
        int maxCount = maxPlayers != null ? maxPlayers : 1;

        if (currentCount >= maxCount) {
            throw new RuntimeException("Team is already full");
        }
    }

    private TeamShortDTO toShortDTO(Team team) {
        TeamShortDTO dto = new TeamShortDTO();
        dto.setId(team.getId());
        dto.setName(team.getName());
        dto.setCaptainUsername(team.getCaptain() != null ? team.getCaptain().getUsername() : null);
        dto.setImageUrl(team.getImageUrl());
        return dto;
    }

    private TeamMemberDTO toMemberDTO(TeamMember member) {
        TeamMemberDTO dto = new TeamMemberDTO();
        dto.setUserId(member.getPlayer().getId());
        dto.setUsername(member.getPlayer().getUsername());
        dto.setRole(member.getRole());
        dto.setCountry(member.getPlayer().getCountry());
        dto.setImageUrl(member.getPlayer().getImageUrl());
        dto.setJoinedAt(member.getJoinedAt());
        return dto;
    }

    private TeamFullDTO toFullDTO(Team team, boolean owner) {
        TeamFullDTO dto = new TeamFullDTO();
        dto.setId(team.getId());
        dto.setName(team.getName());
        dto.setCaptainId(team.getCaptain() != null ? team.getCaptain().getId() : null);
        dto.setCaptainUsername(team.getCaptain() != null ? team.getCaptain().getUsername() : null);
        dto.setImageUrl(team.getImageUrl());
        dto.setCreatedAt(team.getCreatedAt());
        dto.setOwner(owner);

        dto.setCurrentMembersCount((int) teamMemberRepository.countByTeamId(team.getId()));

        GameType gameType = team.getGameType();
        Integer maxPlayers = gameType != null ? gameType.getMaxPlayers() : null;
        dto.setMaxMembersCount(maxPlayers != null ? maxPlayers : 1);

        dto.setMembers(getTeamMembers(team.getId()));
        return dto;
    }
}