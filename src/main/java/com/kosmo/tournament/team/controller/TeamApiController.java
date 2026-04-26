package com.kosmo.tournament.team.controller;

import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kosmo.tournament.team.dto.AddTeamMemberDTO;
import com.kosmo.tournament.team.dto.CreateTeamDTO;
import com.kosmo.tournament.team.dto.InviteTeamMemberDTO;
import com.kosmo.tournament.team.dto.RemoveTeamMemberDTO;
import com.kosmo.tournament.team.dto.TeamFullDTO;
import com.kosmo.tournament.team.dto.TeamMemberDTO;
import com.kosmo.tournament.team.dto.TeamShortDTO;
import com.kosmo.tournament.team.service.TeamService;

@RestController
@RequestMapping("/api/teams")
public class TeamApiController {

    private final TeamService teamService;

    public TeamApiController(TeamService teamService) {
        this.teamService = teamService;
    }

    @GetMapping
    public List<TeamShortDTO> getAllTeams() {
        return teamService.getAllTeams();
    }

    @GetMapping("/my")
    public List<TeamShortDTO> getMyTeams(Authentication authentication) {
        if (authentication == null) {
            return List.of();
        }
        return teamService.getMyTeams(authentication.getName());
    }

    @GetMapping("/{id}")
    public TeamFullDTO getTeam(@PathVariable Long id, Authentication authentication) {
        String currentUsername = authentication != null ? authentication.getName() : null;
        return teamService.getTeamById(id, currentUsername);
    }

    @GetMapping("/{id}/members")
    public List<TeamMemberDTO> getMembers(@PathVariable Long id) {
        return teamService.getTeamMembers(id);
    }

    @PostMapping
    public TeamFullDTO createTeam(@RequestBody CreateTeamDTO dto,
                                  Authentication authentication) {
        return teamService.createTeam(dto, authentication.getName());
    }

    @PostMapping("/{id}/members")
    public TeamFullDTO addMember(@PathVariable Long id,
                                 @RequestBody AddTeamMemberDTO dto,
                                 Authentication authentication) {
        return teamService.addMember(id, dto, authentication.getName());
    }

    @DeleteMapping("/{id}/members")
    public TeamFullDTO removeMember(@PathVariable Long id,
                                    @RequestBody RemoveTeamMemberDTO dto,
                                    Authentication authentication) {
        return teamService.removeMember(id, dto.getUserId(), authentication.getName());
    }

    @PostMapping("/{id}/leave")
    public void leaveTeam(@PathVariable Long id, Authentication authentication) {
        teamService.leaveTeam(id, authentication.getName());
    }

    @PostMapping("/{id}/invite")
    public void inviteUser(@PathVariable Long id,
                           @RequestBody InviteTeamMemberDTO dto,
                           Authentication authentication) {
        teamService.inviteUserToTeam(id, dto.getUserId(), authentication.getName());
    }

    @PostMapping("/invite/{notificationId}/accept")
    public TeamFullDTO acceptInvite(@PathVariable Long notificationId,
                                    Authentication authentication) {
        return teamService.acceptInvite(notificationId, authentication.getName());
    }

    @PostMapping("/invite/{notificationId}/decline")
    public void declineInvite(@PathVariable Long notificationId,
                              Authentication authentication) {
        teamService.declineInvite(notificationId, authentication.getName());
    }
}
