package com.kosmo.tournament.team.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kosmo.tournament.notification.entity.Notification;
import com.kosmo.tournament.notification.service.NotificationService;
import com.kosmo.tournament.team.dfh.AddTeamMemberDFH;
import com.kosmo.tournament.team.dfh.CreateTeamDFH;
import com.kosmo.tournament.team.dfh.TeamFullDFH;
import com.kosmo.tournament.team.dfh.TeamMemberDFH;
import com.kosmo.tournament.team.dfh.TeamShortDFH;
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

    public TeamService(TeamRepository teamRepository,
                       TeamMemberRepository teamMemberRepository,
                       UserRepository userRepository,
                       NotificationService notificationService) {
        this.teamRepository = teamRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    public List<TeamShortDFH> getMyTeams(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return teamMemberRepository.findByPlayerId(user.getId())
                .stream()
                .map(TeamMember::getTeam)
                .distinct()
                .map(this::toShortDFH)
                .toList();
    }

    public TeamFullDFH getTeamById(Long teamId, String currentUsername) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found"));

        boolean owner = currentUsername != null
                && team.getCaptain() != null
                && currentUsername.equals(team.getCaptain().getUsername());

        return toFullDFH(team, owner);
    }

    @Transactional
    public TeamFullDFH createTeam(CreateTeamDFH dfh, String username) {
        if (dfh.getName() == null || dfh.getName().isBlank()) {
            throw new RuntimeException("Team name is required");
        }

        if (teamRepository.existsByName(dfh.getName())) {
            throw new RuntimeException("Team with this name already exists");
        }

        User captain = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Team team = new Team();
        team.setName(dfh.getName());
        team.setCaptain(captain);
        team.setImageUrl(dfh.getImageUrl());

        Team savedTeam = teamRepository.save(team);

        TeamMember captainMember = new TeamMember();
        captainMember.setTeam(savedTeam);
        captainMember.setPlayer(captain);
        captainMember.setRole("CAPTAIN");

        teamMemberRepository.save(captainMember);

        return toFullDFH(savedTeam, true);
    }

    @Transactional
    public TeamFullDFH addMember(Long teamId, AddTeamMemberDFH dfh, String currentUsername) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found"));

        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("Current user not found"));

        if (team.getCaptain() == null || !team.getCaptain().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Only captain can add members");
        }

        User newMember = userRepository.findById(dfh.getUserId())
                .orElseThrow(() -> new RuntimeException("User to add not found"));

        if (teamMemberRepository.existsByTeamIdAndPlayerId(teamId, newMember.getId())) {
            throw new RuntimeException("User already in team");
        }

        TeamMember teamMember = new TeamMember();
        teamMember.setTeam(team);
        teamMember.setPlayer(newMember);
        teamMember.setRole("MEMBER");

        teamMemberRepository.save(teamMember);

        return toFullDFH(team, true);
    }

    public List<TeamMemberDFH> getTeamMembers(Long teamId) {
        return teamMemberRepository.findByTeamId(teamId)
                .stream()
                .map(this::toMemberDFH)
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

        notificationService.createTeamInvite(invitedUser, team);
    }

    @Transactional
    public TeamFullDFH acceptInvite(Long notificationId, String currentUsername) {
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
            TeamMember teamMember = new TeamMember();
            teamMember.setTeam(team);
            teamMember.setPlayer(currentUser);
            teamMember.setRole("MEMBER");
            teamMemberRepository.save(teamMember);
        }

        notificationService.markAccepted(notification);

        boolean owner = team.getCaptain() != null && team.getCaptain().getId().equals(currentUser.getId());
        return toFullDFH(team, owner);
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

    private TeamShortDFH toShortDFH(Team team) {
        TeamShortDFH dfh = new TeamShortDFH();
        dfh.setId(team.getId());
        dfh.setName(team.getName());
        dfh.setCaptainUsername(team.getCaptain() != null ? team.getCaptain().getUsername() : null);
        dfh.setImageUrl(team.getImageUrl());
        return dfh;
    }

    private TeamMemberDFH toMemberDFH(TeamMember member) {
        TeamMemberDFH dfh = new TeamMemberDFH();
        dfh.setUserId(member.getPlayer().getId());
        dfh.setUsername(member.getPlayer().getUsername());
        dfh.setRole(member.getRole());
        dfh.setCountry(member.getPlayer().getCountry());
        dfh.setImageUrl(member.getPlayer().getImageUrl());
        dfh.setJoinedAt(member.getJoinedAt());
        return dfh;
    }

    private TeamFullDFH toFullDFH(Team team, boolean owner) {
        TeamFullDFH dfh = new TeamFullDFH();
        dfh.setId(team.getId());
        dfh.setName(team.getName());
        dfh.setCaptainId(team.getCaptain() != null ? team.getCaptain().getId() : null);
        dfh.setCaptainUsername(team.getCaptain() != null ? team.getCaptain().getUsername() : null);
        dfh.setImageUrl(team.getImageUrl());
        dfh.setCreatedAt(team.getCreatedAt());
        dfh.setOwner(owner);
        dfh.setMembers(getTeamMembers(team.getId()));
        return dfh;
    }
}